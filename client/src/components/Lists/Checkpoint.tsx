import { useListAdminCheckpointsCheckpointsAdminGet } from "@api/endpoints";
import { AdminCheckpoint } from "@api/model";

import { ColumnDef, List } from "./List";
import { t } from "i18next";
import { Link } from "react-router-dom";

interface ListProps {
    onChange?: (items: AdminCheckpoint[]) => void;
    handleEdit?: (item: AdminCheckpoint) => void;
    handleRemove?: (items: AdminCheckpoint[]) => void;
}

export function CheckpointList(
    { onChange, handleEdit, handleRemove }: ListProps
) {
    const { data, isLoading, isError, error } = useListAdminCheckpointsCheckpointsAdminGet();

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

    const columns: ColumnDef<AdminCheckpoint>[] = [
        { header: "id", render: (a: AdminCheckpoint) => a.id },
        { header: "org_name", render: (a: AdminCheckpoint) => a.org_name },
        { header: "org_abbreviation", render: (a: AdminCheckpoint) => a.org_abbreviation },
        { header: "category", render: (a: AdminCheckpoint) => a.category },
        { header: "latitude", render: (a: AdminCheckpoint) => a.latitude },
        { header: "longitude", render: (a: AdminCheckpoint) => a.longitude },
        { header: "address", render: (a: AdminCheckpoint) => a.address },
        { header: "checkpoint_description", render: (a: AdminCheckpoint) => a.checkpoint_description, width: "40em" },
        { header: "org_description", render: (a: AdminCheckpoint) => a.org_description },
        { header: "org_link", render: (a: AdminCheckpoint) => a.org_link },
        { header: "accessible", render: (a: AdminCheckpoint) => a.accessible ? "true" : "false" },
        { header: "contact_person", render: (a: AdminCheckpoint) => a.contact_person },
        { header: "contact_phone", render: (a: AdminCheckpoint) => a.contact_phone },
        { header: "requirements", render: (a: AdminCheckpoint) => a.requirements },
        { header: "lanes", render: (a: AdminCheckpoint) => a.lanes },
        { header: "photo_permission", render: (a: AdminCheckpoint) => a.photo_permission },
        { header: "adventure", render: (a: AdminCheckpoint) => <Link className="hover:underline" to={`/admin/adventures/${a.adventure.id}`}>{a.adventure.name}</Link> },
        { header: "active", render: (a: AdminCheckpoint) => a.active ? "true" : "false" },
    ]

    return (
        <>
            <List items={data.data} columns={columns} defaultSortCol="org_name"
                getKey={(item) => item.id}
                onChange={onChange}
                handleEdit={handleEdit}
                handleRemove={handleRemove}
            />
        </>
    )
}
