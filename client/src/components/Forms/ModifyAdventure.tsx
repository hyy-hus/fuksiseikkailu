import { getListAdventuresAdventuresGetQueryKey, useFetchAdventureAdventuresAdventureIdGet, useUpdateAdventureAdventuresAdventureIdPatch } from "@api/endpoints";
import { Form, FieldDef } from "./Form";
import { ModifyAdventure } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";

interface AdventureFormProps {
    adventureId: number;
}

export function ModifyAdventureForm({ adventureId }: AdventureFormProps) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useFetchAdventureAdventuresAdventureIdGet(adventureId);
    const updateMutation = useUpdateAdventureAdventuresAdventureIdPatch();

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


    function handleSave(item: ModifyAdventure) {
        updateMutation.mutateAsync(
            { adventureId: adventureId, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdventuresAdventuresGetQueryKey(),
            })
        })
    }

    const fields: FieldDef<ModifyAdventure>[] = [
        { key: "name", name: t("name"), type: "text" },
        { key: "year", name: t("year"), type: "number" },
        { key: "ongoing", name: t("ongoing"), type: "toggle" },
        { key: "can_add_scores", name: t("can-add-scores"), type: "toggle" },
        { key: "test", name: t("test"), type: "toggle" },
    ]

    return (
        <Form item={data.data as ModifyAdventure} fields={fields} onSave={handleSave} />
    )
}
