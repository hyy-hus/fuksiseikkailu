import { Map } from "@components";

export function AdminMapPage() {
    return (
        <div className="w-full h-full border border-zinc-300 dark:border-slate-700">
            <Map
                clickCallback={(checkpoint) => console.log(checkpoint)}
                checkpoints={[]}
                selected={undefined}
            />
        </div>
    )
}
