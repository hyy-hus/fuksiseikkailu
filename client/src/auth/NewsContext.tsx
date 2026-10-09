import * as React from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Newspaper } from 'lucide-react'

import type { NewsArticle } from '@/api/generated/types.gen'
import { useNews } from '@/hooks/useNews'
import { getLocalizedText } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const READ_NEWS_KEY = 'fuksi_read_news_ids'

interface NewsContextType {
    readNewsIds: Set<string>
    unreadCount: number
    hasUnread: boolean
    markAsRead: (id: string) => void
    markAllAsRead: () => void
}

const NewsContext = React.createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: React.ReactNode }) {
    const { t, i18n } = useTranslation()
    const { data: articles = [] } = useNews()
    const isFirstLoad = React.useRef(true)
    const knownArticleIdsRef = React.useRef<Set<string>>(new Set())

    // 1. Load read IDs from localStorage
    const [readNewsIds, setReadNewsIds] = React.useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(READ_NEWS_KEY)
            return stored ? new Set(JSON.parse(stored)) : new Set()
        } catch {
            return new Set()
        }
    })

    const persistReadIds = React.useCallback((newSet: Set<string>) => {
        setReadNewsIds(newSet)
        try {
            localStorage.setItem(READ_NEWS_KEY, JSON.stringify(Array.from(newSet)))
        } catch (err) {
            console.error('Failed to save read news IDs to localStorage', err)
        }
    }, [])

    const markAsRead = React.useCallback((id: string) => {
        setReadNewsIds((prev) => {
            if (prev.has(id)) return prev
            const updated = new Set(prev)
            updated.add(id)
            try {
                localStorage.setItem(READ_NEWS_KEY, JSON.stringify(Array.from(updated)))
            } catch (err) {
                console.error('Failed to save read news IDs', err)
            }
            return updated
        })
    }, [])

    const markAllAsRead = React.useCallback(() => {
        const allIds = new Set(articles.map((a) => a.id))
        persistReadIds(allIds)
    }, [articles, persistReadIds])

    // 2. In-app Push Notification Listener
    React.useEffect(() => {
        if (!articles.length) return

        const now = new Date()
        const publishedArticles = articles.filter(
            (a) => a.published_at && new Date(a.published_at) <= now
        )

        // Skip toast popups on initial app mount to prevent spamming on page load
        if (isFirstLoad.current) {
            publishedArticles.forEach((a) => knownArticleIdsRef.current.add(a.id))
            isFirstLoad.current = false
            return
        }

        // Detect newly published articles arriving via background 5-min refetch
        publishedArticles.forEach((article) => {
            if (!knownArticleIdsRef.current.has(article.id)) {
                knownArticleIdsRef.current.add(article.id)

                // Trigger custom in-app push toast if not already read
                if (!readNewsIds.has(article.id)) {
                    triggerInAppPushToast(article)
                }
            }
        })
    }, [articles, readNewsIds])

    // Function to show the in-app push bar using react-hot-toast
    const triggerInAppPushToast = (article: NewsArticle) => {
        const bodySnippet = getLocalizedText(article.content, i18n.language)

        toast.custom(
            (tState) => (
                <div
                    onClick={() => {
                        toast.dismiss(tState.id)
                        markAsRead(article.id)
                        window.location.hash = '#/news'
                    }}
                    className={cn(
                        'flex w-full max-w-sm items-center gap-3 rounded-md border-2 border-black bg-amber-400 p-3.5 shadow-xl transition-all cursor-pointer hover:bg-amber-300',
                        tState.visible ? 'animate-in fade-in slide-in-from-bottom-5' : 'animate-out fade-out slide-out-to-bottom-5'
                    )}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-white text-black">
                        <Newspaper className="h-5 w-5" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/70">
                            {t('news.inAppNotice', 'Announcement')}
                        </span>
                        <h4 className="font-black text-xs text-black truncate">{article.title}</h4>
                        {bodySnippet && (
                            <p className="text-[11px] font-bold text-black/80 line-clamp-1 mt-0.5">
                                {bodySnippet}
                            </p>
                        )}
                    </div>
                </div>
            ),
            { duration: 6000 }
        )
    }

    // 3. Compute unread status
    const unreadArticles = React.useMemo(() => {
        const now = new Date()
        return articles.filter((article) => {
            if (article.published_at && new Date(article.published_at) > now) {
                return false
            }
            return !readNewsIds.has(article.id)
        })
    }, [articles, readNewsIds])

    const unreadCount = unreadArticles.length
    const hasUnread = unreadCount > 0

    return (
        <NewsContext.Provider
            value={{
                readNewsIds,
                unreadCount,
                hasUnread,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NewsContext.Provider>
    )
}

export function useNewsNotification() {
    const context = React.useContext(NewsContext)
    if (!context) {
        throw new Error('useNewsNotification must be used within a NewsProvider')
    }
    return context
}
