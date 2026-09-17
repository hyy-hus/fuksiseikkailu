import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { getNewsArticleOptions } from '@/api/generated/@tanstack/react-query.gen'
import { NewsForm } from '@/components/NewsForm'

export const Route = createFileRoute('/news/$id')({
    loader: ({ context: { queryClient }, params: { id } }) => {
        const options = getNewsArticleOptions({ path: { id } })
        return queryClient.ensureQueryData({
            queryKey: options.queryKey,
            queryFn: options.queryFn,
        })
    },
    component: EditNewsRoute,
})

function EditNewsRoute() {
    const { id } = Route.useParams()
    const navigate = useNavigate()

    const { data: article } = useSuspenseQuery({
        ...getNewsArticleOptions({ path: { id } }),
    })

    return (
        <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4">
            <NewsForm
                initialData={article}
                onSuccess={() => navigate({ to: '/news' })}
                onCancel={() => navigate({ to: '/news' })}
            />
        </div>
    )
}
