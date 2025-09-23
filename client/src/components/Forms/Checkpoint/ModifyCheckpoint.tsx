import {
    getFetchAdminCheckpointQueryKey,
    getListAdminCheckpointsQueryKey,
    useFetchAdminCheckpoint,
    usePatchCheckpoint,
} from "@api/endpoints";
import { Form, FieldDef } from "../Form";
import { ModifyCheckpoint } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAdventure } from "@contexts/AdventureContext";

interface CheckpointFormProps {
    checkpointId: number;
}

export function ModifyCheckpointForm({ checkpointId }: CheckpointFormProps) {
    const queryClient = useQueryClient();
    const { selectedAdventure } = useAdventure();

    const { data, isLoading, isError, error } = useFetchAdminCheckpoint(selectedAdventure?.id ?? 0, checkpointId);
    const updateMutation = usePatchCheckpoint();

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

    function handleSave(item: ModifyCheckpoint) {
        updateMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, checkpointId: checkpointId, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminCheckpointsQueryKey(selectedAdventure?.id ?? 0),
            })

            queryClient.invalidateQueries({
                queryKey: getFetchAdminCheckpointQueryKey(selectedAdventure?.id ?? 0, checkpointId),
            })
        })
    }


    const fields: FieldDef<ModifyCheckpoint>[] = [
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

    return (
        <Form item={{ ...data.data }} fields={fields} onSave={handleSave} />
    )
}
