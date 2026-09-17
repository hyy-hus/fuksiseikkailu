import { useTranslation } from 'react-i18next'
import {
    AlertTriangle,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    RotateCcw,
    ShieldAlert,
    Unlock,
} from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import {
    useResetScores,
    useSettings,
    useToggleLeaderboard,
    useToggleScores,
} from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

export function AdminSettingsPanel() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()

    const { data: settings, isLoading } = useSettings()
    const toggleScores = useToggleScores()
    const toggleLeaderboard = useToggleLeaderboard()
    const resetScores = useResetScores()

    if (!isAdmin) return null

    const handleToggleScores = async () => {
        if (!settings) return
        await toggleScores.mutateAsync({
            body: { enabled: !settings.scores_enabled },
        })
    }

    const handleToggleLeaderboard = async () => {
        if (!settings) return
        await toggleLeaderboard.mutateAsync({
            body: { enabled: !settings.leaderboard_public },
        })
    }

    const handleResetScores = async () => {
        const confirm1 = window.confirm(
            t(
                'admin.settings.confirmReset1',
                'HOX! Oletko varma? Tämä poistaa pysyvästi KAIKKI tiimien saamat pisteet.'
            )
        )
        if (!confirm1) return

        const promptText = window.prompt(
            t(
                'admin.settings.confirmReset2',
                'Vahvista syöttämällä "RESET" alapuolelle:'
            )
        )

        if (promptText === 'RESET') {
            await resetScores.mutateAsync({})
            alert(t('admin.settings.resetSuccess', 'Kaikki pisteet nollattu.'))
        }
    }

    const isPending =
        toggleScores.isPending || toggleLeaderboard.isPending || resetScores.isPending

    return (
        <div className="flex w-full max-w-4xl flex-col gap-4 rounded-xl border-2 border-black bg-amber-100/60 p-4 shadow-md isolate">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-black leading-tight">
                            {t('admin.settings.title', 'Tapahtuma-asetukset')}
                        </h3>
                        <p className="text-[11px] font-bold text-black/70">
                            {t(
                                'admin.settings.subtitle',
                                'Hallinnoi tulospalvelua ja rasti-ilmoituksia reaaliajassa.'
                            )}
                        </p>
                    </div>
                </div>

                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-black/60" />}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Toggle Score Submissions */}
                <button
                    type="button"
                    onClick={handleToggleScores}
                    disabled={isLoading || isPending}
                    className={cn(
                        'flex flex-col items-center justify-between gap-3 rounded-lg border-2 border-black p-3.5 shadow-2xs transition-transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50',
                        settings?.scores_enabled ? 'bg-emerald-300' : 'bg-rose-300'
                    )}
                >
                    <div className="flex items-center gap-2">
                        {settings?.scores_enabled ? (
                            <Unlock className="h-5 w-5 text-black shrink-0" />
                        ) : (
                            <Lock className="h-5 w-5 text-black shrink-0" />
                        )}
                        <span className="text-xs font-black uppercase text-black text-center">
                            {settings?.scores_enabled
                                ? t('admin.settings.scoresEnabled', 'Pistesyöttö Auki')
                                : t('admin.settings.scoresDisabled', 'Pistesyöttö Kiinni')}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-black/80 text-center">
                        {settings?.scores_enabled
                            ? t('admin.settings.clickToCloseScores', 'Klikkaa sulkeaksesi')
                            : t('admin.settings.clickToOpenScores', 'Klikkaa avataksesi')}
                    </span>
                </button>

                {/* 2. Toggle Public Leaderboard */}
                <button
                    type="button"
                    onClick={handleToggleLeaderboard}
                    disabled={isLoading || isPending}
                    className={cn(
                        'flex flex-col items-center justify-between gap-3 rounded-lg border-2 border-black p-3.5 shadow-2xs transition-transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50',
                        settings?.leaderboard_public ? 'bg-emerald-300' : 'bg-amber-300'
                    )}
                >
                    <div className="flex items-center gap-2">
                        {settings?.leaderboard_public ? (
                            <Eye className="h-5 w-5 text-black shrink-0" />
                        ) : (
                            <EyeOff className="h-5 w-5 text-black shrink-0" />
                        )}
                        <span className="text-xs font-black uppercase text-black text-center">
                            {settings?.leaderboard_public
                                ? t('admin.settings.leaderboardPublic', 'Tulostaulukko Julkinen')
                                : t('admin.settings.leaderboardHidden', 'Tulostaulukko Piilotettu')}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-black/80 text-center">
                        {settings?.leaderboard_public
                            ? t('admin.settings.clickToHideLeaderboard', 'Piilota osallistujilta')
                            : t('admin.settings.clickToPublishLeaderboard', 'Julkaise osallistujille')}
                    </span>
                </button>

                {/* 3. Reset All Scores */}
                <button
                    type="button"
                    onClick={handleResetScores}
                    disabled={isLoading || isPending}
                    className="flex flex-col items-center justify-between gap-3 rounded-lg border-2 border-black bg-rose-500 p-3.5 text-white shadow-2xs transition-transform hover:-translate-y-0.5 hover:bg-rose-600 cursor-pointer disabled:opacity-50"
                >
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-white shrink-0" />
                        <span className="text-xs font-black uppercase tracking-tight text-center">
                            {t('admin.settings.resetScores', 'Nollaa Kaikki Pisteet')}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-white/90 text-center flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-white shrink-0" />
                        {t('admin.settings.dangerZone', 'Vaarallinen toiminto')}
                    </span>
                </button>
            </div>
        </div>
    )
}
