import { getListAdminTeamsQueryKey, useBulkCreateTeams, useDeleteTeam } from "@api/endpoints";
import { AdminTeam, CreateTeam, CreateTeamNumber } from "@api/model";
import { CreateTeamForm, ModifyTeamForm } from "@components";
import { Button } from "@components/Button";
import { Select, Toggle } from "@components/Input";
import { TeamList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { t } from "i18next";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next"
import { FaArrowRight } from "react-icons/fa";

const adminTeamOptions = [
    { key: "skip", value: t("skip") },

    { key: "name", value: t("name") },
    { key: "number", value: t("number") },
    { key: "player_1", value: `${t("player")} 1` },
    { key: "phone_1", value: `${t("phone")} 1` },
    { key: "player_2", value: `${t("player")} 2` },
    { key: "phone_2", value: `${t("phone")} 2` },
    { key: "player_3", value: `${t("player")} 3` },
    { key: "phone_3", value: `${t("phone")} 3` },
    { key: "player_4", value: `${t("player")} 4` },
    { key: "phone_4", value: `${t("phone")} 4` },
    { key: "player_5", value: `${t("player")} 5` },
    { key: "phone_5", value: `${t("phone")} 5` },
    { key: "player_6", value: `${t("player")} 6` },
    { key: "phone_6", value: `${t("phone")} 6` },
    { key: "player_7", value: `${t("player")} 7` },
    { key: "phone_7", value: `${t("phone")} 7` },
    { key: "player_8", value: `${t("player")} 8` },
    { key: "phone_8", value: `${t("phone")} 8` },
    { key: "player_9", value: `${t("player")} 9` },
    { key: "phone_9", value: `${t("phone")} 9` },
    { key: "id", value: t("id") },
    { key: "active", value: t("active") },
];

interface ColumnValue {
    inputColumn: string;
    outputColumn: string;
    identifier: boolean;
}

interface ColumnMappingRowProps {
    header: string;
    value?: ColumnValue;
    onChange: (val: Partial<ColumnValue>) => void;
}

function ColumnMappingRow({ header, value, onChange }: ColumnMappingRowProps) {
    return (
        <li key={header}
            className="contents"
        >
            <div className="flex items-center"><span>{header}</span></div>
            <div className="flex items-center justify-center"><FaArrowRight /></div>
            <div className="flex items-center w-full">
                <Select options={adminTeamOptions}
                    value={value?.outputColumn ?? "skip"}
                    onChange={(value: string | number) => {
                        onChange({ outputColumn: String(value) })
                    }
                    }
                />
            </div>
            <div className="flex items-center justify-center w-full">
                <Toggle
                    value={value?.identifier ?? false}
                    onChange={(newValue) => {
                        onChange({ identifier: newValue })
                    }}
                />
            </div>
        </li>
    );
}

interface ColumnMappingProps {
    headers: string[];
    columnValues: ColumnValue[];
    setColumnValues: React.Dispatch<React.SetStateAction<ColumnValue[]>>
}

function ColumnMapping({ headers, columnValues, setColumnValues }: ColumnMappingProps) {
    const updateColumnValue = useCallback((
        header: string,
        newPartial: Partial<ColumnValue>
    ) => {
        setColumnValues(prev =>
            prev.map(val =>
                val.inputColumn === header ? { ...val, ...newPartial } : val
            )
        );
    }, [setColumnValues]);

    return (
        <ul className="w-full grid grid-cols-[minmax(auto,30rem)_auto_auto_auto] gap-4 items-center">
            <div className="contents">
                <span>{t("import-data-column")}</span>
                <span></span>
                <span className="">{t("save-value-as")}</span>
                <span className="flex justify-center">{t("identifier")}</span>
            </div>
            {
                headers.map(header => (
                    <ColumnMappingRow
                        key={header}
                        header={header}
                        value={columnValues.find(val => val.inputColumn === header)}
                        onChange={(partial) => updateColumnValue(header, partial)}
                    />
                ))
            }
        </ul>
    )
}

interface UploadTableProps {
    data: string[][];
    setData: React.Dispatch<React.SetStateAction<string[][]>>
}

function UploadTable({ data, setData }: UploadTableProps) {
    return (
        <div className="overflow-x-auto max-w-full border border-slate-700">
            <table className="w-fit table-auto border-collapse">
                {data.map((row, i) => (
                    <tr key={i} className={clsx(
                        i === 0 ? "bg-slate-700 text-white font-bold sticky top-0 z-10" : "odd:bg-slate-800"
                    )}>
                        {
                            row.map((cell, j) => (
                                <td key={j}
                                    contentEditable={i !== 0}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        if (i === 0) {
                                            return;
                                        }

                                        const newValue = e.currentTarget.textContent ?? "";
                                        const rowIndex = i;
                                        const colIndex = j;

                                        setData(prev => {
                                            const updated = [...prev];
                                            if (!updated[rowIndex]) {
                                                return prev;
                                            }

                                            updated[rowIndex] = [...updated[rowIndex]];
                                            updated[rowIndex][colIndex] = newValue;

                                            return updated;
                                        });
                                    }}
                                    className={clsx(
                                        "p-2 text-sm whitespace-nowrap max-w-100 overflow-x-hidden text-ellipsis",
                                        i > 0 && "border-t border-slate-700",
                                        j > 0 && "border-l border-slate-700"
                                    )}
                                >
                                    {cell}
                                </td>
                            ))
                        }
                    </tr>
                ))
                }
            </table>
        </div>
    );
}

