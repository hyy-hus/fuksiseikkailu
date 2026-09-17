import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Clock, Edit3, Newspaper, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { useNewsNotification } from '@/auth/NewsContext'
import { useNews } from '@/hooks/useNews'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function NewsList() {
    const { t, i18n } = useTranslation()
    const { isAdmin } = useAuth()
    const { readNewsIds, markAsRead } = useNewsNotification()
    const [searchQuery, setSearchQuery] = React.useState('')
    const { data: articles = [], isLoading, isError, error, refetch, isRefetching } = useNews()

    const filteredArticles = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        const now = new Date()

        return articles.filter((item) => {
            // Non-admin check: filter out scheduled/unpublished articles on the client
            if (!isAdmin) {
                if (!item.published_at) return false
                if (new Date(item.published_at) > now) return false
            }

            if (!q) return true

            const titleMatch = item.title.toLowerCase().includes(q)
            const textContent = getLocalizedText(item.content, i18n.language)
            const contentMatch = textContent.toLowerCase().includes(q)
            return titleMatch || contentMatch
        })
    }, [articles, searchQuery, i18n.language, isAdmin])

    return (
        <div className={cn('flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header */}
            <div className={cn('flex flex-col gap-3 border-b-2 border-black bg-white p-4 shrink-0')}>
                <div className={cn('flex items-center justify-between')}>
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('news.listTitle', 'News & Announcements ({{count}})', { count: filteredArticles.length })}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {t('news.listSubtitle', 'Latest updates and announcements.')}
                        </p>
                    </div>

                    <div className={cn('flex items-center gap-2')}>
                        {isAdmin && (
                            <Link
                                to="/news/create"
                                className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors')}
                            >
                                <Plus className="h-4 w-4 stroke-[3]" />
                                {t('news.createButton', 'Create News')}
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isRefetching || isLoading}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-2.5 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 disabled:opacity-50 cursor-pointer')}
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
                            {t('common.refresh', 'Refresh')}
                        </button>
                    </div>
                </div>

                <div className={cn('relative flex-1 min-w-[200px]')}>
                    <Search className={cn('absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50')} />
                    <input
                        type="text"
                        placeholder={t('news.searchPlaceholder', 'Search news by title or content...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn('w-full rounded-md border-2 border-black bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>
            </div>

            {/* List Body */}
            <div className={cn('flex-1 overflow-y-auto min-h-0 bg-white divide-y-2 divide-black/10')}>
                {isLoading && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <RefreshCw className="h-8 w-8 animate-spin text-black" />
                        <p className={cn('mt-3 text-sm font-bold text-black uppercase')}>{t('news.loading', 'Loading News...')}</p>
                    </div>
                )}

                {isError && (
                    <div className={cn('m-4 flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black')}>
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                        <div>
                            <p className={cn('font-extrabold uppercase')}>{t('news.loadErrorTitle', 'Failed to load news')}</p>
                            <p className={cn('text-black/70 mt-0.5')}>{error?.message || t('common.unexpectedError', 'An error occurred.')}</p>
                        </div>
                    </div>
                )}

                {!isLoading && !isError && filteredArticles.length === 0 && (
                    <div className={cn('flex flex-col items-center justify-center p-12 text-center')}>
                        <Newspaper className="h-8 w-8 text-black/30" />
                        <p className={cn('mt-2 text-sm font-bold text-black')}>{t('news.noNewsFound', 'No announcements found.')}</p>
                    </div>
                )}

                {!isLoading &&
                    !isError &&
                    filteredArticles.map((article) => {
                        const bodyText = getLocalizedText(article.content, i18n.language)
                        const isScheduled = article.published_at && new Date(article.published_at) > new Date()
                        const isUnread = !readNewsIds.has(article.id) && !isScheduled

                        return (
                            <div
                                key={article.id}
                                onClick={() => markAsRead(article.id)}
                                className={cn(
                                    'flex flex-col gap-2 p-4 transition-colors cursor-pointer',
                                    isUnread ? 'bg-amber-50/80 hover:bg-amber-100/60' : 'bg-white hover:bg-black/5'
                                )}
                            >
                                <div className={cn('flex items-start justify-between gap-2')}>
                                    <div className={cn('flex flex-col gap-0.5 min-w-0')}>
                                        <div className={cn('flex items-center gap-2 flex-wrap')}>
                                            {/* Unread Indicator Badge */}
                                            {isUnread && (
                                                <span className={cn('flex items-center gap-1 rounded border border-black bg-rose-500 px-1.5 py-0.2 text-[10px] font-black uppercase text-white shadow-2xs animate-pulse')}>
                                                    <Sparkles className="h-3 w-3 stroke-[3]" />
                                                    {t('news.unreadBadge', 'NEW')}
                                                </span>
                                            )}

                                            <h4 className={cn('font-black text-sm text-black truncate')}>{article.title}</h4>

                                            {isScheduled && (
                                                <span className={cn('rounded border border-black bg-amber-300 px-1.5 py-0.2 text-[10px] font-black uppercase text-black')}>
                                                    {t('news.scheduled', 'Scheduled')}
                                                </span>
                                            )}
                                        </div>

                                        <div className={cn('flex items-center gap-1.5 text-[11px] font-medium text-black/60')}>
                                            <Clock className="h-3 w-3 text-black/40" />
                                            <span>
                                                {article.published_at
                                                    ? new Date(article.published_at).toLocaleString()
                                                    : new Date(article.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <Link
                                            to="/news/$id"
                                            params={{ id: article.id }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-amber-400 px-2.5 py-1 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors shrink-0')}
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            {t('common.edit', 'Edit')}
                                        </Link>
                                    )}
                                </div>

                                {bodyText && (
                                    <p className={cn('text-xs font-medium text-black/80 leading-relaxed whitespace-pre-line')}>
                                        {bodyText}
                                    </p>
                                )}
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}
