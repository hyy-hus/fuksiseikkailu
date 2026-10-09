import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@tanstack/react-router'
import {
    Accessibility,
    AlertCircle,
    Award,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Edit3,
    ExternalLink,
    Globe,
    MapPin,
    Navigation,
    RefreshCw,
    Search,
} from 'lucide-react'

import { useCheckpoints } from '@/hooks/useCheckpoints'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/AuthContext'

const CATEGORY_COLORS: Record<string, string> = {
    subject: cn('bg-blue-400 text-black'),
    nation: cn('bg-pink-400 text-black'),
    hobby: cn('bg-emerald-400 text-black'),
    hyy: cn('bg-amber-400 text-black'),
    yliopisto: cn('bg-purple-400 text-black'),
    other: cn('bg-blush-pop-400 text-black'),
    default: cn('bg-zinc-200 text-black'),
}

function parseAndGetLocalizedText(value: unknown, currentLang: string): string {
    if (!value) return ''

    if (typeof value === 'object' && value !== null) {
        return getLocalizedText(value, currentLang)
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed)
                return getLocalizedText(parsed, currentLang)
            } catch {
                return value
            }
        }
        return value
    }

    return getLocalizedText(value, currentLang)
}

export function CheckpointList() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { isAdmin } = useAuth()

    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
    const [copiedId, setCopiedId] = React.useState<string | null>(null)

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

            const localizedDesc = parseAndGetLocalizedText(cp.checkpoint_description, i18n.language)
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

    const getCategoryLabel = (category?: string | null) => {
        if (!category) return ''
        return t(`checkpoints.categories.${category}`, {
            defaultValue:
                category === 'subject'
                    ? 'Subject Organization'
                    : category === 'nation'
                        ? 'Student Nation'
                        : category === 'hobby'
                            ? 'Hobby Organization'
                            : category === 'hyy'
                                ? 'HYY'
                                : category === 'yliopisto'
                                    ? 'University'
                                    : category,
        })
    }

    const handleCopyScoringLink = (e: React.MouseEvent, checkpointId: string) => {
        e.stopPropagation()
        const scoringUrl = `${window.location.origin}/scores/${checkpointId}`
        navigator.clipboard.writeText(scoringUrl)
        setCopiedId(checkpointId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className={cn('flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header Controls */}
            <div className={cn('flex flex-col gap-3 border-b-2 border-black bg-white p-4 shrink-0')}>
                <div className={cn('flex items-center justify-between')}>
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('checkpoints.listTitle', 'Checkpoints ({{count}})', { count: filteredCheckpoints.length })}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {t('checkpoints.listSubtitle', 'Browse event checkpoints, locations, and descriptions.')}
                        </p>
                    </div>

                    <div className={cn('flex items-center gap-2')}>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isRefetching || isLoading}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-2.5 py-1 text-xs font-extrabold text-black shadow-2xs transition-colors hover:bg-black/5 disabled:opacity-50 cursor-pointer')}
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
                            {t('common.refresh', 'Refresh')}
                        </button>
                    </div>
                </div>

                {/* Filter Inputs */}
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
                        <option value="subject">{t('checkpoints.categories.subject', 'Subject Organization')}</option>
                        <option value="nation">{t('checkpoints.categories.nation', 'Student Nation')}</option>
                        <option value="hobby">{t('checkpoints.categories.hobby', 'Hobby Organization')}</option>
                        <option value="hyy">{t('checkpoints.categories.hyy', 'HYY')}</option>
                        <option value="yliopisto">{t('checkpoints.categories.yliopisto', 'University')}</option>
                        <option value="other">{t('checkpoints.categories.other', 'Other')}</option>
                    </select>
                </div>
            </div>

            {/* List Body */}
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

                        const publicDesc = parseAndGetLocalizedText(cp.checkpoint_description, i18n.language)
                        const orgDesc = 'org_description' in cp
                            ? parseAndGetLocalizedText(cp.org_description, i18n.language)
                            : ''

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

                                                {/* Publicly visible Location Name */}
                                                {cp.location_name && (
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-black/70 truncate">
                                                        <MapPin className="h-3 w-3 shrink-0 text-black/50" />
                                                        <span className="truncate">{cp.location_name}</span>
                                                    </div>
                                                )}

                                                {cp.category && (
                                                    <span className={cn('mt-0.5 text-[11px] italic text-black/60')}>
                                                        {getCategoryLabel(cp.category)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn('flex items-center gap-1.5 shrink-0')}>
                                            {/* Admin-only Placed / Unset Status Indicator */}
                                            {isAdmin && (
                                                hasLocation ? (
                                                    <span className={cn('flex items-center text-[10px] font-bold text-black bg-emerald-300 px-2 py-0.5 rounded border border-black')}>
                                                        <Check className={cn('mr-1 h-3 w-3 stroke-[3]')} />
                                                        {t('common.placed', 'Placed')}
                                                    </span>
                                                ) : (
                                                    <span className={cn('flex items-center text-[10px] font-bold text-black bg-amber-300 px-2 py-0.5 rounded border border-black')}>
                                                        <AlertCircle className={cn('mr-1 h-3 w-3 stroke-[3]')} />
                                                        {t('common.unset', 'Unset')}
                                                    </span>
                                                )
                                            )}

                                            {isSelected ? (
                                                <ChevronUp className={cn('h-4 w-4 text-black')} />
                                            ) : (
                                                <ChevronDown className={cn('h-4 w-4 text-black/40')} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Item Details */}
                                    {isSelected && (
                                        <div className={cn('flex flex-col gap-2.5 pt-2 border-t border-black/10 text-xs')}>
                                            {/* Location Name Header & Accessibility Icon */}
                                            {(cp.location_name || cp.accessible) && (
                                                <div className={cn('flex items-center justify-between gap-2 font-bold text-black/80')}>
                                                    {cp.location_name ? (
                                                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                            <MapPin className={cn('h-3.5 w-3.5 text-black shrink-0')} />
                                                            <span className="truncate">{cp.location_name}</span>
                                                        </div>
                                                    ) : (
                                                        <div />
                                                    )}

                                                    {cp.accessible && (
                                                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] shrink-0" title={t('checkpoints.accessible', 'Wheelchair Accessible')}>
                                                            <Accessibility className="h-4 w-4 stroke-[2.5]" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Public Description */}
                                            {publicDesc ? (
                                                <p className={cn('text-black/80 font-medium leading-relaxed whitespace-pre-line')}>
                                                    {publicDesc}
                                                </p>
                                            ) : !orgDesc && (
                                                <p className={cn('text-black/40 italic text-[11px]')}>
                                                    {t('checkpoints.noDescription', 'No description provided.')}
                                                </p>
                                            )}

                                            {/* Organizer Info */}
                                            {orgDesc && (
                                                <div className="flex flex-col gap-0.5 pt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/60">
                                                        {t('checkpoints.organizerInfo', 'Organizer Info')}
                                                    </span>
                                                    <p className="text-black/80 font-medium leading-relaxed whitespace-pre-line italic">
                                                        {orgDesc}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Website Link */}
                                            {cp.url && (
                                                <a
                                                    href={cp.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-1 flex items-center justify-center gap-1.5 rounded-md border-2 border-black bg-amber-400 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors"
                                                >
                                                    <Globe className="h-3.5 w-3.5 text-black" />
                                                    <span>{t('checkpoints.visitWebsite', 'Visit Website')}</span>
                                                    <ExternalLink className="h-3 w-3 text-black/70" />
                                                </a>
                                            )}

                                            {/* Actions */}
                                            <div className={cn('flex flex-wrap items-center justify-end gap-2 pt-1')}>
                                                {/* Go to Map Button */}
                                                {hasLocation && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate({
                                                                to: '/',
                                                                search: { checkpoint: cp.id },
                                                            })
                                                        }}
                                                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-blush-pop-100 transition-colors cursor-pointer')}
                                                    >
                                                        <Navigation className="h-3.5 w-3.5 text-black" />
                                                        <span>{t('checkpoints.showOnMap', 'Show on Map')}</span>
                                                    </button>
                                                )}

                                                {/* Admin-only Actions */}
                                                {isAdmin && (
                                                    <>
                                                        <Link
                                                            to="/scores/$checkpointId"
                                                            params={{ checkpointId: cp.id }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-emerald-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-emerald-300 transition-colors')}
                                                        >
                                                            <Award className={cn('h-3.5 w-3.5')} />
                                                            {t('checkpoints.recordScores', 'Record Scores')}
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyScoringLink(e, cp.id)}
                                                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors cursor-pointer')}
                                                        >
                                                            <Copy className={cn('h-3.5 w-3.5')} />
                                                            <span>
                                                                {copiedId === cp.id
                                                                    ? t('common.copied', 'Copied Link!')
                                                                    : t('checkpoints.copyScoringLink', 'Copy Link')}
                                                            </span>
                                                        </button>

                                                        <Link
                                                            to="/checkpoints/$id"
                                                            params={{ id: cp.id }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors')}
                                                        >
                                                            <Edit3 className={cn('h-3.5 w-3.5')} />
                                                            {t('checkpoints.editButton', 'Edit Checkpoint')}
                                                        </Link>
                                                    </>
                                                )}
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
