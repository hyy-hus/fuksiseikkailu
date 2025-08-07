import { getListCheckpointsQueryKey, useFetchCheckpoint, useListCheckpoints } from "@api/endpoints";
// import { PublicCheckpoint } from "@api/model";
import { Map } from "@components";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { IoRefresh } from "react-icons/io5";
import { Link } from "react-router-dom";

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
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    const searchResults = options.filter(option => searchQuery.trim() !== "" && option.value.toLowerCase().includes(searchQuery.toLowerCase()))

    function handleSelect(key: string | number) {
        setSearchQuery("");
        onSubmit?.(key);
    }

    return (
        <form className="relative grid w-full grid-cols-[1fr_auto] items-end gap-4" onSubmit={(e) => {
            e.preventDefault();
            if (searchResults.length > 0) {
                const targetIndex = focusedIndex >= 0 ? focusedIndex : 0;
                handleSelect(searchResults[targetIndex].key);
            }
        }}>
            <div onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && focusedIndex >= 0) {
                    e.preventDefault();
                    handleSelect(searchResults[focusedIndex].key);
                }
            }}>
                <Input type="search" label={t("search")} placeholder={`${t("example-abbr.")} Kasvatustieteen Karkurit`}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setFocusedIndex(-1);
                    }}
                />
            </div>
            <Button type="submit" className="h-9/10" variant="green">{t("search")}</Button>
            {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 z-1 mt-1 max-h-60 overflow-y-auto shadow-lg w-full bg-zinc-300 dark:bg-slate-800 border rounded dark:border-slate-700">
                    {
                        searchResults.map((result, index) => (
                            <li className={`py-2 px-4 dark:hover:bg-slate-700 cursor-pointer ${index === focusedIndex
                                ? "bg-zinc-200 dark:bg-slate-700"
                                : "hover:bg-zinc-100 dark:hover:bg-slate-700"
                                }`}
                                key={result.key}
                                onMouseDown={() => handleSelect(result.key)}
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

interface CheckpointCardProps {
    adventureId: number;
    checkpointId: number;
    open: boolean;
    onClick: () => void;
}

function CheckpointCard({ adventureId, checkpointId, open, onClick }: CheckpointCardProps) {
    const { data } = useFetchCheckpoint(adventureId, checkpointId);

    const cp = data?.data ?? undefined;

    return (
        <ul className="p-3 md:p-6 grid grid-cols-[1fr_auto_1fr] gap-1 md:gap-2 w-full justify-items-center text-sm md:text-base h-full">
            <li className="col-span-full" onClick={() => onClick()}>
                <hr className="bg-slate-500 text-slate-500 hover:bg-slate-400 hover:bg-slate-400 w-20 rounded-full h-1 mb-4" />
            </li>
            <li className="contents">
                <span className="justify-self-start text-sm">101</span>
                <span className="font-bold justify-self-center text-center">{cp?.org_name} ({cp?.org_abbreviation})</span>
                <span className="justify-self-end px-2 py-1 border border-slate-500 bg-slate-400/20 rounded text-xs">{cp?.category}</span>
            </li>
            <li className="col-span-full">
                <span className="italic text-sm">{cp?.address}</span>
            </li>
            {
                open && (
                    <div className="col-span-full p-2 min-h-10 justify-self-start overflow-y-auto flex flex-col gap-4">
                        <p>{cp?.checkpoint_description}</p>
                        <p>{cp?.org_description}</p>
                        <p className="flex w-full justify-center"><Link to={cp?.org_link ?? ""}>
                            <span className="flex gap-2 align-center">
                                <FaExternalLinkAlt />
                                <span>{t("org-link")}</span>
                            </span>
                        </Link></p>
                    </div>
                )
            }
        </ul>
    )
}

export function UserMapPage() {
    const { selectedAdventure } = useAdventure();
    const checkpoint_query = useListCheckpoints(selectedAdventure?.id ?? 0);
    const checkpoints = checkpoint_query?.data?.data ?? [];

    const [selectedCheckpointId, setSelectedCheckpointId] = useState<number>(0);
    const selectedCheckpoint = checkpoints.find(cp => cp.id === selectedCheckpointId);

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const handleCheckpointClick = useCallback((id: string | number) => {
        setSelectedCheckpointId(Number(id));
    }, []);

    // type ListCheckpointsResponse = Awaited<ReturnType<typeof listCheckpoints>>;

    const queryClient = useQueryClient();
    const queryKey = getListCheckpointsQueryKey(selectedAdventure?.id ?? 0);

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey });
    }, [queryClient, queryKey]);

    const searchOptions = useMemo(() =>
        checkpoints.map(cp => ({ key: cp.id, value: cp.org_name })),
        [checkpoints]
    );

    return (
        <div className="relative h-full grid gap-4 grid-rows-[auto_1fr]">
            <div>
                <SearchBar options={searchOptions} onSubmit={handleCheckpointClick} />
            </div>
            <div className="relative w-full h-full border border-zinc-300 dark:border-slate-700">
                <Button variant="gray"
                    onClick={handleRefresh}
                    aria-label={t("refresh")}
                    className="absolute top-4 right-4 z-20 opacity-50"
                >
                    <span>
                        <IoRefresh />
                    </span>
                </Button>
                <Map
                    clickCallback={(id: number) => setSelectedCheckpointId(id)}
                    checkpoints={checkpoints}
                    selected_id={selectedCheckpointId ?? 0}
                    onMarkerDrag={() => console.log("Drag is disabled")}
                />
            </div>
            {
                selectedCheckpoint && (
                    <div className={`absolute w-full flex justify-center bottom-0 ${drawerOpen ? "max-h-100" : "max-h-30"}`}>
                        <div className="bg-slate-900/80 rounded-t w-[90%] md:w-[80%] max-w-200 overflow-y-hidden">
                            <CheckpointCard adventureId={selectedAdventure?.id ?? 0} checkpointId={selectedCheckpointId} open={drawerOpen} onClick={() => setDrawerOpen(prev => !prev)} />
                        </div>
                    </div>
                )
            }
        </div>
    )
}
