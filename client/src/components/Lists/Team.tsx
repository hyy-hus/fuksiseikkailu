import { useListAdminTeams } from "@api/endpoints";
import { AdminTeam } from "@api/model";

import { ColumnDef, List } from "./List";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { useAdventure } from "@contexts/AdventureContext";
import { encodeSlug } from "@utils/slug";

interface ListProps {
    onChange?: (items: AdminTeam[]) => void;
    handleEdit?: (item: AdminTeam) => void;
    handleRemove?: (items: AdminTeam[]) => void;
}

export function TeamList(
    { onChange, handleEdit, handleRemove }: ListProps
) {
    const { selectedAdventure } = useAdventure();
    const { data, isLoading, isError, error } = useListAdminTeams(selectedAdventure?.id ?? 0);


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

    const columns: ColumnDef<AdminTeam>[] = [
        { header: "id", render: (a: AdminTeam) => a.id },
        { header: "adventure", render: (a: AdminTeam) => <Link className="hover:underline" to={`/admin/adventures/${a.adventure.id}`}>{a.adventure.name}</Link> },
        { header: "name", render: (a: AdminTeam) => a.name },
        { header: "active", render: (a: AdminTeam) => a.active ? "true" : "false" },
        { header: "active", render: (a: AdminTeam) => encodeSlug(`team-${a.id}`) },
    ]

    return (
        <>
            <List items={data.data} columns={columns} defaultSortCol="name"
                getKey={(item) => item.id}
                onChange={onChange}
                handleEdit={handleEdit}
                handleRemove={handleRemove}
            />
        </>
    )
}
