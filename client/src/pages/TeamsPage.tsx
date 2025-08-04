import { getListAdminTeamsQueryKey, useDeleteTeam } from "@api/endpoints";
import { AdminTeam } from "@api/model";
import { CreateTeamForm, ModifyTeamForm } from "@components";
import { TeamList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next"

export function TeamsPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<AdminTeam[]>([]);

    const queryClient = useQueryClient();
    const deleteTeamMutation = useDeleteTeam();

    const { selectedAdventure } = useAdventure();

    function handleRemove(items: AdminTeam[]) {
        const confirmed = confirm(`${t("confirm-delete-adventures")}: ${items.map(item => item.name).join(", ")}?`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteTeamMutation.mutateAsync({ adventureId: selectedAdventure?.id ?? 0, teamId: item.id }, {
                    onSuccess: () => {
                        console.log(`Team #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete team #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdminTeamsQueryKey(selectedAdventure?.id ?? 0),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("teams")}</h2>
            <TeamList
                onChange={setSelected}
                handleEdit={(item: AdminTeam) => setSelected([item])}
                handleRemove={handleRemove}
            />
            <div className={selected.length === 0 ? "block" : "hidden"}>
                <h3>{t("create-team")}</h3>
                <CreateTeamForm />
            </div>
            <div className={selected?.length === 1 ? "block" : "hidden"}>
                <h3>{t("modify-adventure")} {selected[0]?.name ?? ""}</h3>
                <ModifyTeamForm teamId={selected[0]?.id ?? 0} />
            </div>
        </div>
    )
}
