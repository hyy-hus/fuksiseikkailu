import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Loader2, RefreshCw, Route as RouteIcon, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CheckpointPlacementAdmin, type AdminCheckpoint } from '@/components/CheckpointAdmin'
import { useCheckpoints, useSequenceRenumberCheckpoints, useUpdateCheckpoint } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { data: rawCheckpoints = [], isLoading, isError, error } = useCheckpoints()
    const updateCheckpointMutation = useUpdateCheckpoint()
    const sequenceMutation = useSequenceRenumberCheckpoints()

    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [optimisticOverrides, setOptimisticOverrides] = React.useState<
        Record<string, { latitude: number; longitude: number }>
    >({})

    // Map backend Checkpoint response objects to UI AdminCheckpoint interface
    const checkpoints = React.useMemo<AdminCheckpoint[]>(() => {
        return rawCheckpoints.map((cp) => {
            const override = optimisticOverrides[cp.id]
            return {
                id: cp.id,
                number: cp.number ?? undefined,
                name: cp.name,
                description: cp.checkpoint_description ?? undefined,
                requirements: cp.requirements ?? undefined,
                execution: cp.execution ?? undefined,
                latitude: override ? override.latitude : (cp.latitude ?? 0),
                longitude: override ? override.longitude : (cp.longitude ?? 0),
                category: cp.category ?? undefined,
            }
        })
    }, [rawCheckpoints, optimisticOverrides])

    const handleUpdateCheckpoints = React.useCallback(
        async (updatedList: AdminCheckpoint[]) => {
            const modified = updatedList.find((updatedCp) => {
                const current = checkpoints.find((cp) => cp.id === updatedCp.id)
                if (!current) return false
                return (
                    current.latitude !== updatedCp.latitude ||
                    current.longitude !== updatedCp.longitude
                )
            })

            if (!modified) return

            setOptimisticOverrides((prev) => ({
                ...prev,
                [modified.id]: {
                    latitude: modified.latitude,
                    longitude: modified.longitude,
                },
            }))

            const originalBackendItem = rawCheckpoints.find((cp) => cp.id === modified.id)
            if (!originalBackendItem) return

            try {
                await updateCheckpointMutation.mutateAsync({
                    path: { id: modified.id },
                    body: {
                        ...originalBackendItem,
                        latitude: modified.latitude,
                        longitude: modified.longitude,
                    },
                })
            } catch (err) {
                setOptimisticOverrides((prev) => {
                    const next = { ...prev }
                    delete next[modified.id]
                    return next
                })
                console.error('Failed to update checkpoint position:', err)
            }
        },
        [checkpoints, rawCheckpoints, updateCheckpointMutation]
    )

    const handleAutoSequence = async () => {
        await sequenceMutation.mutateAsync({
            body: {
                start_id: selectedId ?? undefined,
            },
        })
    }

    if (isLoading) {
        return (
            <div className={cn('flex h-full w-full items-center justify-center bg-white p-4 text-center')}>
                <div className={cn('flex flex-col items-center gap-2')}>
                    <RefreshCw className={cn('h-8 w-8 animate-spin text-black')} />
                    <p className={cn('text-sm font-bold uppercase text-black')}>
                        {t('checkpoints.loading', 'Loading Checkpoints...')}
                    </p>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className={cn('flex h-full w-full items-center justify-center bg-white p-4 text-center')}>
                <div className={cn('flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black shadow-2xs max-w-md')}>
                    <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600 stroke-[2.5]')} />
                    <div className={cn('text-left')}>
                        <p className={cn('font-extrabold uppercase')}>{t('checkpoints.loadErrorTitle', 'Failed to load checkpoints')}</p>
                        <p className={cn('mt-0.5 text-black/70')}>{error?.message || t('common.unexpectedError', 'An unexpected server error occurred.')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col min-h-0 h-full w-full max-w-7xl mx-auto gap-3">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-extrabold uppercase tracking-tight text-black">
                        {t('checkpointAdminTool', 'Checkpoint Admin Tool')}
                    </h1>
                    <p className="text-xs font-bold text-black/70">
                        {t('dragMarkersOnTheMapOrClickSetPositionToLocateUnsetCheckpoints', 'Drag markers on the map or click "Set Position" to locate unset checkpoints.')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAutoSequence}
                        disabled={sequenceMutation.isPending}
                        title={t('checkpoints.autoSequenceHint', 'Sequentially renumber checkpoints by nearest distance')}
                        className="flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {sequenceMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                        ) : (
                            <RouteIcon className="h-3.5 w-3.5 text-black" />
                        )}
                        {t('checkpoints.autoSequence', 'Auto-Sequence')}
                    </button>

                    <button
                        type="button"
                        onClick={() => console.log('Current Checkpoints:', checkpoints)}
                        className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-blush-pop-100 transition-colors cursor-pointer"
                    >
                        <Terminal className="h-3.5 w-3.5" />
                        {t('logActiveState', 'Log Active State')}
                    </button>
                </div>
            </header>

            <CheckpointPlacementAdmin
                checkpoints={checkpoints}
                onUpdateCheckpoints={handleUpdateCheckpoints}
                selectedId={selectedId}
                onSelectId={setSelectedId}
            />
        </div>
    )
}
