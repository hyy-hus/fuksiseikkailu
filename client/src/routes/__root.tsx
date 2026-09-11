import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    const { t } = useTranslation()
    return (
        <React.Fragment>
            <header className="">
                <nav className={cn('flex items-center justify-between p-3')}>
                    <h1 className={cn('text-sm md:text-base font-extrabold tracking-tighter uppercase leading-none text-black flex items-center gap-3')}>
                        <span>{t('fuksiseikkailu', 'Fuksiseikkailu')}</span>
                        <span className="hidden sm:inline text-black/80">{t('gulisventyret', 'Gulisäventyret')}</span>
                        <span className="hidden md:inline text-black/80">{t('fresherAdventure', 'Fresher Adventure')}</span>
                    </h1>

                    {/* Integrated Language Switcher */}
                    <LanguageSwitcher />
                </nav>
            </header>

            <main className={cn('flex-1 p-2 flex flex-col min-h-0 overflow-y-auto pb-4')}>
                <Outlet />
            </main>

            <footer className={cn('p-2 text-xs font-bold')}>
                {t('fuksiseikkailuDashboard', 'Fuksiseikkailu Dashboard')}
            </footer>

            <TanStackRouterDevtools />
            <ReactQueryDevtools />
        </React.Fragment>
    )
}
