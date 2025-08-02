import { PublicAdventure } from "@api/model";
import { AdventureList } from "@components/Lists";
import { useState } from "react";
import { useTranslation } from "react-i18next"

export function AdventuresPage() {
    const { t } = useTranslation();

    const [selected, setSelected] = useState<PublicAdventure[]>([]);

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("adventures")}</h2>
            <AdventureList onChange={setSelected} handleEdit={(item: PublicAdventure) => setSelected([item])} />
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
