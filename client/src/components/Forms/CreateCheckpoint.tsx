import {
    getListAdminCheckpointsCheckpointsAdminGetQueryKey,
    useCreateCheckpointCheckpointsPost,
    useListAdventuresAdventuresGet
} from "@api/endpoints";
import { Form, FieldDef, Option } from "./Form";
import { CreateCheckpoint } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export function CreateCheckpointForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateCheckpointCheckpointsPost();
    const getAdventures = useListAdventuresAdventuresGet();

    const [adventureOptions, setAdventureOptions] = useState<Option[]>([]);

    useEffect(() => {
        if (getAdventures.data?.data) {
            setAdventureOptions(getAdventures.data.data.map(a => (({ key: String(a.id), value: a.name } as Option))));
        }
    }, [getAdventures.data?.data])

    function handleCreate(item: CreateCheckpoint) {
        createMutation.mutateAsync(
            { data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminCheckpointsCheckpointsAdminGetQueryKey(),
            })
        })
    }


    const fields: FieldDef<CreateCheckpoint>[] = [
        { key: "adventure_id", name: t("adventure-id"), type: "option", options: adventureOptions },
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
