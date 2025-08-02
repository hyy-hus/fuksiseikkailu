import {
    getListAdminTeamsTeamsAdminGetQueryKey,
    useCreateTeamTeamsPost,
    useListAdventuresAdventuresGet
} from "@api/endpoints";
import { Form, FieldDef, Option } from "./Form";
import { CreateTeam } from "@api/model";
import { t } from "i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export function CreateTeamForm() {
    const queryClient = useQueryClient();
    const createMutation = useCreateTeamTeamsPost();
    const getAdventures = useListAdventuresAdventuresGet();

    const [adventureOptions, setAdventureOptions] = useState<Option[]>([]);

    useEffect(() => {
        if (getAdventures.data?.data) {
            setAdventureOptions(getAdventures.data.data.map(a => (({ key: String(a.id), value: a.name } as Option))));
        }
    }, [getAdventures.data?.data])

    function handleCreate(item: CreateTeam) {
        console.log(item);
        createMutation.mutateAsync(
            { data: item }
        ).then(() => {
            queryClient.invalidateQueries({
                queryKey: getListAdminTeamsTeamsAdminGetQueryKey(),
            })
        })
    }


    const fields: FieldDef<CreateTeam>[] = [
        { key: "adventure_id", name: t("adventure-id"), type: "option", options: adventureOptions },
        { key: "name", name: t("name"), type: "text" },
    ]

    const emptyItem = useMemo(() => ({} as CreateTeam), []);

    return (
        <Form item={emptyItem} fields={fields} onSave={handleCreate} />
    )
}
