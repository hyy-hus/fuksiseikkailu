import { useLeaderboard } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";
import clsx from "clsx";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next"

interface GridProps {
    rows: (ReactNode)[][];
    headers?: string[];
}

function Grid({ rows, headers }: GridProps) {
    const col_count = rows[0]?.length ?? 0;
    const row_count = rows.length;

    return (
        <div className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] border-2 border-black dark:border-slate-700`}>
            <div className="contents">
                {
                    headers?.map(header => (
                        <span key={header} className="px-4 py-2 border-b-2 border-black bg-fuksi-400 dark:bg-slate-800 dark:border-slate-700 font-bold">
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
                                    "px-4 py-2 border-black dark:border-slate-700",
                                    ((i + 1) % 2 === 0) && "bg-white dark:bg-slate-950",
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
        return "0"
    }
}


export function LeaderboardPage() {
    const { t } = useTranslation();

    const { selectedAdventure } = useAdventure();

    const leaderboardRequest = useLeaderboard(selectedAdventure?.id ?? 0);
    const rows = leaderboardRequest?.data?.data ?? [];

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("leaderboard")}</h2>
            <ol className="flex flex-col gap-4">
                <Grid rows={rows.map((row, pos) => [
                    <span className="block text-center">{pos + 1}.</span>,
                    <span>#{row.id} - {row.name}</span>,
                    <span className="block text-center">{row.score}</span>,
                    <span className="block text-center">{row.checkpoints}</span>,
                    <span className="block text-center">{Math.round(((row.score / row.checkpoints) + Number.EPSILON) * 100) / 100}</span>,
                    <span className="block text-center">{formatDate(row.last_score_at)}</span>,
                ])}
                    headers={["#", t("team"), t("score"), t("checkpoints"), t("avg"), t("latest-score")]}
                />
            </ol>
        </div>
    )
}
