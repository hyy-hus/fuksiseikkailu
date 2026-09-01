import { createFileRoute } from '@tanstack/react-router'

import { VectorMap } from '@/components/Map';

export const Route = createFileRoute('/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="h-[calc(100vh-4rem)] w-full p-1">
            <VectorMap />
        </div>
    )
}

