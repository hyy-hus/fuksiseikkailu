import {
    getFetchAdminNewsQueryKey,
    getListAdminNewsQueryKey,
    useFetchAdminNews,
    usePatchNews,
} from "@api/endpoints";
import { Form, FieldDef } from "../Form";
import { ModifyNews } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAdventure } from "@contexts/AdventureContext";

interface NewsFormProps {
    newsId: number;
}

export function ModifyNewsForm({ newsId }: NewsFormProps) {
    const queryClient = useQueryClient();
    const { selectedAdventure } = useAdventure();

    const { data, isLoading, isError, error } = useFetchAdminNews(selectedAdventure?.id ?? 0, newsId);
    const updateMutation = usePatchNews();

    if (isLoading) {
        return (
            <div>{t("loading")}</div>
        );
    }

    if (isError || updateMutation.isError) {
        return (
            <div className="text-red-600">
                {t("network-error")}: {String((error as any || updateMutation.error)?.message ?? error)}
            </div>
        )
    }

    if (!data) {
        return <div>{t("not-found")}</div>
    }

    function handleSave(item: ModifyNews) {
        updateMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, newsId: newsId, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminNewsQueryKey(selectedAdventure?.id ?? 0),
            })

            queryClient.invalidateQueries({
                queryKey: getFetchAdminNewsQueryKey(selectedAdventure?.id ?? 0, newsId),
            })
        })
    }


    const fields: FieldDef<ModifyNews>[] = [
        { key: "title_en", name: t("title-en"), type: "text" },
        { key: "contents_en", name: t("contents-en"), type: "textarea" },
        { key: "title_fi", name: t("title-fi"), type: "text" },
        { key: "contents_fi", name: t("contents-fi"), type: "textarea" },
        { key: "title_sv", name: t("title-sv"), type: "text" },
        { key: "contents_sv", name: t("contents-sv"), type: "textarea" },
        { key: "active", name: t("published"), type: "toggle" },
    ]

    return (
        <Form item={{ ...data.data }} fields={fields} onSave={handleSave} />
    )
}
