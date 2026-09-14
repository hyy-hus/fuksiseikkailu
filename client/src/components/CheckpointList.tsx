import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronUp,
    Edit3,
    MapPin,
    RefreshCw,
    Search,
} from 'lucide-react'

import { useCheckpoints } from '@/hooks/useCheckpoints'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
    subject: cn('bg-blue-400 text-black'),
    nation: cn('bg-pink-400 text-black'),
    hobby: cn('bg-emerald-400 text-black'),
    hyy: cn('bg-amber-400 text-black'),
    yliopisto: cn('bg-purple-400 text-black'),
    other: cn('bg-blush-pop-400 text-black'),
    default: cn('bg-zinc-200 text-black'),
}

export function CheckpointList() {
    const { t, i18n } = useTranslation()
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [categoryFilter, setCategoryFilter] = React.useState<string>('all')

    const {
        data: checkpoints = [],
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    } = useCheckpoints()

    const filteredCheckpoints = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase()

        return checkpoints.filter((cp) => {
            const matchesCategory =
                categoryFilter === 'all' || cp.category === categoryFilter

            if (!matchesCategory) return false
            if (!q) return true

            const nameMatch = cp.name ? cp.name.toLowerCase().includes(q) : false
            const locationMatch = cp.location_name
                ? cp.location_name.toLowerCase().includes(q)
                : false
            const numberMatch = cp.number !== null && cp.number !== undefined
                ? String(cp.number).includes(q)
                : false
            const categoryMatch = cp.category ? cp.category.toLowerCase().includes(q) : false

            const localizedDesc = getLocalizedText(cp.checkpoint_description, i18n.language)
            const descriptionMatch = localizedDesc.toLowerCase().includes(q)

            return (
                nameMatch ||
                locationMatch ||
                numberMatch ||
                categoryMatch ||
                descriptionMatch
            )
        })
    }, [checkpoints, searchQuery, categoryFilter, i18n.language])

    return (
        <div className={cn('flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            <div className={cn('flex flex-col gap-3 border-b-2 border-black bg-white p-4 shrink-0')}>
                <div className={cn('flex items-center justify-between')}>
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('checkpoints.listTitle', 'Checkpoints ({{count}})', { count: filteredCheckpoints.length })}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {t('checkpoints.listSubtitle', 'Browse event checkpoints, map coordinates, and placement details.')}
                        </p>
                    </div>

                    <div className={cn('flex items-center gap-2')}>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isRefetching || isLoading}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-2.5 py-1 text-xs font-extrabold text-black shadow-2xs transition-colors hover:bg-black/5 disabled:opacity-50')}
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
                            {t('common.refresh', 'Refresh')}
                        </button>
                    </div>
                </div>

                <div className={cn('flex flex-wrap items-center gap-2 pt-1')}>
                    <div className={cn('relative flex-1 min-w-[200px]')}>
                        <Search className={cn('absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50')} />
                        <input
                            type="text"
                            placeholder={t('common.searchPlaceholder', 'Search by name or location...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn('w-full rounded-md border-2 border-black bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20')}
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    >
                        <option value="all">{t('common.allCategories', 'All Categories')}</option>
                        <option value="subject">{t('categories.subject', 'Subject')}</option>
                        <option value="nation">{t('categories.nation', 'Nation')}</option>
                        <option value="hobby">{t('categories.hobby', 'Hobby')}</option>
                        <option value="hyy">{t('categories.hyy', 'HYY')}</option>
                        <option value="yliopisto">{t('categories.yliopisto', 'Yliopisto')}</option>
                        <option value="other">{t('categories.other', 'Other')}</option>
                    </select>
                </div>
            </div>

            <div className={cn('flex-1 overflow-y-auto min-h-0 bg-white')}>
                {isLoading && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <RefreshCw className={cn('h-8 w-8 animate-spin text-black')} />
                        <p className={cn('mt-3 text-sm font-bold text-black uppercase tracking-wide')}>
                            {t('checkpoints.loading', 'Loading Checkpoints...')}
                        </p>
                    </div>
                )}

                {isError && (
                    <div className={cn('m-4 flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black shadow-2xs')}>
                        <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600 stroke-[2.5]')} />
                        <div>
                            <p className={cn('font-extrabold uppercase')}>{t('checkpoints.loadErrorTitle', 'Failed to load checkpoints')}</p>
                            <p className={cn('text-black/70 mt-0.5')}>{error?.message || t('common.unexpectedError', 'An unexpected server error occurred.')}</p>
                        </div>
                    </div>
                )}

                {!isLoading && !isError && filteredCheckpoints.length === 0 && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <AlertCircle className={cn('h-8 w-8 text-black/30')} />
                        <p className={cn('mt-2 text-sm font-bold text-black')}>{t('checkpoints.noCheckpointsFound', 'No checkpoints found')}</p>
                        <p className={cn('text-xs font-medium text-black/60')}>
                            {t('checkpoints.adjustFiltersHint', 'Try adjusting your search query or category filter.')}
                        </p>
                    </div>
                )}

                {!isLoading &&
                    !isError &&
                    filteredCheckpoints.map((cp, idx) => {
                        const hasLocation =
                            typeof cp.latitude === 'number' &&
                            typeof cp.longitude === 'number' &&
                            (cp.latitude !== 0 || cp.longitude !== 0)
                        const isSelected = selectedId === cp.id

                        const categoryKey =
                            cp.category && CATEGORY_COLORS[cp.category]
                                ? cp.category
                                : 'default'
                        const badgeColorClass = CATEGORY_COLORS[categoryKey]
                        const localizedDescription = getLocalizedText(
                            cp.checkpoint_description,
                            i18n.language
                        )

                        return (
                            <React.Fragment key={cp.id}>
                                <div
                                    onClick={() => setSelectedId(isSelected ? null : cp.id)}
                                    className={cn(
                                        'flex flex-col gap-2.5 p-4 cursor-pointer transition-colors bg-white',
                                        isSelected ? 'bg-amber-50/80' : 'hover:bg-black/5'
                                    )}
                                >
                                    <div className={cn('flex items-start justify-between gap-2')}>
                                        <div className={cn('flex items-center gap-2.5 min-w-0')}>
                                            <span
                                                className={cn(
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black text-xs font-bold shadow-2xs [&>svg]:h-3.5 [&>svg]:w-3.5',
                                                    badgeColorClass
                                                )}
                                            >
                                                {cp.number ?? '•'}
                                            </span>

                                            <div className={cn('flex flex-col min-w-0')}>
                                                <div className={cn('flex items-center gap-2')}>
                                                    <span className={cn('font-bold text-sm text-black leading-tight truncate')}>
                                                        {cp.name}
                                                    </span>
                                                    {cp.cancelled && (
                                                        <span className={cn('text-[10px] font-black uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.2 rounded border border-black')}>
                                                            {t('checkpoints.cancelledBadge', 'Cancelled')}
                                                        </span>
                                                    )}
                                                </div>

                                                {cp.category && (
                                                    <span className={cn('mt-0.5 text-[10px] uppercase tracking-wider font-extrabold text-black/60')}>
                                                        {cp.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn('flex items-center gap-1.5 shrink-0')}>
                                            {hasLocation ? (
                                                <span className={cn('flex items-center text-[10px] font-bold text-black bg-emerald-300 px-2 py-0.5 rounded border border-black')}>
                                                    <Check className={cn('mr-1 h-3 w-3 stroke-[3]')} /> {t('common.placed', 'Placed')}
                                                </span>
                                            ) : (
                                                <span className={cn('flex items-center text-[10px] font-bold text-black bg-amber-300 px-2 py-0.5 rounded border border-black')}>
                                                    <AlertCircle className={cn('mr-1 h-3 w-3 stroke-[3]')} /> {t('common.unset', 'Unset')}
                                                </span>
                                            )}

                                            {isSelected ? (
                                                <ChevronUp className={cn('h-4 w-4 text-black')} />
                                            ) : (
                                                <ChevronDown className={cn('h-4 w-4 text-black/40')} />
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className={cn('flex flex-col gap-2.5 pt-2 border-t border-black/10 text-xs')}>
                                            {cp.location_name && (
                                                <div className={cn('flex items-center gap-1.5 font-bold text-black/80')}>
                                                    <MapPin className={cn('h-3.5 w-3.5 text-black shrink-0')} />
                                                    <span>{cp.location_name}</span>
                                                </div>
                                            )}

                                            {localizedDescription ? (
                                                <p className={cn('text-black/80 font-medium leading-relaxed whitespace-pre-line')}>
                                                    {localizedDescription}
                                                </p>
                                            ) : (
                                                <p className={cn('text-black/40 italic text-[11px]')}>
                                                    {t('checkpoints.noDescription', 'No description provided.')}
                                                </p>
                                            )}

                                            <div className={cn('flex flex-wrap items-center justify-between gap-2')}>
                                                {hasLocation ? (
                                                    <div className={cn('flex items-center gap-3 text-[11px] font-mono font-bold text-black/70 bg-black/5 p-1.5 rounded border border-black/10')}>
                                                        <span>{t('lat', 'Lat:')} {cp.latitude?.toFixed(5)}</span>
                                                        <span>{t('lng', 'Lng:')} {cp.longitude?.toFixed(5)}</span>
                                                        {cp.lanes && <span>{t('checkpoints.lanesCount', 'Lanes: {{lanes}}', { lanes: cp.lanes })}</span>}
                                                        {cp.accessible && (
                                                            <span className={cn('text-emerald-700 font-extrabold')}>{t('checkpoints.accessibleBadge', 'Accessible')}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div />
                                                )}

                                                <Link
                                                    to="/checkpoints/$id"
                                                    params={{ id: cp.id }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-amber-400 px-3 py-1 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors')}
                                                >
                                                    <Edit3 className={cn('h-3.5 w-3.5')} />
                                                    {t('checkpoints.editButton', 'Edit Checkpoint')}
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {idx < filteredCheckpoints.length - 1 && (
                                    <div className={cn('mx-4 border-b border-black/20')} />
                                )}
                            </React.Fragment>
                        )
                    })}
            </div>
        </div>
    )
}
