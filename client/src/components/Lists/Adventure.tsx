import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { t } from "i18next";
import { useState, Fragment } from "react";

import { Button } from "@components/Button";

import { FaTrash, FaEdit } from "react-icons/fa";

interface ColumnDef<T> {
    header: string;
    render: (item: T) => React.ReactNode;
    width?: string;
}

interface ListProps<T> {
    items: T[];
    columns: ColumnDef<T>[];
}

function List<T>({ items, columns }: ListProps<T>) {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    function toggleSelect(index: number) {
        const newSet = new Set(selected);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelected(newSet);
    }

    const gridTemplate = [
        "auto",
        ...columns.map(col => col.width ?? "auto"),
        "auto",
        "auto",
    ].join(" ");

    return (
        <div
            className="grid gap-2"
            style={{ gridTemplateColumns: gridTemplate }}
        >
            <div className="font-bold"><input type="checkbox" /></div>

            {columns.map((col) => (
                <div key={col.header} className="font-bold">
                    {t(col.header)}
                </div>
            ))}
            <div className="font-bold"></div>
            <div className="font-bold"></div>

            {
                items.map((item, idx) => (
                    <Fragment key={idx}>
                        <div key={idx}>
                            <input
                                type="checkbox"
                                checked={selected.has(idx)}
                                onChange={() => toggleSelect(idx)}
                            />
                        </div>
                        {
                            columns.map((col) => (
                                <div key={col.header}>{col.render(item)}</div>
                            ))
                        }
                        <div className="font-bold"><Button variant="transparent"><FaEdit /></Button></div>
                        <div className="font-bold"><Button variant="transparent"><FaTrash /></Button></div>
                    </Fragment>
                ))
            }
        </div>
    )
}

export function AdventureList() {
    const { data, isLoading, isError, error } = useListAdventuresAdventuresGet();

    if (isLoading) {
        return (
            <div>Loading...</div>
        );
    }

    if (isError) {
        return (
            <div className="text-red-600">
                Error loading adventures: {String((error as any)?.message ?? error)}
            </div>
        )
    }

    if (!data || data.data.length === 0) {
        return <div>No adventures found</div>
    }

    const columns = [
        { header: "id", render: (a: PublicAdventure) => a.id },
        { header: "year", render: (a: PublicAdventure) => a.year },
        { header: "name", render: (a: PublicAdventure) => a.name, width: "1fr" },
        { header: "ongoing", render: (a: PublicAdventure) => a.ongoing ? "true" : "false" },
        { header: "test", render: (a: PublicAdventure) => a.test ? "true" : "false" },
    ]

    return (
        <>
            <h3>Adventures</h3>
            <List items={data.data} columns={columns} />
        </>
    )
}
