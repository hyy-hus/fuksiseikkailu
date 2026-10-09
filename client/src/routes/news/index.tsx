import { createFileRoute } from '@tanstack/react-router'
import { NewsList } from '@/components/NewsList'

export const Route = createFileRoute('/news/')({
    component: () => (
        <div className="flex h-full w-full flex-col items-center gap-4 overflow-hidden p-4">
            <NewsList />
        </div>
    ),
})
