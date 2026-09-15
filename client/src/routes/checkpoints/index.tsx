import { useTranslation } from 'react-i18next'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FileSpreadsheet, Plus } from 'lucide-react'

import { CheckpointList } from '@/components/CheckpointList'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/AuthContext'

export const Route = createFileRoute('/checkpoints/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-hidden p-4')}>
            {/* Header Bar */}
            <div className={cn('flex w-full max-w-2xl shrink-0 items-center justify-between gap-3')}>
                <div>
                    <h2 className={cn('text-xl font-black uppercase tracking-tight text-black')}>
                        {isAdmin
                            ? t('checkpoints.managementTitle', 'Checkpoints Management')
                            : t('checkpoints.directoryTitle', 'Checkpoints Directory')}
                    </h2>
                    <p className={cn('text-xs font-bold text-black/70')}>
                        {isAdmin
                            ? t('checkpoints.managementSubtitle', 'Create, edit, or import event checkpoints.')
                            : t('checkpoints.directorySubtitle', 'Browse event checkpoints, locations, and descriptions.')}
                    </p>
                </div>

                {/* Admin-only Action Buttons */}
                {isAdmin && (
                    <div className={cn('flex items-center gap-2')}>
                        <Link
                            to="/checkpoints/import"
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors')}
                        >
                            <FileSpreadsheet className={cn('h-4 w-4')} />
                            <span className={cn('hidden sm:inline')}>
                                {t('checkpoints.batchImport', 'Batch Import')}
                            </span>
                        </Link>

                        <Link
                            to="/checkpoints/create"
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors')}
                        >
                            <Plus className={cn('h-4 w-4 stroke-[3]')} />
                            <span>{t('checkpoints.newCheckpoint', 'New Checkpoint')}</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Main Content Container bounded to full remaining height */}
            <div className={cn('flex flex-1 w-full max-w-2xl min-h-0 overflow-hidden')}>
                <CheckpointList />
            </div>
        </div>
    )
}
