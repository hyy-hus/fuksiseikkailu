import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Marker, Popup, useMap } from '@vis.gl/react-maplibre'
import Supercluster from 'supercluster'
import type { PointFeature } from 'supercluster'
import {
    Accessibility,
    ExternalLink,
    Globe,
    Layers,
    MapPin,
    Search,
    X,
} from 'lucide-react'

import type { Checkpoint as ApiCheckpoint, PublicCheckpoint } from '@/api/generated/types.gen'
import { VectorMap } from './Map'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type BBox = [number, number, number, number]

export type MapCheckpoint = PublicCheckpoint | ApiCheckpoint

interface CheckpointProperties {
    cluster: false
    checkpoint: MapCheckpoint
}

type CheckpointFeature = PointFeature<CheckpointProperties>

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

function CheckpointSearch({
    checkpoints,
    onSelect,
}: {
    checkpoints: MapCheckpoint[]
    onSelect: (checkpoint: MapCheckpoint) => void
}) {
    const { t } = useTranslation()
    const { current: map } = useMap()
    const [query, setQuery] = React.useState('')
    const [isOpen, setIsOpen] = React.useState(false)

    const filtered = React.useMemo(() => {
        if (!query.trim()) return []
        const q = query.toLowerCase()
        return checkpoints.filter(
            (cp) =>
                cp.name.toLowerCase().includes(q) ||
                (cp.number !== undefined && cp.number !== null && cp.number.toString().includes(q)) ||
                (cp.location_name && cp.location_name.toLowerCase().includes(q))
        )
    }, [checkpoints, query])

    const handleSelect = (cp: MapCheckpoint) => {
        setQuery('')
        setIsOpen(false)
        onSelect(cp)

        map?.flyTo({
            center: [cp.longitude, cp.latitude],
            zoom: 16,
            speed: 1.4,
            essential: true,
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filtered.length > 0) {
            e.preventDefault()
            handleSelect(filtered[0])
        }
    }

    return (
        <div
            className={cn('absolute top-3 left-3 z-10 w-72')}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <div className={cn('relative flex items-center bg-surface-elevated shadow-md border-black border-2 backdrop-blur-sm')}>
                <Search className={cn('ml-3 h-4 w-4 text-text-muted shrink-0')} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('checkpointMap.searchPlaceholder', 'Search checkpoints...')}
                    className={cn('w-full bg-transparent px-3 py-2 text-base md:text-xs font-medium text-text-main placeholder-text-muted outline-none')}
                />
            </div>

            {isOpen && filtered.length > 0 && (
                <ul className={cn('max-h-60 overflow-auto bg-surface-elevated p-1 shadow-lg border-2 border-black backdrop-blur-sm border-t-0')}>
                    {filtered.map((cp, idx) => (
                        <li key={cp.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(cp)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-vintage-berry-100 transition-colors',
                                    idx === 0 && 'bg-black/5 font-bold'
                                )}
                            >
                                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-vintage-berry-800 text-[10px] font-bold text-white')}>
                                    {cp.number ?? '•'}
                                </span>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className={cn('truncate font-medium text-text-main')}>{cp.name}</span>
                                    {cp.location_name && (
                                        <span className="truncate text-[10px] text-text-muted">{cp.location_name}</span>
                                    )}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function CheckpointMarker({
    checkpoint,
    longitude,
    latitude,
    showNameLabel,
    onClick,
}: {
    checkpoint: MapCheckpoint
    longitude: number
    latitude: number
    showNameLabel: boolean
    onClick: (e: { originalEvent: MouseEvent }) => void
}) {
    const categoryKey = checkpoint.category && CATEGORY_COLORS[checkpoint.category]
        ? checkpoint.category
        : 'default'
    const colorClass = CATEGORY_COLORS[categoryKey]

    return (
        <Marker longitude={longitude} latitude={latitude} anchor="center" onClick={onClick}>
            <div className={cn('relative group flex flex-col items-center cursor-pointer')}>
                <div
                    className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md transition-transform hover:scale-110 border-2 border-black',
                        colorClass,
                        checkpoint.cancelled && 'line-through opacity-70 bg-gray-400'
                    )}
                >
                    {checkpoint.number ?? '•'}
                </div>

                {showNameLabel && (
                    <span className={cn('absolute top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-surface-elevated px-1.5 py-0.5 text-[11px] font-semibold text-text-main shadow-sm backdrop-blur-sm border-2 border-black')}>
                        {checkpoint.name}
                    </span>
                )}
            </div>
        </Marker>
    )
}

function ClusteredCheckpointMarkers({
    checkpoints,
    initialSelectedId,
    onCheckpointClick,
}: {
    checkpoints: MapCheckpoint[]
    initialSelectedId?: string
    onCheckpointClick?: (checkpoint: MapCheckpoint) => void
}) {
    const { t, i18n } = useTranslation()
    const { current: map } = useMap()
    const [bounds, setBounds] = React.useState<BBox | null>(null)
    const [zoom, setZoom] = React.useState<number>(13)
    const [selectedId, setSelectedId] = React.useState<string | null>(null)

    // Handle focus from URL parameter on initial load or parameter change
    React.useEffect(() => {
        if (!initialSelectedId || checkpoints.length === 0) return

        // Match by exact ID or by checkpoint number
        const matched = checkpoints.find(
            (cp) => cp.id === initialSelectedId || String(cp.number) === initialSelectedId
        )

        if (matched) {
            setSelectedId(matched.id)
            if (map && matched.longitude !== 0 && matched.latitude !== 0) {
                map.flyTo({
                    center: [matched.longitude, matched.latitude],
                    zoom: 16,
                    speed: 1.4,
                    essential: true,
                })
            }
        }
    }, [initialSelectedId, checkpoints, map])

    const selectedCheckpoint = React.useMemo(() => {
        if (!selectedId) return null
        return checkpoints.find((cp) => cp.id === selectedId) ?? null
    }, [checkpoints, selectedId])

    const supercluster = React.useMemo(() => {
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

        const handleMapClick = () => {
            setSelectedId(null)
        }

        map.on('move', updateViewState)
        map.on('zoom', updateViewState)
        map.on('click', handleMapClick)

        return () => {
            map.off('move', updateViewState)
            map.off('zoom', updateViewState)
            map.off('click', handleMapClick)
        }
    }, [map, updateViewState])

    const clusters = React.useMemo(() => {
        if (!bounds) return []
        return supercluster.getClusters(bounds, Math.floor(zoom))
    }, [supercluster, bounds, zoom])

    const handleSelectCheckpoint = (cp: MapCheckpoint) => {
        setSelectedId(cp.id)
        onCheckpointClick?.(cp)
    }

    const localizedPublicDescription = selectedCheckpoint
        ? parseAndGetLocalizedText(selectedCheckpoint.checkpoint_description, i18n.language)
        : ''

    const localizedOrgDescription = selectedCheckpoint
        ? parseAndGetLocalizedText(selectedCheckpoint.org_description, i18n.language)
        : ''

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

    return (
        <>
            <CheckpointSearch checkpoints={checkpoints} onSelect={handleSelectCheckpoint} />

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
                            key={`cluster-${clusterId}`}
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
                const showNameLabel = zoom >= 14 && !isSelected

                return (
                    <CheckpointMarker
                        key={`checkpoint-${cp.id}-${longitude}-${latitude}`}
                        checkpoint={cp}
                        longitude={longitude}
                        latitude={latitude}
                        showNameLabel={showNameLabel}
                        onClick={(e) => {
                            e.originalEvent.stopPropagation()
                            handleSelectCheckpoint(cp)
                        }}
                    />
                )
            })}

            {selectedCheckpoint && (
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

                        {/* Title Header */}
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

                                {/* Italic Category Subtitle */}
                                {selectedCheckpoint.category && (
                                    <span className="text-[11px] italic text-text-muted mt-0.5">
                                        {getCategoryLabel(selectedCheckpoint.category)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Location Name / Accessibility */}
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

                        {/* Public Checkpoint Description */}
                        {localizedPublicDescription ? (
                            <p className={cn('text-xs text-text-muted leading-relaxed border-t border-black/10 pt-2 whitespace-pre-line')}>
                                {localizedPublicDescription}
                            </p>
                        ) : !localizedOrgDescription && (
                            <p className={cn('text-[11px] italic text-text-muted/70 border-t border-black/10 pt-2')}>
                                {t('checkpoints.noDescription', 'No description provided.')}
                            </p>
                        )}

                        {/* Clean Organizer Description */}
                        {localizedOrgDescription && (
                            <div className="border-t border-black/10 pt-1.5 flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                    {t('checkpoints.organizerInfo', 'Organizer Info')}
                                </span>
                                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line italic">
                                    {localizedOrgDescription}
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
                    </div>
                </Popup>
            )}
        </>
    )
}

export function CheckpointMap({
    checkpoints,
    initialSelectedId,
    className,
    onCheckpointClick,
}: {
    checkpoints: MapCheckpoint[]
    initialSelectedId?: string
    className?: string
    onCheckpointClick?: (checkpoint: MapCheckpoint) => void
}) {
    return (
        <div className={cn('border-2 border-black h-full')}>
            <VectorMap className={className}>
                <ClusteredCheckpointMarkers
                    checkpoints={checkpoints}
                    initialSelectedId={initialSelectedId}
                    onCheckpointClick={onCheckpointClick}
                />
            </VectorMap>
        </div>
    )
}
