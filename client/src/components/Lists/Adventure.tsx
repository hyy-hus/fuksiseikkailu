import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { t } from "i18next";
import { useEffect, useState } from "react";

import { Button } from "@components/Button";

import { FaTrash, FaEdit, FaAngleUp, FaAngleDown } from "react-icons/fa";

interface ColumnDef<T> {
    header: keyof T & string;
    render: (item: T) => React.ReactNode;
    width?: string;
    sortAccessor?: (item: T) => string | number;
}

interface ListProps<T> {
    items: T[];
    columns: ColumnDef<T>[];
    defaultSortCol?: keyof T & string;

    onChange?: (items: T[]) => void;
    handleEdit?: (item: T) => void;
    handleRemove?: (item: T) => void;
}

function List<T extends Record<string, any>>({ items, columns, defaultSortCol, onChange, handleEdit, handleRemove }: ListProps<T>) {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (onChange) {
            onChange(items.filter((_, idx) => selected.has(idx)));
        }
    }, [selected, onChange])

    function toggleSelect(index: number) {
        const newSet = new Set(selected);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelected(newSet);
    }

    function selectAll() {
        if (selected.size !== items.length) {
            const newSet = new Set(items.map((_, idx) => idx));
            setSelected(newSet);
        } else {
            setSelected(new Set());
        }
    }

    type SortDirection = "asc" | "desc";

    const [sortColumn, setSortColumn] = useState<string>(defaultSortCol ?? columns[0].header);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    function setSort(col: string) {
        if (sortColumn === col) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortDirection("desc");
            setSortColumn(col);
        }
    }

    const gridTemplate = [
        "auto",
        ...columns.map(col => col.width ?? "auto"),
        "auto",
    ].join(" ");

    return (
        <div>
            <div
                className="parent grid border border-gray-400 dark:border-slate-700 overflow-x-auto text-xs"
                style={{ gridTemplateColumns: gridTemplate }}
            >
                <div className="contents">
                    <div className="bg-gray-100 dark:bg-slate-800 font-bold px-4 py-2 flex items-center justify-center border-b border-gray-400 dark:border-slate-700">
                        <input type="checkbox" onClick={selectAll}
                            checked={selected.size === items.length} readOnly
                        />
                    </div>

                    {columns.map((col) => (
                        <div
                            key={col.header}
                            onClick={() => setSort(col.header)}
                            className="bg-gray-100 dark:bg-slate-800 font-bold px-4 py-2 flex items-center border-b border-gray-400 dark:border-slate-700"
                        >
                            {t(col.header)}
                            {col.header === sortColumn ?
                                <span className="w-2">
                                    {
                                        sortDirection === "asc" ? <FaAngleUp /> : <FaAngleDown />
                                    }
                                </span> :
                                <span className="w-2"></span>}
                        </div>
                    ))}
                    <div className="bg-gray-100 dark:bg-slate-800 font-bold px-4 py-2 border-b border-gray-400 dark:border-slate-700 flex items-center justify-center">
                        {t("controls")}
                    </div>
                </div>

                {/* Rows */}
                {items
                    .sort((itemA, itemB) => {
                        const column = columns.find((c) => c.header === sortColumn);
                        if (!column) {
                            return 0;
                        }

                        const getValue = column.sortAccessor ?? ((i: T) => (i as any)[column.header]);

                        const a = getValue(itemA);
                        const b = getValue(itemB);

                        if (a === b) {
                            return 0;
                        }
                        if (a < b) {
                            return sortDirection === "asc" ? -1 : 1;
                        }

                        return sortDirection === "asc" ? 1 : -1;
                    })
                    .map((item, idx) => (
                        <div key={idx} className="contents divide-x divide-slate-700 odd:bg-zinc-300 dark:odd:bg-slate-800">
                            <div className="py-2 px-4 flex items-center justify-center bg-inherit">
                                <input
                                    type="checkbox"
                                    checked={selected.has(idx)}
                                    onChange={() => toggleSelect(idx)}
                                />
                            </div>
                            {columns.map((col) => (
                                <div key={col.header} className="py-2 px-4 flex items-center bg-inherit">
                                    {col.render(item)}
                                </div>
                            ))}
                            <div className="py-2 px-4 flex items-center justify-center bg-inherit">
                                <Button variant="transparent" aria-label="Edit" onClick={() => handleEdit?.(item)}>
                                    <FaEdit />
                                </Button>
                                <Button variant="transparent" aria-label="Delete" onClick={() => handleRemove?.(item)}>
                                    <FaTrash />
                                </Button>
                            </div>
                        </div>
                    ))}
            </div>
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

    const columns: ColumnDef<PublicAdventure>[] = [
        { header: "id", render: (a: PublicAdventure) => a.id },
        { header: "year", render: (a: PublicAdventure) => a.year },
        { header: "name", render: (a: PublicAdventure) => a.name, width: "1fr" },
        { header: "ongoing", render: (a: PublicAdventure) => a.ongoing ? "true" : "false" },
        { header: "test", render: (a: PublicAdventure) => a.test ? "true" : "false" },
    ]

    return (
        <>
            <List items={data.data} columns={columns} defaultSortCol="year"
                onChange={(items) => console.log("selected:", items)}
                handleEdit={(item) => console.log("edit:", item)}
                handleRemove={(item) => console.log("remove:", item)}
            />
        </>
    )
}
