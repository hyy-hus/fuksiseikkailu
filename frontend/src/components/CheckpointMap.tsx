import * as React from 'react'
import { Marker, Popup, useMap } from '@vis.gl/react-maplibre'
import Supercluster from 'supercluster'
import type { PointFeature } from 'supercluster'
import { VectorMap } from './Map'
import { cn } from '@/lib/utils'

type BBox = [number, number, number, number]

export interface Checkpoint {
    id: string
    number: number
    name: string
    description?: string
    latitude: number
    longitude: number
    category?: 'academic' | 'party' | 'sports' | 'default'
    color?: string
}

interface CheckpointProperties {
    cluster: false
    checkpoint: Checkpoint
}

type CheckpointFeature = PointFeature<CheckpointProperties>

const CATEGORY_COLORS: Record<string, string> = {
    academic: 'bg-blue-600 text-white border-blue-200',
    party: 'bg-pink-600 text-white border-pink-200',
    sports: 'bg-emerald-600 text-white border-emerald-200',
    default: 'bg-slate-800 text-white border-slate-200',
}

function CheckpointMarker({
    checkpoint,
    longitude,
    latitude,
    showNameLabel,
    onClick,
}: {
    checkpoint: Checkpoint
    longitude: number
    latitude: number
    showNameLabel: boolean
    onClick: (e: { originalEvent: MouseEvent }) => void
}) {
    const colorClass = CATEGORY_COLORS[checkpoint.category || 'default']

    return (
        <Marker
            longitude={longitude}
            latitude={latitude}
            anchor="bottom"
            onClick={onClick}
        >
            <div className="group flex flex-col items-center cursor-pointer">
                <div
                    className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition-transform hover:scale-110',
                        colorClass
                    )}
                    style={checkpoint.color ? { backgroundColor: checkpoint.color } : undefined}
                >
                    {checkpoint.number}
                </div>

                {showNameLabel && (
                    <span className="mt-1 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm border border-slate-200">
                        {checkpoint.name}
                    </span>
                )}
            </div>
        </Marker>
    )
}

function ClusteredCheckpointMarkers({
    checkpoints,
    onCheckpointClick,
}: {
    checkpoints: Checkpoint[]
    onCheckpointClick?: (checkpoint: Checkpoint) => void
}) {
    const { current: map } = useMap()
    const [bounds, setBounds] = React.useState<BBox | null>(null)
    const [zoom, setZoom] = React.useState<number>(13)
    const [selectedCheckpoint, setSelectedCheckpoint] = React.useState<Checkpoint | null>(null)

    const supercluster = React.useMemo(() => {
        // Cast to typeof Supercluster to retain type definitions and generic parameters
        const SuperclusterConstructor = ((Supercluster as unknown as { default: typeof Supercluster }).default || Supercluster) as typeof Supercluster

        const sc = new SuperclusterConstructor<CheckpointProperties>({
            radius: 40,
            maxZoom: 16,
        })

        const features: CheckpointFeature[] = checkpoints.map((cp) => ({
            type: 'Feature',
            properties: { cluster: false, checkpoint: cp },
            geometry: {
                type: 'Point',
                coordinates: [cp.longitude, cp.latitude],
            },
        }))

        sc.load(features)
        return sc
    }, [checkpoints])

    const updateViewState = React.useCallback(() => {
        if (!map) return
        const mapBounds = map.getBounds()
        const currentZoom = map.getZoom()

        setBounds([
            mapBounds.getWest(),
            mapBounds.getSouth(),
            mapBounds.getEast(),
            mapBounds.getNorth(),
        ])
        setZoom(currentZoom)
    }, [map])

    React.useEffect(() => {
        if (!map) return

        updateViewState()
        map.on('move', updateViewState)
        map.on('zoom', updateViewState)

        return () => {
            map.off('move', updateViewState)
            map.off('zoom', updateViewState)
        }
    }, [map, updateViewState])

    const clusters = React.useMemo(() => {
        if (!bounds) return []
        return supercluster.getClusters(bounds, Math.floor(zoom))
    }, [supercluster, bounds, zoom])

    const showNameLabel = zoom >= 14

    return (
        <>
            {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates
                const properties = cluster.properties

                if (properties.cluster) {
                    const clusterId = cluster.id as number
                    const pointCount = properties.point_count

                    return (
                        <Marker
                            key={`cluster-${clusterId}`}
                            longitude={longitude}
                            latitude={latitude}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation()
                                const expansionZoom = Math.min(
                                    supercluster.getClusterExpansionZoom(clusterId),
                                    18
                                )
                                map?.flyTo({
                                    center: [longitude, latitude],
                                    zoom: expansionZoom,
                                    speed: 1.2,
                                })
                            }}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-pink-600 font-bold text-white shadow-lg transition-transform hover:scale-110 cursor-pointer">
                                {pointCount}
                            </div>
                        </Marker>
                    )
                }

                const cp = properties.checkpoint

                return (
                    <CheckpointMarker
                        key={`checkpoint-${cp.id}-${longitude}-${latitude}`}
                        checkpoint={cp}
                        longitude={longitude}
                        latitude={latitude}
                        showNameLabel={showNameLabel}
                        onClick={(e) => {
                            e.originalEvent.stopPropagation()
                            setSelectedCheckpoint(cp)
                            onCheckpointClick?.(cp)
                        }}
                    />
                )
            })}

            {selectedCheckpoint && (
                <Popup
                    longitude={selectedCheckpoint.longitude}
                    latitude={selectedCheckpoint.latitude}
                    anchor="top"
                    onClose={() => setSelectedCheckpoint(null)}
                    closeOnClick={false}
                >
                    <div className="p-1 max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                                {selectedCheckpoint.number}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">{selectedCheckpoint.name}</h4>
                        </div>
                        {selectedCheckpoint.description && (
                            <p className="text-xs text-slate-600 leading-snug">{selectedCheckpoint.description}</p>
                        )}
                    </div>
                </Popup>
            )}
        </>
    )
}

export function CheckpointMap({
    checkpoints,
    className,
    onCheckpointClick,
}: {
    checkpoints: Checkpoint[]
    className?: string
    onCheckpointClick?: (checkpoint: Checkpoint) => void
}) {
    return (
        <VectorMap className={className}>
            <ClusteredCheckpointMarkers checkpoints={checkpoints} onCheckpointClick={onCheckpointClick} />
        </VectorMap>
    )
}
