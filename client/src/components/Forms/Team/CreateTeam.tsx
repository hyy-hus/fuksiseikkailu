import {
    getListAdminTeamsQueryKey,
    useCreateTeam,
} from "@api/endpoints";
import { Form } from "@components";
import { CreateTeam } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { FieldDef } from "../Form";
import { useAdventure } from "@contexts/AdventureContext";

export function CreateTeamForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateTeam();

    const { selectedAdventure } = useAdventure();

    function handleCreate(item: CreateTeam) {
        console.log(item);
        createMutation.mutateAsync(
            { adventureId: selectedAdventure?.id ?? 0, data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminTeamsQueryKey(selectedAdventure?.id ?? 0),
            })
        })
    }


    const fields: FieldDef<CreateTeam>[] = [
        { key: "name", name: t("name"), type: "text" },
    ]

    const emptyItem = useMemo(() => ({} as CreateTeam), []);

    return (
        <Form item={emptyItem} fields={fields} onSave={handleCreate} />
    )
}
