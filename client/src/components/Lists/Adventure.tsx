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
            className="grid border border-gray-400 dark:border-slate-600 divide-x divide-y divide-gray-300 dark:divide-slate-700 text-sm"
            style={{ gridTemplateColumns: gridTemplate }}
        >
            {/* Header Row */}
            <div className="bg-gray-100 dark:bg-slate-800 font-bold p-2 flex items-center justify-center">
                <input type="checkbox" />
            </div>

            {columns.map((col) => (
                <div
                    key={col.header}
                    className="bg-gray-100 dark:bg-slate-800 font-bold p-2 flex items-center"
                >
                    {t(col.header)}
                </div>
            ))}
            <div className="bg-gray-100 dark:bg-slate-800 font-bold p-2"></div>
            <div className="bg-gray-100 dark:bg-slate-800 font-bold p-2"></div>

            {/* Rows */}
            {items.map((item, idx) => (
                <Fragment key={idx}>
                    <div className="p-2 flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={selected.has(idx)}
                            onChange={() => toggleSelect(idx)}
                        />
                    </div>
                    {columns.map((col) => (
                        <div key={col.header} className="p-2 flex items-center">
                            {col.render(item)}
                        </div>
                    ))}
                    <div className="p-2 flex items-center justify-center">
                        <Button variant="transparent" aria-label="Edit">
                            <FaEdit />
                        </Button>
                    </div>
                    <div className="p-2 flex items-center justify-center">
                        <Button variant="transparent" aria-label="Delete">
                            <FaTrash />
                        </Button>
                    </div>
                </Fragment>
            ))}
        </div>
    );
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
