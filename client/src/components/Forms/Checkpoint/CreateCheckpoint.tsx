import { Form, FieldDef } from "../Form";
import { CreateCheckpoint } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getListAdminCheckpointsQueryKey, useCreateCheckpoint } from "@api/endpoints";
import { useAdventure } from "@contexts/AdventureContext";

export function CreateCheckpointForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateCheckpoint();

    const { selectedAdventure } = useAdventure();

    function handleCreate(item: CreateCheckpoint) {
        createMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminCheckpointsQueryKey(selectedAdventure?.id ?? 0),
            })
        })
    }


    const fields: FieldDef<CreateCheckpoint>[] = [
        { key: "number", name: t("number"), type: "number" },
        { key: "org_name", name: t("org-name"), type: "text" },
        { key: "org_abbreviation", name: t("org-abbreviation"), type: "text" },
        { key: "category", name: t("category"), type: "text" },
        { key: "latitude", name: t("latitude"), type: "text" },
        { key: "longitude", name: t("longitude"), type: "text" },
        { key: "address", name: t("address"), type: "text" },
        { key: "checkpoint_description", name: t("checkpoint-description"), type: "text" },
        { key: "org_description", name: t("org-description"), type: "text" },
        { key: "org_link", name: t("org-link"), type: "text" },
        { key: "accessible", name: t("accessible"), type: "toggle" },
        { key: "contact_person", name: t("contact-person"), type: "text" },
        { key: "contact_email", name: t("contact-email"), type: "text" },
        { key: "contact_phone", name: t("contact-phone"), type: "text" },
        { key: "requirements", name: t("requirements"), type: "text" },
        { key: "lanes", name: t("lanes"), type: "number" },
        { key: "photo_permission", name: t("photo-permission"), type: "toggle" },
    ]

    const emptyItem = useMemo(() => ({} as CreateCheckpoint), []);

    return (
        <Form item={emptyItem} fields={fields} onSave={handleCreate} />
    )
}
