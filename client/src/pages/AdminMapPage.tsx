import { getListCheckpointsQueryKey, listCheckpoints, useFetchAdminCheckpoint, useListCheckpoints, usePatchCheckpoint } from "@api/endpoints";
import { PublicCheckpoint } from "@api/model";
import { Map } from "@components";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { t } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { FaUniversalAccess } from "react-icons/fa";
import { IoRefresh } from "react-icons/io5";

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
        <form className="relative grid w-full grid-cols-[1fr_auto] items-end gap-4 overflow-hidden" onSubmit={(e) => {
            e.preventDefault();
            if (searchResults.length > 0) {
                const targetIndex = focusedIndex >= 0 ? focusedIndex : 0;
                handleSelect(searchResults[targetIndex].key);
            }
        }}>
            <div className="min-w-0" onKeyDown={(e) => {
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
    const { data } = useFetchAdminCheckpoint(adventureId, checkpointId);

    const cp = data?.data ?? undefined;

    return (
        <ul className="p-3 md:p-6 grid grid-cols-[1fr_auto_1fr] gap-1 md:gap-2 w-full justify-items-center text-sm md:text-base h-full">
            <li className="group col-span-full w-full" onClick={() => onClick()}>
                <hr className="mx-auto bg-slate-500 text-slate-500 group-hover:bg-slate-400 hover:bg-slate-400 w-20 rounded-full h-1 mb-4" />
            </li>
            <li className="contents">
                <span className="justify-self-start text-sm"></span>
                <span className="font-bold justify-self-center text-center">#{cp?.number} {cp?.org_name} ({cp?.org_abbreviation})</span>
                <span title={cp?.accessible ? t("accessible") : t("not-accessible")} className={clsx("justify-self-end text-2xl", cp?.accessible ? "text-sky-400" : "text-gray-500/50")}><FaUniversalAccess /></span>
            </li>
            <li className="col-span-full">
                <span className="italic text-sm">{cp?.address}</span>
            </li>
            {
                open && (
                    <li className="col-span-full p-2 min-h-10 justify-self-center overflow-y-auto">
                        <span>{cp?.requirements}</span>
                    </li>
                )
            }
        </ul>
    )
}

export function AdminMapPage() {
    const { selectedAdventure } = useAdventure();
    const checkpoint_query = useListCheckpoints(selectedAdventure?.id ?? 0);
    const checkpoints = checkpoint_query?.data?.data ?? [];

    const [selectedCheckpointId, setSelectedCheckpointId] = useState<number>(0);
    const selectedCheckpoint = checkpoints.find(cp => cp.id === selectedCheckpointId);

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const handleCheckpointClick = useCallback((id: string | number) => {
        setSelectedCheckpointId(Number(id));
    }, []);

    type ListCheckpointsResponse = Awaited<ReturnType<typeof listCheckpoints>>;

    const queryClient = useQueryClient();
    const queryKey = getListCheckpointsQueryKey(selectedAdventure?.id ?? 0);
    const updateCheckpoint = usePatchCheckpoint({
        mutation: {
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey });
                const previousCheckpoints = queryClient.getQueryData<ListCheckpointsResponse>(queryKey);

                queryClient.setQueryData<ListCheckpointsResponse>(queryKey, (old) => {
                    console.log("old:", old);

                    if (!old?.data) {
                        return old;
                    }

                    return {
                        ...old,
                        data: old.data.map((cp: PublicCheckpoint) =>
                            cp.id === variables.checkpointId
                                ? {
                                    ...cp,
                                    latitude: variables.data.latitude || cp.latitude,
                                    longitude: variables.data.longitude || cp.longitude
                                }
                                : cp
                        )
                    }
                });

                return { previousCheckpoints };
            },

            onError: (error, _, context) => {
                if (context?.previousCheckpoints) {
                    queryClient.setQueryData(queryKey, context.previousCheckpoints);
                }

                console.error("Failed to update position:", error)
            },

            onSuccess: () => {
                console.log("Updated position!");
            },

            onSettled: () => {
                queryClient.invalidateQueries({ queryKey });
            }
        }
    });

    const handleMarkerDrag = useCallback((checkpointId: number, newLat: number, newLng: number) => {
        const currentCheckpoint = checkpoints.find(cp => cp.id == checkpointId);

        if (!currentCheckpoint) {
            return;
        }

        updateCheckpoint.mutate({
            adventureId: selectedAdventure?.id ?? 0,
            checkpointId: checkpointId,
            data: {
                latitude: newLat.toString(),
                longitude: newLng.toString()
            }
        })
    }, [updateCheckpoint, selectedAdventure?.id]);

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
            <div className="relative w-full h-full">
                <Button variant="gray"
                    onClick={handleRefresh}
                    aria-label={t("refresh")}
                    className="absolute top-4 right-4 z-20 opacity-50"
                >
                    <span>
                        <IoRefresh />
                    </span>
                </Button>
                <div className="h-full w-full border-2 border-black">
                <Map
                    clickCallback={(id: number) => setSelectedCheckpointId(id)}
                    checkpoints={checkpoints}
                    selected_id={selectedCheckpointId ?? 0}
                    onMarkerDrag={handleMarkerDrag}
                    dragEnabled={true}
                />
            </div>
            </div>
            {
                selectedCheckpoint && (
                    <div className={`absolute w-full flex justify-center bottom-0 ${drawerOpen ? "max-h-100" : "max-h-30"}`}>
                        <div className="bg-fuksi-100 dark:bg-fuksi-950 border-2 border-b-0 border-black w-[90%] md:w-[80%] max-w-200 overflow-y-hidden">
                            <CheckpointCard adventureId={selectedAdventure?.id ?? 0} checkpointId={selectedCheckpointId} open={drawerOpen} onClick={() => setDrawerOpen(prev => !prev)} />
                        </div>
                    </div>
                )
            }
        </div>
    )
}
