import { getListAdminCheckpointsQueryKey, useDeleteCheckpoint, useImportAdminCheckpoint } from "@api/endpoints";
import { ImportPayload, PublicCheckpoint } from "@api/model";
import { CreateCheckpointForm, ModifyCheckpointForm } from "@components";
import { CheckpointList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next"

import { clsx } from "clsx";
import { Button } from "@components/Button";
import { Select, Toggle } from "@components/Input";
import { FaArrowRight } from "react-icons/fa";

const adminCheckpointOptions = [
    { key: "skip", value: t("skip") },

    { key: "org_name", value: t("org_name") },
    { key: "org_abbreviation", value: t("org_abbreviation") },
    { key: "category", value: t("category") },
    { key: "latitude", value: t("latitude") },
    { key: "longitude", value: t("longitude") },
    { key: "address", value: t("address") },
    { key: "checkpoint_description", value: t("checkpoint_description") },
    { key: "org_description", value: t("org_description") },
    { key: "org_link", value: t("org_link") },
    { key: "accessible", value: t("accessible") },
    { key: "id", value: t("id") },
    { key: "contact_person", value: t("contact_person") },
    { key: "contact_email", value: t("contact_email") },
    { key: "contact_phone", value: t("contact_phone") },
    { key: "requirements", value: t("requirements") },
    { key: "lanes", value: t("lanes") },
    { key: "photo_permission", value: t("photo_permission") },
    { key: "adventure_id", value: t("adventure_id") },
    { key: "adventure", value: t("adventure") },
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
                <Select options={adminCheckpointOptions}
                    value={value?.outputColumn ?? "skip"}
                    onChange={(e) => {
                        onChange({ outputColumn: e.target.value })
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

    const mutateImport = useImportAdminCheckpoint();

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

        const payload: ImportPayload = {
            identifiers: columnValues
                .filter(val => val.identifier)
                .map(val => val.outputColumn),
            data: rows
        };

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

export function CheckpointsPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<PublicCheckpoint[]>([]);

    const { selectedAdventure } = useAdventure();

    const queryClient = useQueryClient();
    const deleteCheckpointMutation = useDeleteCheckpoint();

    function handleRemove(items: PublicCheckpoint[]) {
        const confirmed = confirm(`${t("confirm-delete-adventures")}: ${items.map(item => item.org_name).join(", ")}?`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteCheckpointMutation.mutateAsync({ adventureId: selectedAdventure?.id ?? 0, checkpointId: item.id }, {
                    onSuccess: () => {
                        console.log(`Checkpoint #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete checkpoint #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdminCheckpointsQueryKey(selectedAdventure?.id ?? 0),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("checkpoints")}</h2>
            <CheckpointList
                onChange={setSelected}
                handleEdit={(item: PublicCheckpoint) => setSelected([item])}
                handleRemove={handleRemove}
            />
            <div className={selected.length === 0 ? "block" : "hidden"}>
                <h3>{t("create-checkpoint")}</h3>
                <CreateCheckpointForm />
            </div>
            <div className={selected?.length === 1 ? "block" : "hidden"}>
                <h3>{t("modify-adventure")} {selected[0]?.org_name ?? ""}</h3>
                <ModifyCheckpointForm checkpointId={selected[0]?.id ?? 0} />
            </div>
            <div>
                <BulkImport />
            </div>

        </div>
    )
}
