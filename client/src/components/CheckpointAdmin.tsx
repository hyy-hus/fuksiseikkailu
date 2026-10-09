import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Marker, Popup, useMap } from '@vis.gl/react-maplibre'
import type { MapMouseEvent } from 'maplibre-gl'
import Supercluster from 'supercluster'
import type { PointFeature } from 'supercluster'
import {
    Accessibility,
    AlertCircle,
    Check,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    ExternalLink,
    Globe,
    Layers,
    MapPin,
    Move,
    PlayCircle,
    X,
} from 'lucide-react'

import type { Checkpoint as ApiCheckpoint } from '@/api/generated/types.gen'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { VectorMap } from './Map'

type BBox = [number, number, number, number]

export type AdminCheckpoint = ApiCheckpoint & {
    color?: string
    icon?: React.ReactNode
    area_name?: string | null
}

interface CheckpointProperties {
    cluster: false
    checkpoint: AdminCheckpoint
}

type CheckpointFeature = PointFeature<CheckpointProperties>

interface CheckpointPlacementAdminProps {
    checkpoints: AdminCheckpoint[]
    onUpdateCheckpoints: (updated: AdminCheckpoint[]) => void
    selectedId?: string | null
    onSelectId?: (id: string | null) => void
}

const CATEGORY_COLORS: Record<string, string> = {
    subject: cn('bg-blue-400 text-black'),
    nation: cn('bg-pink-400 text-black'),
    hobby: cn('bg-emerald-400 text-black'),
    hyy: cn('bg-amber-400 text-black'),
    yliopisto: cn('bg-purple-400 text-black'),
    other: cn('bg-blush-pop-400 text-black'),
    default: cn('bg-zinc-200 text-black'),
}

function parseAndGetLocalizedText(value: unknown, currentLang: string): string {
    if (!value) return ''

    if (typeof value === 'object' && value !== null) {
        return getLocalizedText(value, currentLang)
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed)
                return getLocalizedText(parsed, currentLang)
            } catch {
                return value
            }
        }
        return value
    }

    return getLocalizedText(value, currentLang)
}

function AdminClusteredMarkers({
    checkpoints,
    selectedId,
    onSelectCheckpoint,
    onDragEnd,
}: {
    checkpoints: AdminCheckpoint[]
    selectedId: string | null
    onSelectCheckpoint: (id: string | null) => void
    onDragEnd: (id: string, lng: number, lat: number) => void
}) {
    const { current: map } = useMap()
    const [bounds, setBounds] = React.useState<BBox | null>(null)
    const [zoom, setZoom] = React.useState<number>(13)

    const validCheckpoints = React.useMemo(
        () => checkpoints.filter((cp) => cp.latitude !== 0 && cp.longitude !== 0),
        [checkpoints]
    )

    const supercluster = React.useMemo(() => {
        const SuperclusterConstructor = ((Supercluster as unknown as { default: typeof Supercluster }).default || Supercluster) as typeof Supercluster
        const sc = new SuperclusterConstructor<CheckpointProperties>({
            radius: 40,
            maxZoom: 16,
        })

        const features: CheckpointFeature[] = validCheckpoints.map((cp) => ({
            type: 'Feature',
            properties: { cluster: false, checkpoint: cp },
            geometry: {
                type: 'Point',
                coordinates: [cp.longitude, cp.latitude],
            },
        }))

        sc.load(features)
        return sc
    }, [validCheckpoints])

    const updateViewState = React.useCallback(() => {
        if (!map) return
        const mapBounds = map.getBounds()
        setBounds([
            mapBounds.getWest(),
            mapBounds.getSouth(),
            mapBounds.getEast(),
            mapBounds.getNorth(),
        ])
        setZoom(map.getZoom())
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

    return (
        <>
            {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates
                const properties = cluster.properties

                if (properties.cluster) {
                    const clusterId = cluster.id as number
                    const pointCount = properties.point_count

                    const sizeClass =
                        pointCount > 20
                            ? 'h-12 w-12 text-sm'
                            : pointCount > 10
                                ? 'h-11 w-11 text-xs'
                                : 'h-10 w-10 text-xs'

                    return (
                        <Marker
                            key={`admin-cluster-${clusterId}`}
                            longitude={longitude}
                            latitude={latitude}
                            anchor="center"
                            style={{ zIndex: 30 }}
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
                            <div
                                className={cn(
                                    'relative flex items-center justify-center rounded-2xl border-2 border-black bg-amber-300 font-black text-black shadow-xl transition-all hover:scale-115 cursor-pointer ring-2 ring-white/80',
                                    sizeClass
                                )}
                            >
                                <div className="flex flex-col items-center justify-center leading-none">
                                    <Layers className="h-3 w-3 stroke-[3] mb-0.5 text-black/80" />
                                    <span>{pointCount}</span>
                                </div>
                            </div>
                        </Marker>
                    )
                }

                const cp = properties.checkpoint
                const isSelected = selectedId === cp.id

                const categoryKey = cp.category && CATEGORY_COLORS[cp.category]
                    ? cp.category
                    : 'default'
                const markerColorClass = CATEGORY_COLORS[categoryKey]

                return (
                    <Marker
                        key={cp.id}
                        longitude={cp.longitude}
                        latitude={cp.latitude}
                        draggable
                        anchor="center"
                        onDragEnd={(e) => onDragEnd(cp.id, e.lngLat.lng, e.lngLat.lat)}
                        onClick={(e) => {
                            e.originalEvent.stopPropagation()
                            onSelectCheckpoint(cp.id)
                        }}
                    >
                        <div className={cn('relative group flex flex-col items-center cursor-grab active:cursor-grabbing')}>
                            <div
                                className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-full border-2 border-black text-xs font-bold shadow-md transition-transform hover:scale-110 [&>svg]:h-4 [&>svg]:w-4',
                                    markerColorClass,
                                    isSelected && 'ring-4 ring-black/40 scale-110'
                                )}
                                style={cp.color ? { backgroundColor: cp.color } : undefined}
                            >
                                {cp.icon ?? cp.number ?? '•'}
                            </div>

                            <span className={cn('absolute top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-white px-2 py-0.5 text-xs font-bold text-black shadow-sm border-2 border-black')}>
                                {cp.name}
                            </span>
                        </div>
                    </Marker>
                )
            })}
        </>
    )
}

