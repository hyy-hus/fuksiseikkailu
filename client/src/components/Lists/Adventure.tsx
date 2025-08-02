import { useListAdventuresAdventuresGet } from "@api/endpoints";
import { PublicAdventure } from "@api/model";

import { ColumnDef, List } from "./List";
import { t } from "i18next";

export function AdventureList() {
    const { data, isLoading, isError, error } = useListAdventuresAdventuresGet();

    if (isLoading) {
        return (
            <div>{t("loading")}</div>
        );
    }

    if (isError) {
        return (
            <div className="text-red-600">
                {t("network-error")}: {String((error as any)?.message ?? error)}
            </div>
        )
    }

    if (!data || data.data.length === 0) {
        return <div>{t("no-adventures-found")}</div>
    }

    const columns: ColumnDef<PublicAdventure>[] = [
        { header: "id", render: (a: PublicAdventure) => a.id },
        { header: "year", render: (a: PublicAdventure) => a.year },
        { header: "name", render: (a: PublicAdventure) => a.name, width: "1fr" },
        { header: "ongoing", render: (a: PublicAdventure) => a.ongoing ? "true" : "false" },
        { header: "test", render: (a: PublicAdventure) => a.test ? "true" : "false" },
    ]

    return (
        <>
            <List items={data.data} columns={columns} defaultSortCol="year"
                getKey={(item) => item.id}
                onChange={(items) => console.log("selected:", items)}
                handleEdit={(item) => console.log("edit:", item)}
                handleRemove={(item) => console.log("remove:", item)}
            />
        </>
    )
}
