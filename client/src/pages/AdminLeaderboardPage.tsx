import { useLeaderboard, useListAdminScores } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";
import clsx from "clsx";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"

interface GridProps {
  rows: (ReactNode)[][];
  headers?: string[];
  rowIds?: Array<string | number>;
  onRowClick?: (rowId: string | number, rowIndex: number) => void;
  selectedRowId?: string | number;
  colsClass?: string;
}

function Grid({ rows, headers, rowIds, onRowClick, selectedRowId, colsClass }: GridProps) {
  const col_count = rows[0]?.length ?? 0;
  const row_count = rows.length;

  return (
    <div className={clsx(`grid border-2 border-black`,
      colsClass ?? "grid-cols-[auto_1fr_auto_auto_auto_auto]"
    )}>
      <div className="contents">
        {
          headers?.map(header => (
            <span key={header} className="px-4 py-2 border-b-2 border-black bg-fuksi-400 dark:bg-fuksi-800 font-bold">
              {header}
            </span>
          ))
        }
      </div>
      {
        rows.map((row, i) => {
          const rid = rowIds?.[i];
          const isSelected = selectedRowId !== undefined && rid === selectedRowId;

          return (
            <div className={clsx(
              "contents cursor-pointer",
              isSelected && "bg-fuksi-400"
            )} key={rid ?? i} role="button" tabIndex={0} onClick={() => onRowClick?.(rid ?? i, i)}>
              {
                row.map((cell, j) => (
                  <div key={j} className={clsx(
                    "px-4 py-2 border-black",
                    ((i + 1) % 2 === 0) && "bg-white dark:bg-fuksi-900",
                    i !== (row_count - 1) && "border-b",
                    j !== (col_count - 1) && "border-r"
                  )}>
                    {cell}
                  </div>
                ))
              }
            </div>
          )
        })
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
  const advId = selectedAdventure?.id;

  const leaderboardRequest = useLeaderboard(advId ?? 0, {
    query: {
      enabled: !!advId,
      refetchInterval: 10000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      staleTime: 0,
    }
  });
  const rows = leaderboardRequest?.data?.data ?? [];

  const scoreRequest = useListAdminScores(advId ?? 0, {
    query: {
      enabled: !!advId,
      refetchInterval: 10000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      staleTime: 0,
    }
  })
  const scores = scoreRequest?.data?.data ?? [];

  const [opened, setOpened] = useState<number | undefined>(undefined);

  const teamScoreRows = useMemo(() => {
    if (opened == null) return [];
    const filtered = (scores ?? [])
      .filter(s => s.team?.id === opened)
      .sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));
    return filtered.map(score => ([
      <span className="block text-center">{formatDate(score.created_at)}</span>,
      <span className="truncate">{score.checkpoint?.org_name ?? "—"}</span>,
      <span className="block text-center">
        {Array.isArray(score.players) ? score.players.length : (score.players ?? "—")}
      </span>,
      <span className="block text-center">{score.score}</span>,
    ]));
  }, [opened, scores]);

  return (
    <div className="flex flex-col gap-4">
      <h2>{t("leaderboard")}</h2>
      <ol className="flex flex-col gap-4">
        <Grid rows={rows.map((row, pos) => [
          <span className="block text-center">{pos + 1}.</span>,
          <span>#{row.number} - {row.name}</span>,
          <span className="block text-center">{row.score}</span>,
          <span className="block text-center">{row.checkpoints}</span>,
          <span className="block text-center">
             {Number.isFinite(row.checkpoints) && row.checkpoints > 0
    ? (Math.round((row.score / row.checkpoints) * 100) / 100).toFixed(2)
    : "—"}
          </span>,
          <span className="block text-center">{formatDate(row.last_score_at)}</span>,
        ])}
          headers={["#", t("team"), t("score"), t("checkpoints"), t("avg"), t("latest-score")]}
          rowIds={rows.map((r) => r.id)}
          onRowClick={(id) => setOpened(Number(id))}
          selectedRowId={opened}
        />
      </ol>
      <div className="mt-4">
        {opened != null && (
          teamScoreRows.length > 0 ? (
            <Grid
              rows={teamScoreRows}
              headers={[t("time"), t("checkpoint"), t("players"), t("score")]}
              colsClass="grid-cols-[auto_1fr_auto_auto]"  // 4 columns
            />
          ) : (
            <div className="opacity-60">{t("no-scores-yet")}</div>
          )
        )}
      </div>
    </div>
  )
}
