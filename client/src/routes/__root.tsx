import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { NewsProvider } from '@/auth/NewsContext'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/NavBar'

export interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    return (
        <NewsProvider>
            <React.Fragment>
                <Navbar />

                <main className={cn('flex-1 p-2 flex flex-col min-h-0 overflow-y-auto pb-4')}>
                    <Outlet />
                </main>

                <footer className={cn('p-2 text-xs font-bold')} />

                <TanStackRouterDevtools />
                <ReactQueryDevtools />
            </React.Fragment>
        </NewsProvider>
    )
}
