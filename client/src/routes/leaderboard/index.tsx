import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { Award, Loader2, MapPin, Medal, RefreshCw, Trophy, X } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import { AdminSettingsPanel } from '@/components/AdminSettingsPanel'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import { useLeaderboard, useTeamScores } from '@/hooks/useScores'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/leaderboard/')({
    component: LeaderboardRoute,
})

function LeaderboardRoute() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()
    const { data: settings } = useSettings()
    const { data: leaderboard = [], isLoading, isRefetching, refetch } = useLeaderboard()

    const [selectedTeam, setSelectedTeam] = React.useState<{ id: string; name: string } | null>(null)

    const isLeaderboardHidden = !isAdmin && settings?.leaderboard_public === false

    const topThree = leaderboard.slice(0, 3)
    const remainingTeams = leaderboard.slice(3)

    const handleTeamClick = (teamId?: string, teamName?: string) => {
        if (isAdmin && teamId && teamName) {
            setSelectedTeam({ id: teamId, name: teamName })
        }
    }

    if (isLeaderboardHidden) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center p-4 text-center">
                <div className="rounded-xl border-2 border-black bg-amber-200 p-6 shadow-md max-w-sm">
                    <h3 className="text-sm font-black uppercase text-black">
                        {t('leaderboard.hiddenTitle', 'Tulostaulukko ei ole vielä julkinen')}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-black/70">
                        {t('leaderboard.hiddenSubtitle', 'Tulokset julkaistaan tapahtuman lopuksi.')}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full flex-col items-center gap-6 p-4 overflow-y-auto">
            {/* Admin Event Settings Control Panel */}
            <AdminSettingsPanel />

            {/* Header */}
            <div className="flex w-full max-w-4xl items-center justify-between border-b-2 border-black pb-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                        {t('leaderboard.title', 'Leaderboard')}
                    </h2>
                    <p className="text-xs font-bold text-black/70">
                        {t('leaderboard.subtitle', 'Live team rankings and total accumulated scores.')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-2xs hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
                    <span>{t('common.refresh', 'Päivitä')}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <span className="text-xs font-bold text-black/60">{t('common.loading', 'Ladataan...')}</span>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="flex w-full max-w-4xl flex-col items-center justify-center rounded-xl border-2 border-black bg-white/90 p-8 text-center shadow-md">
                    <p className="text-sm font-black uppercase text-black">
                        {t('leaderboard.noScores', 'Ei tuloksia vielä')}
                    </p>
                </div>
            ) : (
                <div className="flex w-full max-w-4xl flex-col gap-6">
                    {/* Top 3 Podium Highlights */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <PodiumCard
                                    rank={2}
                                    teamId={topThree[1].team_id}
                                    teamName={topThree[1].team_name}
                                    teamNumber={topThree[1].team_number}
                                    score={topThree[1].total_score ?? 0}
                                    checkpointsCount={topThree[1].checkpoints_visited ?? 0}
                                    bgColor="bg-slate-100"
                                    badgeColor="bg-slate-200"
                                    isAdmin={isAdmin}
                                    onClick={() => handleTeamClick(topThree[1]?.team_id, topThree[1]?.team_name)}
                                    icon={<Medal className="h-6 w-6 text-slate-600" />}
                                />
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <PodiumCard
                                    rank={1}
                                    teamId={topThree[0].team_id}
                                    teamName={topThree[0].team_name}
                                    teamNumber={topThree[0].team_number}
                                    score={topThree[0].total_score ?? 0}
                                    checkpointsCount={topThree[0].checkpoints_visited ?? 0}
                                    bgColor="bg-amber-100"
                                    badgeColor="bg-amber-300"
                                    isWinner
                                    isAdmin={isAdmin}
                                    onClick={() => handleTeamClick(topThree[0]?.team_id, topThree[0]?.team_name)}
                                    icon={<Trophy className="h-8 w-8 text-amber-600 fill-amber-400" />}
                                />
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <PodiumCard
                                    rank={3}
                                    teamId={topThree[2].team_id}
                                    teamName={topThree[2].team_name}
                                    teamNumber={topThree[2].team_number}
                                    score={topThree[2].total_score ?? 0}
                                    checkpointsCount={topThree[2].checkpoints_visited ?? 0}
                                    bgColor="bg-orange-50"
                                    badgeColor="bg-orange-200"
                                    isAdmin={isAdmin}
                                    onClick={() => handleTeamClick(topThree[2]?.team_id, topThree[2]?.team_name)}
                                    icon={<Award className="h-6 w-6 text-amber-800" />}
                                />
                            )}
                        </div>
                    )}

                    {/* Remaining Teams List */}
                    {remainingTeams.length > 0 && (
                        <div className="flex flex-col gap-2 pt-2">
                            <span className="text-xs font-black uppercase text-black/80 tracking-wider">
                                {t('leaderboard.otherTeams', 'Muut tiimit')}
                            </span>
                            {remainingTeams.map((entry, idx) => {
                                const checkpointsCount = entry.checkpoints_visited ?? 0
                                const teamLabel = entry.team_number ? `#${entry.team_number} ${entry.team_name}` : entry.team_name

                                return (
                                    <div
                                        key={entry.team_id ?? idx}
                                        onClick={() => handleTeamClick(entry.team_id, entry.team_name)}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl border-2 border-black bg-white p-3 shadow-2xs transition-transform',
                                            isAdmin ? 'hover:-translate-y-0.5 cursor-pointer hover:bg-amber-50/40' : ''
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-slate-100 text-xs font-black">
                                                #{idx + 4}
                                            </div>
                                            <span className="text-sm font-black text-black leading-tight">
                                                {teamLabel}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-black/70">
                                                <span>{checkpointsCount} rastia</span>
                                            </div>
                                            <div className="rounded-lg border-2 border-black bg-emerald-400 px-3 py-1 text-xs font-black text-black shadow-2xs">
                                                {entry.total_score ?? 0} p
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Admin Team Breakdown Modal */}
            {selectedTeam && (
                <TeamScoreModal
                    teamId={selectedTeam.id}
                    teamName={selectedTeam.name}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </div>
    )
}

interface PodiumCardProps {
    rank: number
    teamId?: string
    teamName: string
    teamNumber: number | null | undefined
    score: number
    checkpointsCount: number
    bgColor: string
    badgeColor: string
    isWinner?: boolean
    isAdmin?: boolean
    onClick?: () => void
    icon: React.ReactNode
}

function PodiumCard({
    rank,
    teamName,
    teamNumber,
    score,
    checkpointsCount,
    bgColor,
    badgeColor,
    isWinner,
    isAdmin,
    onClick,
    icon,
}: PodiumCardProps) {
    const { t } = useTranslation()
    const teamLabel = teamNumber ? `#${teamNumber} ${teamName}` : teamName

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative flex flex-col items-center justify-between rounded-xl border-2 border-black p-4 shadow-md transition-all',
                bgColor,
                isWinner ? 'order-first sm:order-none sm:-mt-4 border-3 shadow-lg py-5 bg-amber-200' : 'py-4',
                isAdmin ? 'hover:-translate-y-1 cursor-pointer' : ''
            )}
        >
            <div
                className="flex h-6 items-center rounded-md border-2 border-black px-2.5 text-[11px] font-black uppercase text-black shadow-2xs mb-2"
                style={{ backgroundColor: badgeColor }}
            >
                #{rank}
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
                {icon}
                <h3 className="text-base font-black text-black leading-tight">{teamLabel}</h3>
            </div>

            <div className="mt-4 flex w-full flex-col items-center border-t-2 border-black/20 pt-2">
                <span className="text-2xl font-black text-black">{score} p</span>
                <span className="text-[10px] font-bold text-black/70">
                    {checkpointsCount} {t('leaderboard.checkpointsDone', 'rastia suoritettu')}
                </span>
            </div>
        </div>
    )
}

interface TeamScoreModalProps {
    teamId: string
    teamName: string
    onClose: () => void
}

function TeamScoreModal({ teamId, teamName, onClose }: TeamScoreModalProps) {
    const { t } = useTranslation()
    const { data: scores = [], isLoading: isLoadingScores } = useTeamScores(teamId)
    const { data: checkpoints = [], isLoading: isLoadingCheckpoints } = useCheckpoints()

    const isLoading = isLoadingScores || isLoadingCheckpoints

    // Map checkpoint metadata for fast lookups by ID
    const checkpointMap = React.useMemo(() => {
        const map = new Map<
            string,
            { name: string; location_name?: string | null }
        >()
        checkpoints.forEach((cp) => {
            map.set(cp.id, {
                name: cp.name,
                location_name: cp.location_name,
            })
        })
        return map
    }, [checkpoints])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-black bg-amber-400 p-4">
                    <h3 className="text-base font-extrabold uppercase tracking-tight text-black truncate pr-2">
                        {teamName} – {t('leaderboard.scoresDetail', 'Piste-erittely')}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border-2 border-black bg-white p-1 hover:bg-black/10 cursor-pointer"
                    >
                        <X className="h-4 w-4 text-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2 p-4 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center gap-2 text-xs font-bold text-black/60">
                            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                            {t('common.loading', 'Ladataan...')}
                        </div>
                    ) : scores.length === 0 ? (
                        <p className="py-6 text-center text-xs font-bold text-black/50 italic">
                            {t('leaderboard.noTeamScores', 'Tällä tiimillä ei ole vielä suorituksia.')}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2.5 divide-y-2 divide-black/10">
                            {scores.map((scoreItem) => {
                                const cpInfo = checkpointMap.get(scoreItem.checkpoint_id)
                                const cpName = cpInfo?.name || `Rasti #${scoreItem.checkpoint_id.substring(0, 8)}`

                                return (
                                    <div
                                        key={scoreItem.id}
                                        className="flex items-start justify-between pt-2.5 first:pt-0"
                                    >
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="text-xs font-black text-black leading-tight">
                                                {cpName}
                                            </span>

                                            {cpInfo?.location_name && (
                                                <span className="text-[10px] font-bold text-black/60 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 text-amber-600 inline shrink-0" />
                                                    {cpInfo.location_name}
                                                </span>
                                            )}

                                            {scoreItem.participants_present > 0 && (
                                                <span className="text-[10px] font-bold text-black/50 mt-0.5">
                                                    {t('scores.participants', 'Osallistujia')}: {scoreItem.participants_present}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rounded-md border-2 border-black bg-emerald-300 px-2.5 py-0.5 text-xs font-black text-black shrink-0">
                                            {scoreItem.score} p
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t-2 border-black p-3 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border-2 border-black bg-white px-4 py-1.5 text-xs font-extrabold text-black hover:bg-black/5 cursor-pointer"
                    >
                        {t('common.close', 'Sulje')}
                    </button>
                </div>
            </div>
        </div>
    )
}