interface PasteAreaProps {
    onPaste: (rows: string[][]) => void;
}

function InlineCodeBlock({ className, children }: { className?: string, children: ReactNode }) {
    return (
        <span className={clsx(
            "inline whitespace-pre mx-2 px-1 py-[1px] border rounded border-slate-700 bg-slate-800 text-[0.85em] font-mono align-middle text-slate-300",
            className ?? ""
        )}>
            {children}
        </span>
    )
}

function PasteArea({ onPaste }: PasteAreaProps) {
    return (
        <div>
            <label className="w-full flex flex-col gap-2">
                <p>You can insert data copied from excel or google sheets here. You should probably sanitize the input by doing find and replaces for
                    <InlineCodeBlock>'\n' &rarr; ''</InlineCodeBlock>
                    and
                    <InlineCodeBlock>'\t' &rarr; ''</InlineCodeBlock>
                    first.</p>
                <textarea rows={5}
                    className="w-full rounded border border-zinc-400 bg-zinc-300 dark:border-slate-700 dark:bg-slate-800 p-4"
                    onChange={(e) => {
                        const raw = e.target.value.trim();
                        const rows = raw.split("\n").map(row => row.split("\t"));
                        onPaste(rows);
                    }}
                >
                </textarea>
            </label>
        </div>
    );
}



function BulkImport() {
    const [uploadData, setUploadData] = useState<string[][]>([]);
    const headers = uploadData[0] ?? [];

    const { selectedAdventure } = useAdventure();

    const [columnValues, setColumnValues] = useState<ColumnValue[]>([]);

    useEffect(() => {
        if (headers.length === 0) {
            return;
        }

        setColumnValues(headers.map(header => ({
            inputColumn: header,
            outputColumn: "skip",
            identifier: false,
        })));
    }, [headers])

    const mutateImport = useBulkCreateTeams();

    function getPlayers(row: Record<string, string>) {
        let res = [];
        for (let i = 1; i<9; i++) {
            let cur_name = row[`player_${i}`];
            let cur_phone = row[`phone_${i}`];

            if (cur_name && cur_name !== "") {
                res.push({
                    "name": cur_name,
                    "phone": cur_phone ?? ""
                })
            }
        }

        return res
    }

    const uploadItems = useCallback(async () => {
        const rows = uploadData
            .slice(1)
            .map((row) => {
                const obj: Record<string, string> = {};
                columnValues.forEach((val, index) => {
                    if (val.outputColumn !== "skip") {
                        obj[val.outputColumn] = row[index] ?? "";
                    }
                });

                return obj;
            });

        const payload: CreateTeam[] = rows.map(row => {
            let num: CreateTeamNumber = Number(row.number) ?? null;
            return {
                "name": row.name,
                "number": num,
                "players": getPlayers(row)
            }
        })

        mutateImport.mutate({ adventureId: selectedAdventure?.id ?? 0, data: payload });

    }, [columnValues, uploadData]);




    return (
        <form className="flex flex-col gap-4">
            <h3>{t("bulk-import")}</h3>
            <PasteArea onPaste={setUploadData} />
            {(headers.length > 0 && !(headers.length === 1 && headers[0] === "")) && (
                <>
                    <UploadTable data={uploadData} setData={setUploadData} />
                    <ColumnMapping
                        headers={headers}
                        columnValues={columnValues}
                        setColumnValues={setColumnValues}
                    />
                    <Button variant="green" onClick={uploadItems}
                    >
                        Upload
                    </Button>
                </>
            )
            }
        </form>
    )
}

export function TeamsPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<AdminTeam[]>([]);

    const queryClient = useQueryClient();
    const deleteTeamMutation = useDeleteTeam();

    const { selectedAdventure } = useAdventure();

    function handleRemove(items: AdminTeam[]) {
        const confirmed = confirm(`${t("confirm-delete-adventures")}: ${items.map(item => item.name).join(", ")}?`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteTeamMutation.mutateAsync({ adventureId: selectedAdventure?.id ?? 0, teamId: item.id }, {
                    onSuccess: () => {
                        console.log(`Team #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete team #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdminTeamsQueryKey(selectedAdventure?.id ?? 0),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("teams")}</h2>
            <TeamList
                onChange={setSelected}
                handleEdit={(item: AdminTeam) => setSelected([item])}
                handleRemove={handleRemove}
            />
            <div className={selected.length === 0 ? "block" : "hidden"}>
                <h3>{t("create-team")}</h3>
                <CreateTeamForm />
            </div>
            <div className={selected?.length === 1 ? "block" : "hidden"}>
                <h3>{t("modify-adventure")} {selected[0]?.name ?? ""}</h3>
                <ModifyTeamForm teamId={selected[0]?.id ?? 0} />
            </div>
            <BulkImport />
        </div>
    )
}
