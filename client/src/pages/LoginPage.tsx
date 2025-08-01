import { useTranslation } from "react-i18next";
import { LoginForm } from "../components";

export function LoginPage() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-4">
            <h2 className="font-medium">{t("login")}</h2>
            <LoginForm />
        </div>
    )
}
