import { Button } from "@components/Button";
import { Input, Select, Toggle } from "@components/Input";
import { ChangeEvent, useEffect, useState } from "react";

import type { FieldType } from "@components/Input";

export interface Option {
    key: string;
    value: string;
}

export interface FieldDef<T> {
    key: keyof T & string;
    name: string;
    type: FieldType;
    options?: Option[]
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
        setData(prev => ({ ...prev, [field.key]: value }));
    }

    function handleToggle(field: FieldDef<T>, value: any) {
        setData(prev => ({ ...prev, [field.key]: value }));
    }

    return (
        <div className="flex flex-col gap-4">
            {
                fields.map(field => {
                    if (field.type === "toggle") {
                        return (
                            <label key={field.key} className="flex flex-row items-center justify-between gap-2 py-2">
                                <span className="text-sm select-none">{field.name}:</span>
                                <Toggle onChange={(selected: boolean) => handleToggle(field, selected)} value={data[field.key] as boolean} />
                            </label>
                        )
                    } else if (field.type === "option") {
                        return (
                            <Select key={field.key} options={field.options ?? []} label={field.name} onChange={(value: string | number ) => handleChange(field, value)} value={data[field.key] ?? ""} />
                        )
                    } else {
                        return (
                            <Input key={field.key} label={field.name} type={field.type} onChange={(e) => handleChange(field, e.target.value)} value={data[field.key] ?? ""} />
                        )
                    }
                })
            }
            <div className="flex gap-4 items-center justify-center w-full">
                <Button variant="green" onClick={() => onSave?.(data)}>Save changes</Button>
                <Button variant="red" onClick={() => setData({ ...item })}>Cancel</Button>
            </div>
        </div>
    )
}
