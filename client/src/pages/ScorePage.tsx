import { useFetchCheckpoint, useListTeams, useListScores, useCreateScore, getListScoresQueryKey } from "@api/endpoints";
import { Button } from "@components/Button";
import { Input } from "@components/Input";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { t } from "i18next";
import { useCallback, useMemo, useState } from "react";
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
                loading: "Saving score...",
                success: "Added new score!",
                error: (err: any) => err?.message ?? 'Failed to add score',
            }
        )
    }, [selectedAdventure, score, players, checkpoint, selectedTeam]);

    return (
        <div>
            <h2>Score page for #{checkpoint?.number} - {checkpoint?.org_name}</h2>
            <form onSubmit={handleSubmit}
                className="flex flex-col gap-4"
            >
                <SearchBar options={searchOptions} onSubmit={(v) => setSelectedTeamId(Number(v))} />
                <p>
                    <span className="mr-2">{t("team")}:</span>
                    {selectedTeam?.name ?? (<span className="italic">{t("no-team-selected")}</span>)}
                </p>
                {selectedTeam && (
                    <>
                        <RadioField label="Score" values={[1, 2, 3, 4, 5, 6]} checked={score} onChange={setScore} />
                        <RadioField label="Players" values={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} checked={players} onChange={setPlayers} />
                        <Button variant="green" type="submit">
                            {t("submit-score")}
                        </Button>
                    </>
                )
                }
            </form>
            <ul>
                {
                    checkpoint_scores.map(score => (
                        <li key={score.id}>{score.team.name}: {score.score} ({score.players})</li>
                    ))
                }
            </ul>
        </div>
    )
}
