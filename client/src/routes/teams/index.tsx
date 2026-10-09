import { useTranslation } from 'react-i18next'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FileSpreadsheet, Plus } from 'lucide-react'

import { TeamList } from '@/components/TeamList'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/teams/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-hidden p-4')}>
            <div className={cn('flex w-full max-w-2xl shrink-0 items-center justify-between gap-3')}>
                <div>
                    <h2 className={cn('text-xl font-black uppercase tracking-tight text-black')}>
                        {t('teams.managementTitle', 'Teams Management')}
                    </h2>
                    <p className={cn('text-xs font-bold text-black/70')}>
                        {t('teams.managementSubtitle', 'Create, edit, or batch import event teams.')}
                    </p>
                </div>

                <div className={cn('flex items-center gap-2')}>
                    <Link
                        to="/teams/import"
                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5')}
                    >
                        <FileSpreadsheet className={cn('h-4 w-4')} />
                        <span className={cn('hidden sm:inline')}>{t('teams.batchImport', 'Batch Import')}</span>
                    </Link>

                    <Link
                        to="/teams/create"
                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300')}
                    >
                        <Plus className={cn('h-4 w-4 stroke-[3]')} />
                        <span>{t('teams.newTeam', 'New Team')}</span>
                    </Link>
                </div>
            </div>

            <div className={cn('flex flex-1 w-full max-w-2xl min-h-0 overflow-hidden')}>
                <TeamList />
            </div>
        </div>
    )
}
