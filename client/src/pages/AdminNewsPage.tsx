import { getListAdminNewsQueryKey, useDeleteNews } from "@api/endpoints";
import { PublicNews } from "@api/model";
import { CreateNewsForm, ModifyNewsForm } from "@components";
import { NewsList } from "@components/Lists";
import { useAdventure } from "@contexts/AdventureContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next"

export function AdminNewsPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<PublicNews[]>([]);

    const { selectedAdventure } = useAdventure();

    const queryClient = useQueryClient();
    const deleteNewsMutation = useDeleteNews();

    function handleRemove(items: PublicNews[]) {
        const confirmed = confirm(`${t("confirm-delete-news")}: ${items.map(item => item.title_en).join(", ")}?`)

        if (!confirmed) {
            return;
        }

        Promise.all(
            items.map((item) =>
                deleteNewsMutation.mutateAsync({ adventureId: selectedAdventure?.id ?? 0, newsId: item.id }, {
                    onSuccess: () => {
                        console.log(`News #${item.id} deleted`);
                    },
                    onError: () => {
                        console.error(`Could not delete news #${item.id}`);
                    }
                })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: getListAdminNewsQueryKey(selectedAdventure?.id ?? 0),
                });
            })
    }

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("news")}</h2>
            <NewsList
                onChange={setSelected}
                handleEdit={(item: PublicNews) => setSelected([item])}
                handleRemove={handleRemove}
            />
            <div className={selected.length === 0 ? "block" : "hidden"}>
                <h3>{t("create-news")}</h3>
                <CreateNewsForm />
            </div>
            <div className={selected?.length === 1 ? "block" : "hidden"}>
                <h3>{t("modify-adventure")} {selected[0]?.title_en ?? ""}</h3>
                <ModifyNewsForm newsId={selected[0]?.id ?? 0} />
            </div>
        </div>
    )
}
