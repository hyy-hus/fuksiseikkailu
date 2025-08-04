import { useListCheckpoints } from "@api/endpoints";
import { Map } from "@components";
import { Button } from "@components/Button";
import { Input, Select } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { t } from "i18next";
import { useState } from "react";

interface Option {
    key: string | number;
    value: string;
}
interface SearchBarProps {
    options?: Option[];
    onSubmit?: (key: string | number) => void;
}

function SearchBar({
    options = [],
    onSubmit,
}: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const searchResults = options.filter(option => searchQuery.trim() !== "" && option.value.toLowerCase().includes(searchQuery.toLowerCase()))

    function handleSelect(key: string | number) {
        setSearchQuery("");
        onSubmit?.(key);
    }

    return (
        <form className="relative grid w-full grid-cols-[1fr_auto] items-end gap-4" onSubmit={(e) => {
            e.preventDefault();
            if (searchResults) {
                handleSelect(searchResults[0].key)
            }
        }}>
            <Input type="search" label={t("search")} placeholder={`${t("example-abbr.")} Kasvatustieteen Karkurit`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="h-9/10" variant="green">{t("search")}</Button>
            {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 z-1 mt-1 max-h-60 overflow-y-auto shadow-lg w-full dark:bg-slate-800 border rounded dark:border-slate-700">
                    {
                        searchResults.map(result => (
                            <li className="py-2 px-4 dark:hover:bg-slate-700 cursor-pointer"
                                key={result.key}
                                onClick={() => handleSelect(result.key)}
                            >
                                {result.value}
                            </li>
                        ))
                    }
                </ul>
            )}
        </form>
    )
}

export function AdminMapPage() {
    const [selectedCheckpointId, setSelectedCheckpointId] = useState<number>(0);

    const { selectedAdventure } = useAdventure();
    const checkpoint_query = useListCheckpoints(selectedAdventure?.id ?? 0);
    const checkpoints = checkpoint_query?.data?.data ?? [];

    return (
        <div className="h-full grid gap-4 grid-rows-[auto_1fr]">
            <div>
                <SearchBar options={checkpoints.map(cp => ({ key: cp.id, value: cp.org_name }))} onSubmit={(key) => console.log(key)} />
            </div>
            <div className="w-full h-full border border-zinc-300 dark:border-slate-700">
                <Map
                    clickCallback={(id: number) => setSelectedCheckpointId(id)}
                    checkpoints={checkpoints}
                    selected_id={selectedCheckpointId ?? 0}
                />
            </div>
        </div>
    )
}
