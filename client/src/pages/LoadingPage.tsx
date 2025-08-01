import { Spinner } from "@components/Progress";

export function LoadingPage() {
    return (
        <div className="w-screen h-screen bg-zinc-200 dark:bg-slate-900 dark:text-slate-100 flex flex-col justify-center items-center gap-4">
            <Spinner />
            <h2>Loading...</h2>
        </div>
    )
}
