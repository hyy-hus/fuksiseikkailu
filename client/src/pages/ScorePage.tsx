import { useFetchCheckpoint, useListTeams, useListScores, useCreateScore, getListScoresQueryKey } from "@api/endpoints";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { t } from "i18next";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import toast from 'react-hot-toast';

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
        <div className="relative grid w-full grid-cols-[1fr_auto] items-end gap-4" onSubmit={(e) => {
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
        </div>
    )
}

type Primitive = string | number;

interface RadioBoxProps<T extends Primitive> {
    name: string;
    value: T;
    checked?: boolean;
    onChange?: (v: T) => void;
}

function RadioBox<T extends Primitive>({ name, value, checked, onChange }: RadioBoxProps<T>) {
    const id = `${name}-${String(value)}`;

    return (
        <label htmlFor={id}
            className={clsx(
                "px-3 py-1 border rounded cursor-pointer select-none",
                "peer-[[data-focus=true]]:ring-2 peer-[[data-focus=true]]:ring-sky-400",
                checked ? "bg-sky-400 dark:bg-sky-500 border-sky-500 dark:bg-sky-600" : "border-zinc-400 bg-zinc-300 dark:border-slate-700 dark:bg-slate-600",
            )}
        >
            <span>
                {value}
            </span>
            <input
                className="sr-only peer"
                id={id}
                name={name}
                type="radio"
                value={String(value)}
                checked={checked}
                onChange={() => onChange?.(value)}
            />
        </label>
    )
}

interface RadioFieldProps<T extends Primitive> {
    values: T[];
    checked: T,
    label: string,
    onChange?: (v: T) => void;
}

function RadioField<T extends Primitive>({ values, checked, label, onChange }: RadioFieldProps<T>) {
    return (
        <div>
            <span>{label}:</span>
            <fieldset className="flex gap-2">
                {
                    values.map((val: T) => (
                        <RadioBox key={val} value={val} name={`${label}-${val}`} checked={val === checked} onChange={onChange} />
                    ))
                }
            </fieldset>
        </div>
    )
}

interface GridProps {
    rows: (ReactNode)[][];
    headers?: string[];
}

function Grid({ rows, headers }: GridProps) {
    const col_count = rows[0]?.length ?? 0;
    const row_count = rows.length;

    return (
        <div className={`grid grid-cols-[auto_1fr_auto_auto] border border-zinc-400 dark:border-slate-700`}>
            <div className="contents">
                {
                    headers?.map(header => (
                        <span key={header} className="px-4 py-2 border-b border-zinc-400 bg-zinc-300 dark:bg-slate-800 dark:border-slate-700 font-bold">
                            {header}
                        </span>
                    ))
                }
            </div>
            {
                rows.map((row, i) => (
                    <div className="contents" key={i}>
                        {
                            row.map((cell, j) => (
                                <div key={j} className={clsx(
                                    "px-4 py-2 border-zinc-400 dark:border-slate-700",
                                    ((i + 1) % 2 === 0) && "bg-zinc-100 dark:bg-slate-950",
                                    i !== (row_count - 1) && "border-b",
                                    j !== (col_count - 1) && "border-r"
                                )}>
                                    {cell}
                                </div>
                            ))
                        }
                    </div>
                ))
            }
        </div>
    )
}


const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute: "2-digit"
})

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return "-"
    }


    try {
        const date = new Date(dateString + "Z");
        return dateTimeFormat.format(date)
    } catch (error) {
        console.error("Could not parse ", dateString)
        return t("invalid-date")
    }
}

export function ScorePage() {
    const { slug } = useParams<{ slug: string }>();

    if (!slug) {
        return (
            <div>
                No slug provided!
            </div>
        )
    }

    const team_id = parseInt(slug);

    const { selectedAdventure } = useAdventure();
    const { data } = useFetchCheckpoint(selectedAdventure?.id ?? 0, team_id);
    const checkpoint = data?.data;

    const teams_query = useListTeams(selectedAdventure?.id ?? 0);
    const teams = teams_query?.data?.data ?? [];

    const searchOptions = useMemo(() =>
        teams.map(team => ({ key: team.id, value: `#${team.id} - ${team.name}` })),
        [teams]
    );

    const [selectedTeamId, setSelectedTeamId] = useState<number>(0);
    const selectedTeam = teams.find(cp => cp.id === selectedTeamId);

    const [score, setScore] = useState<number>(0);
    const [players, setPlayers] = useState<number>(0);

    const scores_query = useListScores(selectedAdventure?.id ?? 0);
    const scores = scores_query?.data?.data ?? [];
    const checkpoint_scores = scores.filter(score => score.checkpoint.id === checkpoint?.id)

    const submitScore = useCreateScore({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: scoresQueryKey });
            }
        }
    });

    const queryClient = useQueryClient();
    const scoresQueryKey = getListScoresQueryKey(
        selectedAdventure?.id ?? 0,
    );

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            adventureId: selectedAdventure?.id ?? 0,
            data: {
                score: score,
                players: players,
                checkpoint_id: checkpoint?.id ?? 0,
                team_id: selectedTeam?.id ?? 0
            }
        }

        await toast.promise(
            submitScore.mutateAsync(data),
            {
                loading: t("adding-score"),
                success: t("score-added"),
                error: (err: any) => err?.message ?? t("adding-score-failed"),
            }
        )
    }, [selectedAdventure, score, players, checkpoint, selectedTeam]);

    return (
        <div className="flex flex-col gap-4 items-center">
            <h2 className="font-bold text-lg">{t("checkpoint")} #{checkpoint?.number} - {checkpoint?.org_name}</h2>
            <form onSubmit={handleSubmit}
                className="flex flex-col gap-4"
            >
                <SearchBar options={searchOptions} onSubmit={(v) => setSelectedTeamId(Number(v))} />
                <p>
                    <span className="mr-2 font-bold">{t("team")}:</span>
                    #{selectedTeam?.id ?? 0} - {selectedTeam?.name ?? (<span className="italic">{t("no-team-selected")}</span>)}
                </p>
                {selectedTeam && (
                    <>
                        <RadioField label={t("score")} values={[1, 2, 3, 4, 5, 6]} checked={score} onChange={setScore} />
                        <RadioField label={t("players")} values={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} checked={players} onChange={setPlayers} />
                        <div className="flex w-full justify-center">
                            <Button variant="green" type="submit"
                                disabled={score === 0 && players === 0 && scores.some(score => (score.checkpoint?.id === checkpoint?.id && score.team.id === selectedTeam.id))}
                            >
                                {t("submit-score")}
                            </Button>
                        </div>
                    </>
                )
                }
            </form>
            <div>
                <Grid headers={[t("time"), t("team"), t("score"), t("players")]}
                    rows={checkpoint_scores.map(score => ([
                        <span className="text-center block">{formatDate(score.created_at)}</span>,
                        <span>{score.team.name}</span>,
                        <span className="text-center block">{score.score}</span>,
                        <span className="text-center block">{score.players}</span>,
                    ]))} />
            </div>
        </div>
    )
}
