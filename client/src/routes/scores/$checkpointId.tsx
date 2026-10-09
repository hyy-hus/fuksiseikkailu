import { useTranslation } from 'react-i18next'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

import { getCheckpointOptions } from '@/api/generated/@tanstack/react-query.gen'
import { ScoreForm } from '@/components/ScoreForm'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/scores/$checkpointId')({
    loader: ({ context: { queryClient }, params: { checkpointId } }) => {
        const options = getCheckpointOptions({ path: { id: checkpointId } })
        return queryClient.ensureQueryData({
            queryKey: options.queryKey,
            queryFn: options.queryFn,
        })
    },
    component: CheckpointScoreRoute,
    errorComponent: CheckpointScoreError,
})

function CheckpointScoreRoute() {
    const { checkpointId } = Route.useParams()

    const { data: checkpoint } = useSuspenseQuery({
        ...getCheckpointOptions({ path: { id: checkpointId } }),
    })

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            <div className={cn('w-full max-w-xl')}>
                <ScoreForm checkpointId={checkpointId} checkpointName={checkpoint?.name} />
            </div>
        </div>
    )
}

function CheckpointScoreError({ error }: { error: Error }) {
    const { t } = useTranslation()

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            <div className={cn('w-full max-w-xl flex flex-col gap-3 rounded-xl border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black shadow-xl')}>
                <div className={cn('flex items-center gap-2')}>
                    <AlertCircle className={cn('h-5 w-5 text-rose-600 stroke-[2.5]')} />
                    <h3 className={cn('text-sm font-black uppercase tracking-wide text-rose-950')}>
                        {t('scores.loadErrorTitle', 'Failed to load checkpoint')}
                    </h3>
                </div>
                <p className={cn('font-medium leading-relaxed text-rose-900')}>
                    {error.message || t('scores.loadErrorMessage', 'The requested checkpoint could not be found.')}
                </p>
            </div>
        </div>
    )
}
