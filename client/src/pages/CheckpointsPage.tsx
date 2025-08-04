import { getListAdminCheckpointsQueryKey, useDeleteCheckpoint } from "@api/endpoints";
import { PublicCheckpoint } from "@api/model";
import { CreateCheckpointForm, ModifyCheckpointForm } from "@components";
import { CheckpointList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next"

export function CheckpointsPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<PublicCheckpoint[]>([]);

    const { selectedAdventure } = useAdventure();

    const queryClient = useQueryClient();
    const deleteCheckpointMutation = useDeleteCheckpoint();

    function handleRemove(items: PublicCheckpoint[]) {
        const confirmed = confirm(`${t("confirm-delete-adventures")}: ${items.map(item => item.org_name).join(", ")}?`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteCheckpointMutation.mutateAsync({ adventureId: selectedAdventure?.id ?? 0, checkpointId: item.id }, {
                    onSuccess: () => {
                        console.log(`Checkpoint #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete checkpoint #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdminCheckpointsQueryKey(selectedAdventure?.id ?? 0),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("checkpoints")}</h2>
            <CheckpointList
                onChange={setSelected}
                handleEdit={(item: PublicCheckpoint) => setSelected([item])}
                handleRemove={handleRemove}
            />
            <div className={selected.length === 0 ? "block" : "hidden"}>
                <h3>{t("create-checkpoint")}</h3>
                <CreateCheckpointForm />
            </div>
            <div className={selected?.length === 1 ? "block" : "hidden"}>
                <h3>{t("modify-adventure")} {selected[0]?.org_name ?? ""}</h3>
                <ModifyCheckpointForm checkpointId={selected[0]?.id ?? 0} />
            </div>
        </div>
    )
}
