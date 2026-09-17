import { Link } from '@tanstack/react-router'
import { Newspaper } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useNewsNotification } from '@/auth/NewsContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/utils'

export function Navbar() {
    const { t } = useTranslation()
    const { hasUnread, unreadCount } = useNewsNotification()

    return (
        <header className="">
            <nav className={cn('flex items-center justify-between p-3')}>
                {/* Single Localized App Title */}
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <h1 className={cn('text-sm md:text-base font-black tracking-tighter uppercase leading-none text-black')}>
                        {t('appTitle', 'Fuksiseikkailu')}
                    </h1>
                </Link>

                <div className={cn('flex items-center gap-2.5')}>
                    {/* News Button with Pulsing Unread Badge */}
                    <Link
                        to="/news"
                        className={cn('relative flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black shadow-2xs hover:bg-amber-300 transition-colors')}
                    >
                        <Newspaper className="h-4 w-4" />
                        <span>{t('navigation.news', 'News')}</span>

                        {hasUnread && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-rose-500 px-1 text-[9px] font-black text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </Link>

                    {/* Integrated Language Switcher */}
                    <LanguageSwitcher />
                </div>
            </nav>
        </header>
    )
}
