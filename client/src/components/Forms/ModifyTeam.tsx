import {
    useFetchAdminTeamTeamsAdminTeamIdGet,
    useUpdateTeamTeamsTeamIdPatch,
    useListAdventuresAdventuresGet,
    getListAdminTeamsTeamsAdminGetQueryKey,
    getFetchAdminTeamTeamsAdminTeamIdGetQueryKey,
} from "@api/endpoints";
import { Form, FieldDef, Option } from "./Form";
import { ModifyTeam } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface TeamFormProps {
    teamId: number;
}

export function ModifyTeamForm({ teamId }: TeamFormProps) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useFetchAdminTeamTeamsAdminTeamIdGet(teamId);
    const updateMutation = useUpdateTeamTeamsTeamIdPatch();

    const getAdventures = useListAdventuresAdventuresGet();

    const [adventureOptions, setAdventureOptions] = useState<Option[]>([]);

    useEffect(() => {
        if (getAdventures.data?.data) {
            setAdventureOptions(getAdventures.data.data.map(a => (({ key: String(a.id), value: a.name } as Option))));
        }
    }, [getAdventures.data?.data])


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
            { teamId: teamId, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminTeamsTeamsAdminGetQueryKey(),
            })

            queryClient.invalidateQueries({
                queryKey: getFetchAdminTeamTeamsAdminTeamIdGetQueryKey(teamId),
            })
        })
    }


    const fields: FieldDef<ModifyTeam>[] = [
        { key: "adventure_id", name: t("adventure-id"), type: "option", options: adventureOptions },
        { key: "name", name: t("name"), type: "text" },
    ]

    return (
        <Form item={{ ...data.data }} fields={fields} onSave={handleSave} />
    )
}
