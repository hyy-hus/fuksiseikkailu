import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { NewsForm } from '@/components/NewsForm'

export const Route = createFileRoute('/news/create')({
    component: CreateNewsRoute,
})

function CreateNewsRoute() {
    const navigate = useNavigate()

    return (
        <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4">
            <NewsForm
                onSuccess={() => navigate({ to: '/news' })}
                onCancel={() => navigate({ to: '/news' })}
            />
        </div>
    )
}
