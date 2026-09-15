import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, List, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { CheckpointMap } from '@/components/CheckpointMap'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'

const homeSearchSchema = z.object({
    checkpoint: z.string().optional(),
})

export const Route = createFileRoute('/')({
    validateSearch: (search) => homeSearchSchema.parse(search),
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { checkpoint: initialCheckpointParam } = Route.useSearch()
    const { data: checkpoints = [], isLoading, isError, error } = useCheckpoints()

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

    const isComingFromList = Boolean(initialCheckpointParam)

    return (
        <div className="relative h-[calc(100vh-4rem)] w-full p-1">
            {/* Always-on Navigation Button to Checkpoint Directory */}
            <Link
                to="/checkpoints"
                className={cn(
                    'absolute top-4 right-16 z-10 flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-md hover:bg-blush-pop-100 transition-colors'
                )}
            >
                {isComingFromList ? (
                    <>
                        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                        <span>{t('checkpoints.backToList', 'Back to Checkpoints')}</span>
                    </>
                ) : (
                    <>
                        <List className="h-4 w-4 stroke-[2.5]" />
                        <span>{t('checkpoints.viewList', 'View Checkpoints List')}</span>
                    </>
                )}
            </Link>

            <CheckpointMap
                checkpoints={checkpoints}
                initialSelectedId={initialCheckpointParam}
            />
        </div>
    )
}
