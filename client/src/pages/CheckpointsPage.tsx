import { getListAdminCheckpointsQueryKey, useDeleteCheckpoint } from "@api/endpoints";
import { PublicCheckpoint } from "@api/model";
import { CreateCheckpointForm, ModifyCheckpointForm } from "@components";
import { CheckpointList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
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
]

interface ColumnValue {
    inputColumn: string;
    outputColumn: string;
    identifier: boolean;
}

function BulkImport() {
    const [data, setData] = useState<string>("");
    const [uploadData, setUploadData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnValues, setColumnValues] = useState<ColumnValue[]>(() =>
        adminCheckpointOptions.map(opt => ({ inputColumn: opt.key, outputColumn: "skip", identifier: false })
        )
    )

    useEffect(() => {
        const rows = data.split("\n");
        const cells = rows.map(row => row.split("\t"));

        setUploadData(cells);
        setHeaders(cells[0] ?? [])
    }, [data])

    useEffect(() => {
        if (headers.length === 0) {
            return;
        }

        setColumnValues(
            headers.map(header => ({
                inputColumn: header,
                outputColumn: "skip",
                identifier: false,
            }))
        );
    }, [headers])

    const uploadItems = useCallback(async () => {
        const rows = uploadData
            .slice()
            .map((row) => {
                const obj: Record<string, string> = {};

                columnValues.forEach((val, index) => {
                    if (val.outputColumn !== "skip") {
                        obj[val.outputColumn] = row[index] ?? "";
                    }
                });

                return obj;
            })

        console.log(rows);
    }, [columnValues, uploadData])




    return (
        <form className="flex flex-col gap-4">
            <h3>{t("bulk-import")}</h3>
            <label className="w-full">
                You can insert data copied from excel or google sheets here. You should probably sanitize the input by doing find and replaces for <pre>'\n' -&gt; ''</pre> and <pre>'\t' -&gt; ''</pre> first.
                <textarea rows={5}
                    className="w-full rounded border border-zinc-400 bg-zinc-300 dark:border-slate-700 dark:bg-slate-800 p-4"
                    onChange={(e) => setData(e.target.value)}>
                    {data}
                </textarea>
            </label>
            <div className="overflow-x-auto max-w-full border border-slate-700">
                <table className="w-fit table-auto border-collapse">
                    {uploadData.map((row, i) => (
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
                                            setUploadData(prev => {
                                                const newData = [...prev];
                                                if (!newData[i]) {
                                                    return prev;
                                                }

                                                newData[i] = [...newData[i]];
                                                newData[i][j] = newValue;

                                                return newData;
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
            <ul className="w-full grid grid-cols-[minmax(auto,30rem)_auto_auto_auto] gap-4 items-center">
                <div className="contents">
                    <span>{t("import-data-column")}</span>
                    <span></span>
                    <span className="">{t("save-value-as")}</span>
                    <span className="flex justify-center">{t("identifier")}</span>
                </div>
                {
                    headers.map(header => (
                        <li key={header}
                            className="contents"
                        >
                            <div className="flex items-center"><span>{header}</span></div>
                            <div className="flex items-center justify-center"><FaArrowRight /></div>
                            <div className="flex items-center w-full">
                                <Select options={adminCheckpointOptions}
                                    value={columnValues.find(val => val.inputColumn === header)?.outputColumn}
                                    onChange={(e) => {
                                        setColumnValues((prev) => {
                                            return prev.map(val => {
                                                if (val.inputColumn === header) {
                                                    return { ...val, outputColumn: e.target.value };
                                                }

                                                return val;
                                            })
                                        })
                                    }} />
                            </div>
                            <div className="flex items-center justify-center w-full">
                                <Toggle
                                    value={(() => {
                                        const newVal = columnValues.find(val => val.inputColumn === header)?.identifier
                                        return newVal
                                    })()}
                                    onChange={(newValue) => {
                                        setColumnValues((prev) => {
                                            return prev.map(val => {
                                                if (val.inputColumn === header) {
                                                    return { ...val, identifier: newValue };
                                                }

                                                return val;
                                            })
                                        })
                                    }}
                                />
                            </div>
                        </li>
                    ))
                }
            </ul>
            <Button variant="green" onClick={uploadItems}
            >
                Upload
            </Button>
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
