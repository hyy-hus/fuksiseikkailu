import { useListCheckpoints } from "@api/endpoints";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"
import { t } from "i18next";
import { FaAngleDown, FaAngleUp, FaExternalLinkAlt } from "react-icons/fa";

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
        <div className="relative grid w-full grid-cols-[1fr_auto] items-end gap-2" onSubmit={(e) => {
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
                <ul className="absolute top-full left-0 z-1 mt-2 max-h-60 overflow-y-auto shadow-lg w-full bg-zinc-300 dark:bg-slate-800 border-2 dark:border-slate-700">
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
        </div>
    )
}

export function CheckpointsPage() {
    const { t } = useTranslation();

    const [open, setOpen] = useState<Set<number>>(() => new Set<number>());
    const [selectedTeam, setSelectedTeamId] = useState<number|undefined>(undefined);

    const toggleOpen = useCallback((id: number) => {
        setOpen((prev) => {
            const newOpen = new Set(prev);
            if (newOpen.has(id)) {
                newOpen.delete(id);
            } else {
                newOpen.add(id);
            }

            return newOpen;

        });

    }, []);


    const { selectedAdventure } = useAdventure();

    const { data } = useListCheckpoints(selectedAdventure?.id ?? 0);
    const checkpoints = data?.data ?? [];

    const filtered = selectedTeam ? checkpoints.filter(cp => cp.id == selectedTeam) : checkpoints;

    const searchOptions = useMemo(() =>
        checkpoints.map(team => ({ key: team.id, value: `#${team.number} - ${team.org_name} (${team.org_abbreviation})` })),
        [checkpoints]
    );

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{t("checkpoints")}</h2>
                <SearchBar options={searchOptions} onSubmit={(v) => setSelectedTeamId(Number(v))} />
            <ul className="flex flex-col gap-4">
                {
                    checkpoints.sort((a, b) => (a.number ?? 0) > (b.number ?? 0) ? -1 : 1).map((cp) => {
                        const isOpen = open.has(cp.id);
                        return (
                            <li key={cp.id} className={`border-2 "border-black"`}
                                onClick={() => toggleOpen(cp.id)}>
                                <div className={`p-4 bg-fuksi-400 dark:bg-slate-800 grid grid-cols-[1fr_auto]`}>
                                    <h4>#{cp.number} - {cp.org_name} ({cp.org_abbreviation})</h4>
                                    {isOpen ? (
                                        <FaAngleUp />) : (
                                        <FaAngleDown />)
                                    }
                                </div>
                                {open.has(cp.id) && (
                                    <div className="p-4 border-t-2 border-black dark:border-slate-600 bg-fuksi-200 flex flex-col gap-3">
                                        <p>{t(cp.category)}</p>
                                        <p>{cp.checkpoint_description}</p>
                                        <p>{cp.org_description}</p>
                                        <p>
                                          <span className="flex gap-2 align-center">
                                              <FaExternalLinkAlt />
                                              <span>{t("org-link")}</span>
                                          </span>
                                        </p>
                                    </div>
                                )
                                }
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    )
}

