import { Button } from "@components/Button";
import { Input, Toggle } from "@components/Input";
import { Spinner } from "@components/Progress";

export function PlaygroundPage() {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="font-medium">Playground</h2>
            <p>
                Here you can see all the components available, play around with them and see how they style together
            </p>
            <div className="flex flex-col gap-4">
                <h3>Buttons</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="blue">Blue</Button>
                    <Button variant="blue" disabled={true}>Blue</Button>

                    <Button variant="red">Red</Button>
                    <Button variant="red" disabled={true}>Red</Button>

                    <Button variant="green">Green</Button>
                    <Button variant="green" disabled={true}>Green</Button>

                    <Button variant="gray">gray</Button>
                    <Button variant="gray" disabled={true}>gray</Button>

                    <Button variant="transparent">transparent</Button>
                    <Button variant="transparent" disabled={true}>transparent</Button>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <h3>Inputs</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="enabled" placeholder="placeholder" />
                    <Input label="disabled" placeholder="placeholder" disabled={true} />

                    <Input type="password" label="password" />
                    <Input type="password" label="password" disabled={true} />

                    <Input type="number" label="number" placeholder="42" />
                    <Input type="number" label="number" placeholder="42" disabled={true} />

                    <Input type="datetime-local" label="datetime" />
                    <Input type="datetime-local" label="datetime" disabled={true} />

                    <Input type="date" label="date" />
                    <Input type="date" label="date" disabled={true} />

                    <Input type="time" label="time" />
                    <Input type="time" label="time" disabled={true} />

                    <Input type="email" label="email" />
                    <Input type="email" label="email" disabled={true} />

                    <Input type="text" label="invalid" invalid={true} errorMessage="This value is not good!" />
                    <Input type="text" label="invalid" invalid={true} errorMessage="This value is not good!" disabled={true} />

                    <Toggle />
                    <Toggle />
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <h3>Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Spinner />
                </div>
            </div>
        </div>
    )
}
