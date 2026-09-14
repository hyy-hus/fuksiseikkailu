import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CheckpointMap, type Checkpoint } from '@/components/CheckpointMap'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { data: checkpoints = [], isLoading, isError, error } = useCheckpoints()

    // Map backend Checkpoint API response objects to CheckpointMap interface
    const mapCheckpoints = React.useMemo<Checkpoint[]>(() => {
        return checkpoints.map((cp) => ({
            id: cp.id,
            number: cp.number ?? undefined,
            name: cp.name,
            description: typeof cp.checkpoint_description === 'string'
                ? cp.checkpoint_description
                : cp.checkpoint_description
                    ? JSON.stringify(cp.checkpoint_description)
                    : undefined,
            latitude: cp.latitude ?? 0,
            longitude: cp.longitude ?? 0,
            category: cp.category ?? undefined,
        }))
    }, [checkpoints])

    if (isLoading) {
        return (
            <div className={cn('flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-white p-4 text-center')}>
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
            <div className={cn('flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-white p-4 text-center')}>
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
        <div className="h-[calc(100vh-4rem)] w-full p-1">
            <CheckpointMap checkpoints={mapCheckpoints} />
        </div>
    )
}
