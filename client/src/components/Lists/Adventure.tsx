import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { useState, Fragment } from "react";

import { FaTrash, FaEdit } from "react-icons/fa";

interface ColumnDef<T> {
    header: string;
    render: (item: T) => React.ReactNode;
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

    const columnCount = columns.length + 3;
    const gridTemplate = `repeat(${columnCount}, auto)`;

    console.log(items);

    return (
        <div
            className="grid gap-2"
            style={{ gridTemplateColumns: gridTemplate }}
        >
            <div className="font-bold">select</div>
            {columns.map((col) => (
                <div key={col.header} className="font-bold">
                    {col.header}
                </div>
            ))}
            <div className="font-bold">Edit</div>
            <div className="font-bold">Remove</div>

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
                        <div className="font-bold"><FaEdit /></div>
                        <div className="font-bold"><FaTrash /></div>
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
        { header: "name", render: (a: PublicAdventure) => a.name },
        { header: "ongoing", render: (a: PublicAdventure) => a.ongoing },
        { header: "test", render: (a: PublicAdventure) => a.test },
    ]

    return (
        <>
            <h3>Adventures</h3>
            <List items={data.data} columns={columns} />
        </>
    )
}
