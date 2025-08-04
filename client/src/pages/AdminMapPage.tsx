import { Map } from "@components";

export function AdminMapPage() {
    return (
        <div className="">
            <Map
                clickCallback={(checkpoint) => console.log(checkpoint)}
                checkpoints={[]}
                selected={undefined}
            />
        </div>
    )
}
