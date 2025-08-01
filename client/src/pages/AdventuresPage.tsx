import { AdventureList } from "@components/Lists";
import { useTranslation } from "react-i18next"

export function AdventuresPage() {

    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("adventures")}</h2>
            <AdventureList />
        </div>
    )
}
