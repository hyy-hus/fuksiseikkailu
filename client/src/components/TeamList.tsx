import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Edit3, RefreshCw, Search, Users } from 'lucide-react'

import { useTeams } from '@/hooks/useTeams'
import { cn } from '@/lib/utils'

export function TeamList() {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState('')
    const { data: teams = [], isLoading, isError, error, refetch, isRefetching } = useTeams()

    const filteredTeams = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return teams

        return teams.filter((team) => {
            const nameMatch = team.name.toLowerCase().includes(q)
            const numberMatch = team.number !== null && String(team.number).includes(q)
            return nameMatch || numberMatch
        })
    }, [teams, searchQuery])

    return (
        <div className={cn('flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            <div className={cn('flex flex-col gap-3 border-b-2 border-black bg-white p-4 shrink-0')}>
                <div className={cn('flex items-center justify-between')}>
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('teams.listTitle', 'Teams ({{count}})', { count: filteredTeams.length })}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {t('teams.listSubtitle', 'Manage participating teams.')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isRefetching || isLoading}
                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-2.5 py-1 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 disabled:opacity-50 cursor-pointer')}
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
                        {t('common.refresh', 'Refresh')}
                    </button>
                </div>

                <div className={cn('relative flex-1 min-w-[200px]')}>
                    <Search className={cn('absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50')} />
                    <input
                        type="text"
                        placeholder={t('teams.searchPlaceholder', 'Search teams by name or number...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn('w-full rounded-md border-2 border-black bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>
            </div>

            <div className={cn('flex-1 overflow-y-auto min-h-0 bg-white')}>
                {isLoading && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <RefreshCw className={cn('h-8 w-8 animate-spin text-black')} />
                        <p className={cn('mt-3 text-sm font-bold text-black uppercase')}>{t('teams.loading', 'Loading Teams...')}</p>
                    </div>
                )}

                {isError && (
                    <div className={cn('m-4 flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black')}>
                        <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600')} />
                        <div>
                            <p className={cn('font-extrabold uppercase')}>{t('teams.loadErrorTitle', 'Failed to load teams')}</p>
                            <p className={cn('text-black/70 mt-0.5')}>{error?.message || t('common.unexpectedError', 'An unexpected error occurred.')}</p>
                        </div>
                    </div>
                )}

                {!isLoading && !isError && filteredTeams.length === 0 && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <Users className={cn('h-8 w-8 text-black/30')} />
                        <p className={cn('mt-2 text-sm font-bold text-black')}>{t('teams.noTeamsFound', 'No teams found')}</p>
                    </div>
                )}

                {!isLoading && !isError && filteredTeams.map((team, idx) => (
                    <React.Fragment key={team.id}>
                        <div className={cn('flex items-center justify-between p-4 bg-white hover:bg-black/5 transition-colors')}>
                            <div className={cn('flex items-center gap-3 min-w-0')}>
                                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-xs font-bold')}>
                                    {team.number ?? '•'}
                                </span>
                                <div className={cn('flex flex-col min-w-0')}>
                                    <span className={cn('font-bold text-sm text-black truncate')}>{team.name}</span>
                                    <span className={cn('text-xs text-black/60 font-medium')}>
                                        {t('teams.participantsCount', '{{count}} participants', { count: team.participants })}
                                    </span>
                                </div>
                            </div>

                            <Link
                                to="/teams/$id"
                                params={{ id: team.id }}
                                className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300')}
                            >
                                <Edit3 className={cn('h-3.5 w-3.5')} />
                                {t('teams.editButton', 'Edit')}
                            </Link>
                        </div>
                        {idx < filteredTeams.length - 1 && <div className={cn('mx-4 border-b border-black/10')} />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
