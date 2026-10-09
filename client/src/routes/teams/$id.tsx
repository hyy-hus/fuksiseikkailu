import { useTranslation } from 'react-i18next'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { getTeamOptions } from '@/api/generated/@tanstack/react-query.gen'
import { TeamForm } from '@/components/TeamForm'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/teams/$id')({
    loader: ({ context: { queryClient }, params: { id } }) => {
        const options = getTeamOptions({ path: { id } })
        return queryClient.ensureQueryData({
            queryKey: options.queryKey,
            queryFn: options.queryFn,
        })
    },
    component: EditTeamRoute,
    errorComponent: EditTeamError,
})

function EditTeamRoute() {
    const { t } = useTranslation()
    const { id } = Route.useParams()
    const navigate = useNavigate()

    const { data: team } = useSuspenseQuery({
        ...getTeamOptions({ path: { id } }),
    })

    const handleBack = () => navigate({ to: '/teams' })

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            <div className={cn('flex w-full max-w-2xl items-center justify-between')}>
                <button
                    type="button"
                    onClick={handleBack}
                    className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5')}
                >
                    <ArrowLeft className={cn('h-4 w-4')} />
                    {t('common.backToTeams', 'Back to Teams')}
                </button>
            </div>

            <div className={cn('w-full max-w-2xl')}>
                <TeamForm initialData={team} onSuccess={handleBack} onCancel={handleBack} />
            </div>
        </div>
    )
}

function EditTeamError({ error }: { error: Error }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            <div className={cn('w-full max-w-2xl flex flex-col gap-3 rounded-xl border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black shadow-xl')}>
                <div className={cn('flex items-center gap-2')}>
                    <AlertCircle className={cn('h-5 w-5 text-rose-600 stroke-[2.5]')} />
                    <h3 className={cn('text-sm font-black uppercase tracking-wide text-rose-950')}>
                        {t('teams.loadErrorTitle', 'Failed to load team')}
                    </h3>
                </div>
                <p className={cn('font-medium leading-relaxed text-rose-900')}>
                    {error.message || t('teams.loadErrorMessage', 'The requested team could not be found.')}
                </p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/teams' })}
                    className={cn('self-start rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5')}
                >
                    {t('teams.returnToList', 'Return to Teams List')}
                </button>
            </div>
        </div>
    )
}
