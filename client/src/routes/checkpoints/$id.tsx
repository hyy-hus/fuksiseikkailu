import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { getCheckpointOptions } from '@/api/generated/@tanstack/react-query.gen'
import { CheckpointForm } from '@/components/CheckpointForm'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/checkpoints/$id')({
    loader: ({ context: { queryClient }, params: { id } }) => {
        const options = getCheckpointOptions({ path: { id } })
        return queryClient.ensureQueryData({
            queryKey: options.queryKey,
            queryFn: options.queryFn,
        })
    },
    component: EditCheckpointRoute,
    errorComponent: EditCheckpointError,
})

function EditCheckpointRoute() {
    const { id } = Route.useParams()
    const navigate = useNavigate()

    const { data: checkpoint } = useSuspenseQuery({
        ...getCheckpointOptions({ path: { id } }),
    })

    const handleNavigateBack = () => {
        navigate({ to: '/checkpoints' })
    }

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            {/* Top Header Bar */}
            <div className="flex w-full max-w-2xl items-center justify-between">
                <button
                    type="button"
                    onClick={handleNavigateBack}
                    className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Checkpoints
                </button>
            </div>

            {/* Main Content Container */}
            <div className="w-full max-w-2xl">
                <CheckpointForm
                    initialData={checkpoint}
                    onSuccess={handleNavigateBack}
                    onCancel={handleNavigateBack}
                />
            </div>
        </div>
    )
}

function EditCheckpointError({ error }: { error: Error }) {
    const navigate = useNavigate()

    return (
        <div className={cn('flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-4')}>
            <div className="w-full max-w-2xl flex flex-col gap-3 rounded-xl border-2 border-black bg-rose-100 p-4 text-xs font-bold text-black shadow-xl">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-rose-600 stroke-[2.5]" />
                    <h3 className="text-sm font-black uppercase tracking-wide text-rose-950">
                        Failed to load checkpoint
                    </h3>
                </div>
                <p className="font-medium leading-relaxed text-rose-900">
                    {error.message || 'The requested checkpoint could not be found or fetched.'}
                </p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/checkpoints' })}
                    className="self-start rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors"
                >
                    Return to Checkpoints List
                </button>
            </div>
        </div>
    )
}
