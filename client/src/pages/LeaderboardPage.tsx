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


  return (
    <div className="flex flex-col gap-4">
      <h2>{t("leaderboard")}</h2>
      <ol className="flex flex-col gap-4">
        <Grid rows={rows.slice(0, 10).map((row, pos) => [
          <span className="block text-center">{pos + 1}.</span>,
          <span>{t("team")} #{row.id}</span>,
          <span className="block text-center">{row.score}</span>,
        ])}
          headers={["#", t("team"), t("score") ]}
          colsClass="grid-cols-[auto_1fr_auto]"  // 3 columns
        />
      </ol>
    </div>
  )
}
