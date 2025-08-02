import { getListAdventuresAdventuresGetQueryKey, useDeleteAdventureAdventuresAdventureIdDelete } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { AdventureList } from "@components/Lists";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next"

export function AdventuresPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<PublicAdventure[]>([]);

    const queryClient = useQueryClient();
    const deleteAdventureMutation = useDeleteAdventureAdventuresAdventureIdDelete();

    function handleRemove(items: PublicAdventure[]) {
        const confirmed = confirm(`Are you sure you want to delete these adventures: ${items.map(item => item.name).join(", ")}`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteAdventureMutation.mutateAsync({ adventureId: item.id }, {
                    onSuccess: () => {
                        console.log(`Adventure #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete adventure #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdventuresAdventuresGetQueryKey(),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("adventures")}</h2>
            <AdventureList
                onChange={setSelected}
                handleEdit={(item: PublicAdventure) => setSelected([item])}
                handleRemove={handleRemove}
            />
            {
                selected.length === 0 && (
                    <span>None selected</span>
                )
            }
            {
                selected.length === 1 && (
                    <span>One selected: {selected[0].name}</span>
                )
            }
            {
                selected.length > 1 && (
                    <span>Multiple selected</span>
                )
            }
        </div>
    )
}
