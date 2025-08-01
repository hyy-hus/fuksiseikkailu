import { useTranslation } from "react-i18next"

export function GuestHomePage() {

    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4">
            <h2>{t("welcome")}</h2>
        </div>
    )
}