export function CheckpointPlacementAdmin({
    checkpoints,
    onUpdateCheckpoints,
    selectedId: externalSelectedId,
    onSelectId: externalOnSelectId,
}: CheckpointPlacementAdminProps) {
    const { t, i18n } = useTranslation()
    const [internalSelectedId, setInternalSelectedId] = React.useState<string | null>(null)
    const [placingId, setPlacingId] = React.useState<string | null>(null)

    const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId
    const setSelectedId = (id: string | null) => {
        if (externalOnSelectId) {
            externalOnSelectId(id)
        } else {
            setInternalSelectedId(id)
        }
    }

    const selectedCheckpoint = checkpoints.find((cp) => cp.id === selectedId)
    const placingCheckpoint = checkpoints.find((cp) => cp.id === placingId)

    const handleMapClick = (e: MapMouseEvent) => {
        if (!placingId) {
            setSelectedId(null)
            return
        }

        const { lng, lat } = e.lngLat
        const updated = checkpoints.map((cp) =>
            cp.id === placingId ? { ...cp, longitude: lng, latitude: lat } : cp
        )

        onUpdateCheckpoints(updated)
        setSelectedId(placingId)
        setPlacingId(null)
    }

    const handleDragEnd = (id: string, lng: number, lat: number) => {
        const updated = checkpoints.map((cp) =>
            cp.id === id ? { ...cp, longitude: lng, latitude: lat } : cp
        )
        onUpdateCheckpoints(updated)
    }

    const getCategoryLabel = (category?: string | null) => {
        if (!category) return ''
        return t(`checkpoints.categories.${category}`, {
            defaultValue:
                category === 'subject'
                    ? 'Subject Organization'
                    : category === 'nation'
                        ? 'Student Nation'
                        : category === 'hobby'
                            ? 'Hobby Organization'
                            : category === 'hyy'
                                ? 'HYY'
                                : category === 'yliopisto'
                                    ? 'University'
                                    : category,
        })
    }

    const selectedPublicDesc = selectedCheckpoint
        ? parseAndGetLocalizedText(selectedCheckpoint.checkpoint_description, i18n.language)
        : ''
    const selectedOrgDesc = selectedCheckpoint
        ? parseAndGetLocalizedText(selectedCheckpoint.org_description, i18n.language)
        : ''

    return (
        <div className={cn('flex h-full min-h-0 flex-1 w-full overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Sidebar List */}
            <div className={cn('flex w-96 lg:w-[420px] shrink-0 flex-col border-r-2 border-black bg-white min-h-0')}>
                <div className={cn('border-b-2 border-black p-4 shrink-0 bg-white')}>
                    <h3 className={cn('font-extrabold text-base uppercase tracking-tight text-black')}>
                        {t('checkpoints.locationsTitle', 'Checkpoint Locations')}
                    </h3>
                    <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                        {t('checkpoints.locationsSubtitle', 'Select a checkpoint to expand details, or click the map to set/move its position.')}
                    </p>
                </div>

                <div className={cn('flex-1 overflow-y-auto min-h-0 divide-y-0')}>
                    {checkpoints.map((cp, idx) => {
                        const hasLocation = cp.latitude !== 0 && cp.longitude !== 0
                        const isSelected = selectedId === cp.id
                        const isPlacing = placingId === cp.id

                        const categoryKey = cp.category && CATEGORY_COLORS[cp.category]
                            ? cp.category
                            : 'default'
                        const badgeColorClass = CATEGORY_COLORS[categoryKey]

                        const publicDesc = parseAndGetLocalizedText(cp.checkpoint_description, i18n.language)
                        const orgDesc = parseAndGetLocalizedText(cp.org_description, i18n.language)
                        const reqs = parseAndGetLocalizedText(cp.requirements, i18n.language)
                        const exec = parseAndGetLocalizedText(cp.execution, i18n.language)

                        return (
                            <React.Fragment key={cp.id}>
                                <div
                                    onClick={() => {
                                        setSelectedId(isSelected ? null : cp.id)
                                        if (!hasLocation && !isSelected) setPlacingId(cp.id)
                                    }}
                                    className={cn(
                                        'flex flex-col gap-2.5 p-4 cursor-pointer transition-colors bg-white',
                                        isPlacing
                                            ? 'bg-amber-100'
                                            : isSelected
                                                ? 'bg-blush-pop-50/70'
                                                : 'hover:bg-black/5'
                                    )}
                                >
                                    <div className={cn('flex items-start justify-between gap-2')}>
                                        <div className={cn('flex items-center gap-2.5 min-w-0')}>
                                            <span
                                                className={cn(
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black text-xs font-bold shadow-2xs [&>svg]:h-3.5 [&>svg]:w-3.5',
                                                    badgeColorClass
                                                )}
                                            >
                                                {cp.icon ?? cp.number ?? '•'}
                                            </span>
                                            <div className={cn('flex flex-col min-w-0')}>
                                                <span className={cn('font-bold text-sm text-black leading-tight truncate')}>
                                                    {cp.name}
                                                </span>

                                                {(cp.category || cp.area_name) && (
                                                    <span className={cn('mt-0.5 text-[11px] italic text-black/60 truncate')}>
                                                        {[getCategoryLabel(cp.category), cp.area_name].filter(Boolean).join(' • ')}
                                                    </span>
                                                )}

                                                {cp.location_name && (
                                                    <span className="flex items-center gap-1 text-[11px] font-medium text-black/70 mt-0.5 truncate">
                                                        <MapPin className="h-3 w-3 text-black shrink-0" />
                                                        <span className="truncate">{cp.location_name}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn('flex items-center gap-1.5 shrink-0')}>
                                            {hasLocation ? (
                                                <span className={cn('flex items-center text-[10px] font-bold text-black bg-emerald-300 px-2 py-0.5 rounded border border-black')}>
                                                    <Check className={cn('mr-1 h-3 w-3 stroke-[3]')} />
                                                    {t('common.placed', 'Placed')}
                                                </span>
                                            ) : (
                                                <span className={cn('flex items-center text-[10px] font-bold text-black bg-amber-300 px-2 py-0.5 rounded border border-black')}>
                                                    <AlertCircle className={cn('mr-1 h-3 w-3 stroke-[3]')} />
                                                    {t('common.unset', 'Unset')}
                                                </span>
                                            )}
                                            {isSelected ? (
                                                <ChevronUp className={cn('h-4 w-4 text-black')} />
                                            ) : (
                                                <ChevronDown className={cn('h-4 w-4 text-black/40')} />
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className={cn('flex flex-col gap-2 pt-1.5 border-t border-black/10 text-xs')}>
                                            {/* Public Description */}
                                            {publicDesc && (
                                                <p className="text-black/80 font-medium leading-relaxed whitespace-pre-line text-xs">
                                                    {publicDesc}
                                                </p>
                                            )}

                                            {/* Organizer Info */}
                                            {orgDesc && (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/60">
                                                        {t('checkpoints.organizerInfo', 'Organizer Info')}
                                                    </span>
                                                    <p className="text-black/80 font-medium leading-relaxed whitespace-pre-line italic text-xs">
                                                        {orgDesc}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Requirements */}
                                            {reqs && (
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-black/60">
                                                        <ClipboardList className="h-3 w-3 text-black shrink-0" />
                                                        {t('checkpoints.requirements', 'Requirements')}
                                                    </span>
                                                    <p className={cn('text-black/80 font-medium leading-relaxed whitespace-pre-line pl-4')}>
                                                        {reqs}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Execution Guidelines */}
                                            {exec && (
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-black/60">
                                                        <PlayCircle className="h-3 w-3 text-black shrink-0" />
                                                        {t('checkpoints.execution', 'Execution Guidelines')}
                                                    </span>
                                                    <p className={cn('text-black/80 font-medium leading-relaxed whitespace-pre-line pl-4')}>
                                                        {exec}
                                                    </p>
                                                </div>
                                            )}

                                            {!publicDesc && !orgDesc && !reqs && !exec && (
                                                <p className={cn('text-black/40 italic text-[11px]')}>
                                                    {t('checkpoints.noAdminDetails', 'No details specified.')}
                                                </p>
                                            )}

                                            {hasLocation && (
                                                <div className={cn('flex items-center gap-3 text-[11px] font-mono font-bold text-black/70 bg-black/5 p-1.5 rounded border border-black/10 mt-1')}>
                                                    <span>{t('lat', 'Lat:')} {cp.latitude.toFixed(5)}</span>
                                                    <span>{t('lng', 'Lng:')} {cp.longitude.toFixed(5)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={cn('flex items-center gap-2 pt-1')}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedId(cp.id)
                                                setPlacingId(isPlacing ? null : cp.id)
                                            }}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-extrabold border-2 border-black transition-colors shadow-2xs',
                                                isPlacing
                                                    ? 'bg-amber-400 text-black'
                                                    : 'bg-white text-black hover:bg-blush-pop-100'
                                            )}
                                        >
                                            <MapPin className={cn('h-3.5 w-3.5')} />
                                            {isPlacing
                                                ? t('checkpoints.clickMapToPlace', 'Click Map to Place...')
                                                : hasLocation
                                                    ? t('checkpoints.reposition', 'Reposition')
                                                    : t('checkpoints.setPosition', 'Set Position')}
                                        </button>
                                    </div>
                                </div>

                                {idx < checkpoints.length - 1 && (
                                    <div className={cn('mx-4 border-b border-black/20')} />
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* Map View Container */}
            <div className={cn('relative flex-1 min-h-0 overflow-hidden')}>
                {placingCheckpoint && (
                    <div className={cn('absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-xl border-2 border-white')}>
                        <Move className={cn('h-4 w-4 animate-bounce text-amber-400')} />
                        {t('checkpoints.clickMapInstruction', 'Click anywhere on the map to place "{{name}}"', { name: placingCheckpoint.name })}
                    </div>
                )}

                <VectorMap
                    className={cn(placingId && 'cursor-crosshair')}
                    onClick={handleMapClick}
                >
                    <AdminClusteredMarkers
                        checkpoints={checkpoints}
                        selectedId={selectedId}
                        onSelectCheckpoint={setSelectedId}
                        onDragEnd={handleDragEnd}
                    />

                    {selectedCheckpoint && selectedCheckpoint.latitude !== 0 && (
                        <Popup
                            longitude={selectedCheckpoint.longitude}
                            latitude={selectedCheckpoint.latitude}
                            anchor="bottom"
                            offset={18}
                            onClose={() => setSelectedId(null)}
                            closeOnClick={true}
                            focusAfterOpen={false}
                            className={cn('[&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:rounded-xl [&_.maplibregl-popup-content]:shadow-xl [&_.maplibregl-popup-content]:border-2 [&_.maplibregl-popup-content]:border-black [&_.maplibregl-popup-close-button]:hidden')}
                        >
                            <div className={cn('relative min-w-[220px] max-w-xs p-3.5 bg-surface-elevated rounded-xl flex flex-col gap-2')}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(null)}
                                    title={t('common.close', 'Close')}
                                    className={cn('absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-text-muted hover:bg-black/10 hover:text-text-main transition-colors')}
                                >
                                    <X className={cn('h-3.5 w-3.5')} />
                                </button>

                                {/* Title Header: Circle Number + Name */}
                                <div className={cn('flex items-start gap-2.5 pr-6')}>
                                    <span className={cn(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border border-black shadow-xs',
                                        CATEGORY_COLORS[selectedCheckpoint.category || 'default']
                                    )}>
                                        {selectedCheckpoint.number ?? '•'}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                                            <h4 className={cn('font-bold text-sm text-text-main')}>
                                                {selectedCheckpoint.name}
                                            </h4>
                                            {selectedCheckpoint.cancelled && (
                                                <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-rose-600 text-white border border-black">
                                                    {t('checkpoints.cancelled', 'Cancelled')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Subtitle: Category • Area */}
                                        {(selectedCheckpoint.category || selectedCheckpoint.area_name) && (
                                            <span className="text-[11px] italic text-text-muted mt-0.5">
                                                {[getCategoryLabel(selectedCheckpoint.category), selectedCheckpoint.area_name].filter(Boolean).join(' • ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Location Name / Address & Accessibility */}
                                {(selectedCheckpoint.location_name || selectedCheckpoint.accessible !== undefined) && (
                                    <div className="flex items-center justify-between text-xs font-medium text-text-muted border-t border-black/10 pt-1.5">
                                        {selectedCheckpoint.location_name ? (
                                            <div className="flex items-center gap-1 min-w-0 truncate">
                                                <MapPin className="h-3.5 w-3.5 text-black shrink-0" />
                                                <span className="truncate">{selectedCheckpoint.location_name}</span>
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        {selectedCheckpoint.accessible && (
                                            <div className="flex items-center gap-1 text-emerald-700 shrink-0 font-bold text-[10px]" title={t('checkpoints.accessible', 'Wheelchair Accessible')}>
                                                <Accessibility className="h-3.5 w-3.5 stroke-[2.5]" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Public Description */}
                                {selectedPublicDesc ? (
                                    <p className={cn('text-xs text-text-muted leading-relaxed border-t border-black/10 pt-2 whitespace-pre-line')}>
                                        {selectedPublicDesc}
                                    </p>
                                ) : !selectedOrgDesc && (
                                    <p className={cn('text-[11px] italic text-text-muted/70 border-t border-black/10 pt-2')}>
                                        {t('checkpoints.noDescription', 'No description provided.')}
                                    </p>
                                )}

                                {/* Organizer Info */}
                                {selectedOrgDesc && (
                                    <div className="border-t border-black/10 pt-1.5 flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                            {t('checkpoints.organizerInfo', 'Organizer Info')}
                                        </span>
                                        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line italic">
                                            {selectedOrgDesc}
                                        </p>
                                    </div>
                                )}

                                {/* External Link Button */}
                                {selectedCheckpoint.url && (
                                    <a
                                        href={selectedCheckpoint.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center justify-center gap-1.5 rounded-md border-2 border-black bg-amber-400 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors"
                                    >
                                        <Globe className="h-3.5 w-3.5 text-black" />
                                        <span>{t('checkpoints.visitWebsite', 'Visit Website')}</span>
                                        <ExternalLink className="h-3 w-3 text-black/70" />
                                    </a>
                                )}

                                {/* Coordinates Footer */}
                                <div className={cn('mt-1 flex items-center gap-3 text-[10px] font-mono font-bold text-black/70 bg-black/5 p-1.5 rounded border border-black/10')}>
                                    <span>{t('lat', 'Lat:')} {selectedCheckpoint.latitude.toFixed(5)}</span>
                                    <span>{t('lng', 'Lng:')} {selectedCheckpoint.longitude.toFixed(5)}</span>
                                </div>
                            </div>
                        </Popup>
                    )}
                </VectorMap>
            </div>
        </div>
    )
}
