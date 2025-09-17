import { getFetchAppSettingsQueryKey, useFetchAppSettings, useListAdventuresAdventuresGet, usePatchAppSettings } from "@api/endpoints";
import { PublicAdventure } from "@api/model";
import { Button } from "@components/Button";
import { Select } from "@components/Input";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export function SettingsPage() {

    const [ setAdventure, setSetAdventure ] = useState<number | undefined>(undefined);
    const [ selectedAdventure, setSelectedAdventure ] = useState<number | undefined>(undefined);

    const { data } = useListAdventuresAdventuresGet();

    const adventureOptions = useMemo(() => {
        if (!data?.data) {
            return [];
        }

        return data.data.map((adventure: PublicAdventure) => ({
            key: String(adventure.id),
            value: adventure.name,
        }));
    }, [data])

    const { data: settings} = useFetchAppSettings();

    useEffect(() => {
        setSetAdventure(settings?.data.current_adventure?.id)
    }, [settings])

    const submitSettings = usePatchAppSettings ({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: settingsQueryKey });
            }
        }
    });

    const queryClient = useQueryClient();
    const settingsQueryKey = getFetchAppSettingsQueryKey ();

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            adventureId: selectedAdventure ?? 0,
            data: {
                current_adventure_id: selectedAdventure ?? 0
            }
        }

        await toast.promise(
            submitSettings.mutateAsync(data),
            {
                loading: t("updating-settings"),
                success: t("settings-updated"),
                error: (err: any) => err?.message ?? t("updating-settings-failed"),
            }
        )
    }, [selectedAdventure]);


    return (
        <form className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            >
            <h2>{t("app-settings")}</h2>
            <Select
                name="current-adventure"
                label={t("current-adventure")}
                options={adventureOptions}
                onChange={(value: string | number) => {
                    const id = Number(value);
                    setSelectedAdventure(id);
                }}
                value={selectedAdventure ?? setAdventure ?? ""}
            />
            <Button variant="green" type="submit">
                {t("update-settings")}
            </Button>
        </form>

    )
}
