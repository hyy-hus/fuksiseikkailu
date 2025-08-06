import { AdminNews } from "@api/model";

import { ColumnDef, List } from "./List";
import { t } from "i18next";
import { useListAdminNews } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";

import { Toggle } from "@components";

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "numeric", hour: "2-digit", year: "numeric", minute: "2-digit"
})

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return t("not-published");
    }


    try {
        const date = new Date(dateString + "Z");
        return dateTimeFormat.format(date)
    } catch (error) {
        console.error("Could not parse ", dateString)
        return t("invalid-date")
    }
}

interface ListProps {
    onChange?: (items: AdminNews[]) => void;
    handleEdit?: (item: AdminNews) => void;
    handleRemove?: (items: AdminNews[]) => void;
}

export function NewsList(
    { onChange, handleEdit, handleRemove }: ListProps
) {
    const { selectedAdventure } = useAdventure();
    const { data, isLoading, isError, error } = useListAdminNews(selectedAdventure?.id ?? 0);

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

    const columns: ColumnDef<AdminNews>[] = [
        { header: "id", render: (a: AdminNews) => a.id },
        { header: "created_at", render: (a: AdminNews) => formatDate(a.created_at) },
        { header: "published_at", render: (a: AdminNews) => formatDate(a.published_at) },
        { header: "title_fi", render: (a: AdminNews) => a.title_fi },
        { header: "contents_fi", render: (a: AdminNews) => a.contents_fi },
        { header: "title_en", render: (a: AdminNews) => a.title_en },
        { header: "contents_en", render: (a: AdminNews) => a.contents_en },
        { header: "title_sv", render: (a: AdminNews) => a.title_sv },
        { header: "contents_sv", render: (a: AdminNews) => a.contents_sv },
        { header: "active", render: (a: AdminNews) => <Toggle value={a.active} /> },
    ]

    return (
        <>
            <List items={data.data} columns={columns} defaultSortCol="created_at"
                getKey={(item) => item.id}
                onChange={onChange}
                handleEdit={handleEdit}
                handleRemove={handleRemove}
            />
        </>
    )
}
