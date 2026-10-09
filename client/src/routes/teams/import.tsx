import { useTranslation } from 'react-i18next'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { TeamBatchImport } from '@/components/TeamBatchImport'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/teams/import')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const navigate = useNavigate()
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
                <TeamBatchImport onSuccess={handleBack} onCancel={handleBack} />
            </div>
        </div>
    )
}
