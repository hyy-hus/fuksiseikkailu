import { Button } from "@components/Button";
import { Input, Toggle } from "@components/Input";
import { useEffect, useState } from "react";

import type { FieldType } from "@components/Input";

export interface FieldDef<T> {
    key: keyof T & string;
    name: string;
    type: FieldType;
}

interface FormProps<T> {
    item: T;
    fields: FieldDef<T>[];
    onSave?: (item: T) => void;
}

export function Form<T extends Record<string, any>>({
    item,
    fields,
    onSave
}: FormProps<T>) {

    const [data, setData] = useState<T>({ ...item });

    useEffect(() => {
        setData({ ...item });
    }, [item]);

    function handleChange(field: FieldDef<T>, value: any) {
        const newData: T = { ...data };
        newData[field.key] = value;
        setData(newData);
    }

    function handleToggle(field: FieldDef<T>, value: any) {
        console.log("Toggle", value);
        const newData: T = { ...data };
        newData[field.key] = value;
        setData(newData);
    }

    return (
        <div className="flex flex-col gap-4">
            {
                fields.map(field =>
                    field.type === "toggle" ? (
                        <label className="flex flex-row items-center justify-between gap-2 py-2">
                            <span className="text-sm select-none">{field.name}:</span>
                            <Toggle onChange={(selected: boolean) => handleToggle(field, selected)} value={data[field.key]} />
                        </label>
                    ) : (
                        <Input key={field.key} label={field.name} type={field.type} onChange={(e) => handleChange(field, e.target.value)} value={data[field.key]} />
                    )
                )
            }
            <div className="flex gap-4 items-center justify-center w-full">
                <Button variant="green" onClick={() => onSave?.(data)}>Save changes</Button>
                <Button variant="red" onClick={() => setData({ ...item })}>Cancel</Button>
            </div>
        </div>
    )
}
