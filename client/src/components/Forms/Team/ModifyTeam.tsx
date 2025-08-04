import {
    useFetchAdminTeam,
    usePatchTeam,
    getListAdminTeamsQueryKey,
    getFetchAdminTeamQueryKey,
} from "@api/endpoints";
import { Form } from "@components";
import { ModifyTeam } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { FieldDef } from "../Form";
import { useAdventure } from "@contexts/AdventureContext";

interface TeamFormProps {
    teamId: number;
}

export function ModifyTeamForm({ teamId }: TeamFormProps) {
    const queryClient = useQueryClient();

    const { selectedAdventure } = useAdventure();

    const { data, isLoading, isError, error } = useFetchAdminTeam(selectedAdventure?.id ?? 0, teamId);
    const updateMutation = usePatchTeam();

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

    function handleSave(item: ModifyTeam) {
        updateMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, teamId: teamId, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminTeamsQueryKey(selectedAdventure?.id ?? 0),
            })

            queryClient.invalidateQueries({
                queryKey: getFetchAdminTeamQueryKey(selectedAdventure?.id ?? 0, teamId),
            })
        })
    }


    const fields: FieldDef<ModifyTeam>[] = [
        { key: "name", name: t("name"), type: "text" },
    ]

    return (
        <Form item={{ ...data.data }} fields={fields} onSave={handleSave} />
    )
}
