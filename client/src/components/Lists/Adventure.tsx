import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { t } from "i18next";
import { useEffect, useState } from "react";

import { Button } from "@components/Button";

import { FaTrash, FaEdit, FaAngleUp, FaAngleDown } from "react-icons/fa";
import { Input } from "@components/Input";

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
    getKey: (item: T) => string | number;

    onChange?: (items: T[]) => void;
    handleEdit?: (item: T) => void;
    handleRemove?: (item: T) => void;
}

function List<T extends Record<string, any>>({ items, columns, defaultSortCol, getKey, onChange, handleEdit, handleRemove }: ListProps<T>) {
    const [selected, setSelected] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        if (onChange) {
            onChange(items.filter((item) => selected.has(getKey(item))));
        }
    }, [selected, items, onChange, getKey]);

    function toggleSelect(key: string | number) {
        const newSet = new Set(selected);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelected(newSet);
    }

    function selectAll() {
        if (selected.size !== filteredItems.length) {
            const newSet = new Set(filteredItems.map(getKey));
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

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredItems, setFilteredItems] = useState<T[]>([]);

    useEffect(() => {
        const filtered =
            items.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
            ;

        setFilteredItems(filtered);
    }, [searchQuery]);

    const gridTemplate = [
        "auto",
        ...columns.map(col => col.width ?? "auto"),
        "auto",
    ].join(" ");

    return (
        <div className="flex flex-col gap-4">
            <div className={`grid ${selected.size > 0 ? "grid-cols-[1fr_auto]" : "grid-cols-1"} gap-4 items-end`}>
                <Input type="search" label={t("search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {selected.size > 0 && (
                    <Button variant="red" aria-label="Delete" onClick={() => console.log("Remove all")} className="text-sm h-12">
                        {t("remove-selected")}
                        <FaTrash />
                    </Button>
                )}
            </div>
            <div
                className="parent grid border border-gray-400 dark:border-slate-700 overflow-x-auto text-xs"
                style={{ gridTemplateColumns: gridTemplate }}
            >
                <div className="contents">
                    <div className="bg-gray-100 dark:bg-slate-800 font-bold px-4 py-2 flex items-center justify-center border-b border-gray-400 dark:border-slate-700">
                        <input type="checkbox" onClick={selectAll}
                            checked={selected.size === filteredItems.length} readOnly
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
                {filteredItems.length === 0 ? (
                    <div className="py-2 px-4 italic text-zinc-500 dark:text-slate-600 w-full flex items-center justify-center col-span-full">
                        <span>{t("no-results-found")}</span>
                    </div>
                ) : (filteredItems
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
                    .map((item) => {
                        const key = getKey(item);
                        return (
                            <div key={key} className="contents divide-x divide-slate-700 odd:bg-zinc-300 dark:odd:bg-slate-800">
                                <div className="py-2 px-4 flex items-center justify-center bg-inherit">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(key)}
                                        onChange={() => toggleSelect(key)}
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
                        )
                    }))}
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
                getKey={(item) => item.id}
                onChange={(items) => console.log("selected:", items)}
                handleEdit={(item) => console.log("edit:", item)}
                handleRemove={(item) => console.log("remove:", item)}
            />
        </>
    )
}
