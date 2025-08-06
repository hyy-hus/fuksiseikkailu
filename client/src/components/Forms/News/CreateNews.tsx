import { Form, FieldDef } from "../Form";
import { CreateNews } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getListAdminNewsQueryKey, useCreateNews } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";

export function CreateNewsForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateNews();

    const { selectedAdventure } = useAdventure();

    function handleCreate(item: CreateNews) {
        createMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminNewsQueryKey(selectedAdventure?.id ?? 0),
            })
        })
    }


    const fields: FieldDef<CreateNews>[] = [
        { key: "title_en", name: t("title"), type: "text" },
        { key: "contents_en", name: t("description"), type: "textarea" },
        { key: "title_fi", name: t("title"), type: "text" },
        { key: "contents_fi", name: t("description"), type: "textarea" },
        { key: "title_sv", name: t("title"), type: "text" },
        { key: "contents_sv", name: t("description"), type: "textarea" },
        { key: "active", name: t("active"), type: "toggle" },
    ]

    const emptyItem = useMemo(() => ({} as CreateNews), []);

    return (
        <Form item={emptyItem} fields={fields} onSave={handleCreate} />
    )
}
