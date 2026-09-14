import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CheckpointPlacementAdmin } from '@/components/CheckpointAdmin'
import type { Checkpoint } from '@/components/CheckpointMap'
import { useCheckpoints, useUpdateCheckpoint } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { data: rawCheckpoints = [], isLoading, isError, error } = useCheckpoints()
    const updateCheckpointMutation = useUpdateCheckpoint()

    // Local optimistic state for immediate UI responsiveness
    const [optimisticOverrides, setOptimisticOverrides] = React.useState<
        Record<string, { latitude: number; longitude: number }>
    >({})

    // Merge server data with local optimistic position overrides
    const checkpoints = React.useMemo<Checkpoint[]>(() => {
        return rawCheckpoints.map((cp) => {
            const override = optimisticOverrides[cp.id]
            return {
                id: cp.id,
                number: cp.number ?? undefined,
                name: cp.name,
                description:
                    typeof cp.checkpoint_description === 'string'
                        ? cp.checkpoint_description
                        : cp.checkpoint_description
                            ? JSON.stringify(cp.checkpoint_description)
                            : undefined,
                latitude: override ? override.latitude : (cp.latitude ?? 0),
                longitude: override ? override.longitude : (cp.longitude ?? 0),
                category: cp.category ?? undefined,
            }
        })
    }, [rawCheckpoints, optimisticOverrides])

    const handleUpdateCheckpoints = React.useCallback(
        async (updatedList: Checkpoint[]) => {
            // Find which checkpoint moved
            const modified = updatedList.find((updatedCp) => {
                const current = checkpoints.find((cp) => cp.id === updatedCp.id)
                if (!current) return false
                return (
                    current.latitude !== updatedCp.latitude ||
                    current.longitude !== updatedCp.longitude
                )
            })

            if (!modified) return

            // 1. Instantly apply optimistic position to local state
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
                // 2. Perform background API update
                await updateCheckpointMutation.mutateAsync({
                    path: { id: modified.id },
                    body: {
                        ...originalBackendItem,
                        latitude: modified.latitude,
                        longitude: modified.longitude,
                    },
                })
            } catch (err) {
                // Revert optimistic update if API call fails
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
                <button
                    type="button"
                    onClick={() => console.log('Current Checkpoints:', checkpoints)}
                    className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-blush-pop-100 transition-colors cursor-pointer"
                >
                    <Terminal className="h-3.5 w-3.5" />
                    {t('logActiveState', 'Log Active State')}
                </button>
            </header>

            <CheckpointPlacementAdmin
                checkpoints={checkpoints}
                onUpdateCheckpoints={handleUpdateCheckpoints}
            />
        </div>
    )
}
