import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { cn } from '@/lib/utils'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <React.Fragment>
            <header>
                <nav className={cn('p-2 border-b border-border-subtle')}>
                    Home
                </nav>
            </header>
            <main className={cn('flex-1 p-2')}>
                <Outlet />
            </main>
            <footer className={cn('p-2 border-t border-border-subtle')}>
                footer
            </footer>
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
        </React.Fragment>
    )
}
