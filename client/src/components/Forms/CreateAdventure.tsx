import { getListAdventuresAdventuresGetQueryKey, useCreateAdventureAdventuresPost } from "@api/endpoints";
import { Form, FieldDef } from "./Form";
import { CreateAdventure } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";

export function CreateAdventureForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateAdventureAdventuresPost();

    function handleCreate(item: CreateAdventure) {
        createMutation.mutateAsync(
            { data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdventuresAdventuresGetQueryKey(),
            })
        })
    }

    const fields: FieldDef<CreateAdventure>[] = [
        { key: "name", name: t("name"), type: "text" },
        { key: "year", name: t("year"), type: "number" },
        { key: "ongoing", name: t("ongoing"), type: "toggle" },
        { key: "can_add_scores", name: t("can-add-scores"), type: "toggle" },
        { key: "test", name: t("test"), type: "toggle" },
    ]

    return (
        <Form item={{} as CreateAdventure} fields={fields} onSave={handleCreate} />
    )
}
