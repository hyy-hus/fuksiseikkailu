import * as React from 'react'
import { Marker, Popup } from '@vis.gl/react-maplibre'
import type { MapMouseEvent } from 'maplibre-gl'
import { MapPin, Move, Check, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Checkpoint } from './CheckpointMap'
import { VectorMap } from './Map'

interface CheckpointPlacementAdminProps {
    checkpoints: Checkpoint[]
    onUpdateCheckpoints: (updated: Checkpoint[]) => void
}

export function CheckpointPlacementAdmin({
    checkpoints,
    onUpdateCheckpoints,
}: CheckpointPlacementAdminProps) {
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [placingId, setPlacingId] = React.useState<string | null>(null)

    const selectedCheckpoint = checkpoints.find((cp) => cp.id === selectedId)
    const placingCheckpoint = checkpoints.find((cp) => cp.id === placingId)

    // Handle direct map click placement
    const handleMapClick = (e: MapMouseEvent) => {
        if (!placingId) return

        const { lng, lat } = e.lngLat
        const updated = checkpoints.map((cp) =>
            cp.id === placingId ? { ...cp, longitude: lng, latitude: lat } : cp
        )

        onUpdateCheckpoints(updated)
        setSelectedId(placingId)
        setPlacingId(null) // Exit placement targeting mode after placing
    }

    // Handle marker repositioning via drag
    const handleDragEnd = (id: string, lng: number, lat: number) => {
        const updated = checkpoints.map((cp) =>
            cp.id === id ? { ...cp, longitude: lng, latitude: lat } : cp
        )
        onUpdateCheckpoints(updated)
    }

    return (
        <div className="flex h-full min-h-0 flex-1 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated shadow-sm">
            {/* Sidebar List */}
            <div className="flex w-96 lg:w-[420px] shrink-0 flex-col border-r border-border-subtle bg-surface-base min-h-0">
                <div className="border-b border-border-subtle p-4 shrink-0">
                    <h3 className="font-bold text-text-main">Checkpoint Locations</h3>
                    <p className="mt-1 text-xs text-text-muted">
                        Select a checkpoint to expand details, or click the map to set/move its position.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                    {checkpoints.map((cp) => {
                        const hasLocation = cp.latitude !== 0 && cp.longitude !== 0
                        const isSelected = selectedId === cp.id
                        const isPlacing = placingId === cp.id

                        return (
                            <div
                                key={cp.id}
                                onClick={() => {
                                    setSelectedId(isSelected ? null : cp.id)
                                    if (!hasLocation && !isSelected) setPlacingId(cp.id)
                                }}
                                className={cn(
                                    'flex flex-col gap-2.5 rounded-lg border p-3.5 cursor-pointer transition-all',
                                    isPlacing
                                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                                        : isSelected
                                            ? 'border-vintage-berry-500 bg-vintage-berry-100/50 shadow-sm'
                                            : 'border-border-subtle bg-surface-elevated hover:border-vintage-berry-300'
                                )}
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vintage-berry-800 text-xs font-bold text-white shadow-xs [&>svg]:h-3.5 [&>svg]:w-3.5">
                                            {cp.icon ?? cp.number ?? '•'}
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-text-main leading-tight">
                                                {cp.name}
                                            </span>
                                            {cp.category && (
                                                <span className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                                                    {cp.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {hasLocation ? (
                                            <span className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                <Check className="mr-1 h-3 w-3" /> Placed
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                <AlertCircle className="mr-1 h-3 w-3" /> Unset
                                            </span>
                                        )}
                                        {isSelected ? (
                                            <ChevronUp className="h-4 w-4 text-text-muted" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-text-muted" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details Body */}
                                {isSelected && (
                                    <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle/60 text-xs">
                                        {cp.description ? (
                                            <p className="text-text-muted leading-relaxed whitespace-pre-line">
                                                {cp.description}
                                            </p>
                                        ) : (
                                            <p className="text-text-muted italic text-[11px]">No description provided.</p>
                                        )}

                                        {hasLocation && (
                                            <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted bg-surface-base/80 p-1.5 rounded border border-border-subtle/40">
                                                <span>Lat: {cp.latitude.toFixed(5)}</span>
                                                <span>Lng: {cp.longitude.toFixed(5)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions Footer */}
                                <div className="flex items-center gap-2 pt-1.5 border-t border-border-subtle/60">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedId(cp.id)
                                            setPlacingId(isPlacing ? null : cp.id)
                                        }}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-1.5 rounded py-1.5 text-xs font-semibold transition-colors',
                                            isPlacing
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-vintage-berry-100 text-text-main hover:bg-vintage-berry-200'
                                        )}
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        {isPlacing ? 'Click Map to Place...' : hasLocation ? 'Reposition' : 'Set Position'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Map View Area */}
            <div className="relative flex-1 min-h-0">
                {placingCheckpoint && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-vintage-berry-950/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm border border-vintage-berry-800">
                        <Move className="h-4 w-4 animate-bounce text-amber-400" />
                        Click anywhere on the map to place "{placingCheckpoint.name}"
                    </div>
                )}

                <VectorMap
                    className={cn(placingId && 'cursor-crosshair')}
                    onClick={handleMapClick}
                >
                    {checkpoints.map((cp) => {
                        if (!cp.latitude || !cp.longitude) return null
                        const isSelected = selectedId === cp.id

                        return (
                            <Marker
                                key={cp.id}
                                longitude={cp.longitude}
                                latitude={cp.latitude}
                                draggable
                                /* FIXED: Anchor at 'center' so click coordinate matches circle midpoint exactly */
                                anchor="center"
                                onDragEnd={(e) => handleDragEnd(cp.id, e.lngLat.lng, e.lngLat.lat)}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation()
                                    setSelectedId(cp.id)
                                }}
                            >
                                <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
                                    <div
                                        className={cn(
                                            'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition-transform hover:scale-110 [&>svg]:h-4 [&>svg]:w-4',
                                            isSelected
                                                ? 'bg-vintage-berry-600 text-white border-white ring-4 ring-vintage-berry-500/30 scale-110'
                                                : 'bg-vintage-berry-800 text-white border-white'
                                        )}
                                    >
                                        {cp.icon ?? cp.number ?? '•'}
                                    </div>

                                    {/* Absolute positioning prevents shifting the pin container height */}
                                    <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap rounded bg-surface-elevated/95 px-2 py-0.5 text-xs font-semibold text-text-main shadow-sm border border-border-subtle">
                                        {cp.name}
                                    </span>
                                </div>
                            </Marker>
                        )
                    })}

                    {selectedCheckpoint && selectedCheckpoint.latitude !== 0 && (
                        <Popup
                            longitude={selectedCheckpoint.longitude}
                            latitude={selectedCheckpoint.latitude}
                            anchor="bottom"
                            offset={18}
                            onClose={() => setSelectedId(null)}
                            closeOnClick={true}
                            focusAfterOpen={false}
                            /* FIXED: Applied custom theme overrides to remove MapLibre white box padding */
                            className="[&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:rounded-xl [&_.maplibregl-popup-content]:shadow-xl [&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-border-subtle [&_.maplibregl-popup-close-button]:hidden"
                        >
                            <div className="relative min-w-[200px] max-w-xs p-3.5 bg-surface-elevated rounded-xl">
                                {/* Custom Close Button */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(null)}
                                    className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-text-muted hover:bg-vintage-berry-100 hover:text-text-main transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>

                                <div className="flex items-center gap-2.5 pr-6">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vintage-berry-800 text-xs font-bold text-white shadow-xs [&>svg]:h-3.5 [&>svg]:w-3.5">
                                        {selectedCheckpoint.icon ?? selectedCheckpoint.number ?? '•'}
                                    </span>
                                    <h4 className="font-bold text-sm text-text-main leading-tight">
                                        {selectedCheckpoint.name}
                                    </h4>
                                </div>

                                {selectedCheckpoint.description && (
                                    <p className="mt-2 text-xs text-text-muted leading-relaxed border-t border-border-subtle/50 pt-2">
                                        {selectedCheckpoint.description}
                                    </p>
                                )}

                                <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-text-muted bg-surface-base/80 p-1.5 rounded border border-border-subtle/40">
                                    <span>Lat: {selectedCheckpoint.latitude.toFixed(5)}</span>
                                    <span>Lng: {selectedCheckpoint.longitude.toFixed(5)}</span>
                                </div>
                            </div>
                        </Popup>
                    )}
                </VectorMap>
            </div>
        </div>
    )
}
