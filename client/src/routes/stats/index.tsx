import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import {
    Award,
    BarChart3,
    Calculator,
    CheckCircle2,
    Filter,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    Users,
} from 'lucide-react'

import { useCheckpoints } from '@/hooks/useCheckpoints'
import { useLeaderboard } from '@/hooks/useScores'
import { listAreasOptions, listByCheckpointOptions } from '@/api/generated/@tanstack/react-query.gen'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/stats/')({
    component: StatsRoute,
})

const CATEGORY_COLORS: Record<string, string> = {
    subject: '#60a5fa', // Blue
    nation: '#f472b6', // Pink
    hobby: '#34d399', // Emerald
    hyy: '#fbbf24', // Amber
    yliopisto: '#c084fc', // Purple
    other: '#f87171', // Red
    marker: '#f59e0b', // Orange
}

const AREA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

function calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
        return Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    }
    return Math.round(sorted[middle])
}

function StatsRoute() {
    const { t } = useTranslation()
    const [checkpointSearch, setCheckpointSearch] = React.useState('')
    const [minSubmissionsFilter, setMinSubmissionsFilter] = React.useState<number>(0)

    // Fetch Areas
    const { data: areas = [] } = useQuery({
        ...listAreasOptions(),
        staleTime: 1000 * 60 * 5,
    })

    // Fetch Leaderboard
    const {
        data: leaderboard = [],
        isLoading: isLoadingLeaderboard,
        isRefetching: isRefetchingLeaderboard,
        refetch: refetchLeaderboard,
    } = useLeaderboard()

    // Fetch Checkpoints
    const {
        data: checkpoints = [],
        isLoading: isLoadingCheckpoints,
        refetch: refetchCheckpoints,
    } = useCheckpoints()

    // Fetch Scores per Checkpoint in Parallel
    const checkpointScoreQueries = useQueries({
        queries: checkpoints.map((cp) => ({
            ...listByCheckpointOptions({ path: { checkpoint_id: cp.id } }),
            staleTime: 1000 * 30,
            enabled: Boolean(cp.id),
        })),
    })

    const isLoadingScores = checkpointScoreQueries.some((q) => q.isLoading)

    const handleRefreshAll = () => {
        refetchLeaderboard()
        refetchCheckpoints()
        checkpointScoreQueries.forEach((q) => q.refetch())
    }

    // --- Computed Metrics ---
    const totalTeams = leaderboard.length

    const totalPointsAwarded = React.useMemo(() => {
        return leaderboard.reduce((acc, team) => acc + (team.total_score ?? 0), 0)
    }, [leaderboard])

    const totalCheckpointsVisited = React.useMemo(() => {
        return leaderboard.reduce((acc, team) => acc + (team.checkpoints_visited ?? 0), 0)
    }, [leaderboard])

    const avgScorePerTeam = React.useMemo(() => {
        if (totalTeams === 0) return 0
        return Math.round(totalPointsAwarded / totalTeams)
    }, [totalPointsAwarded, totalTeams])

    const medianScorePerTeam = React.useMemo(() => {
        const scores = leaderboard.map((team) => team.total_score ?? 0)
        return calculateMedian(scores)
    }, [leaderboard])

    // Top 10 Teams
    const topTeamsData = React.useMemo(() => {
        return leaderboard
            .slice(0, 10)
            .map((team) => ({
                name: team.team_number ? `#${team.team_number} ${team.team_name}` : team.team_name,
                points: team.total_score ?? 0,
                checkpoints: team.checkpoints_visited ?? 0,
            }))
    }, [leaderboard])

    // Enriched Checkpoints with Submission Counts
    const enrichedCheckpoints = React.useMemo(() => {
        const countsMap = new Map<string, number>()

        checkpoints.forEach((cp, index) => {
            const queryResult = checkpointScoreQueries[index]
            const scoresList = queryResult?.data || []
            countsMap.set(cp.id, scoresList.length)
        })

        return checkpoints
            .map((cp) => ({
                ...cp,
                submissionsCount: countsMap.get(cp.id) ?? 0,
            }))
            .sort((a, b) => b.submissionsCount - a.submissionsCount)
    }, [checkpoints, checkpointScoreQueries])

    // 1. Submissions by Category Data
    const categorySubmissionsData = React.useMemo(() => {
        const counts: Record<string, number> = {}

        enrichedCheckpoints.forEach((cp) => {
            const cat = cp.category || 'other'
            counts[cat] = (counts[cat] || 0) + cp.submissionsCount
        })

        return Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([category, count]) => ({
                name: t(`checkpoints.categories.${category}`, { defaultValue: category }),
                value: count,
                color: CATEGORY_COLORS[category] || '#9ca3af',
            }))
    }, [enrichedCheckpoints, t])

    // 2. Submissions by Area Data
    const areaSubmissionsData = React.useMemo(() => {
        const areaNameMap = new Map(areas.map((a) => [a.id, a.name]))
        const counts: Record<string, number> = {}

        enrichedCheckpoints.forEach((cp) => {
            const areaName = (cp.area_id && areaNameMap.get(cp.area_id)) || t('stats.unknownArea', 'Tuntematon Alue')
            counts[areaName] = (counts[areaName] || 0) + cp.submissionsCount
        })

        return Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([areaName, count], idx) => ({
                name: areaName,
                value: count,
                color: AREA_COLORS[idx % AREA_COLORS.length],
            }))
    }, [enrichedCheckpoints, areas, t])

    // Averages and Medians for Checkpoint Visits
    const avgSubmissionsPerCheckpoint = React.useMemo(() => {
        if (checkpoints.length === 0) return 0
        const totalSubs = enrichedCheckpoints.reduce((acc, cp) => acc + cp.submissionsCount, 0)
        return Math.round(totalSubs / checkpoints.length)
    }, [checkpoints, enrichedCheckpoints])

    const medianSubmissionsPerCheckpoint = React.useMemo(() => {
        const counts = enrichedCheckpoints.map((cp) => cp.submissionsCount)
        return calculateMedian(counts)
    }, [enrichedCheckpoints])

    // Filtered Checkpoint List
    const filteredCheckpoints = React.useMemo(() => {
        const query = checkpointSearch.trim().toLowerCase()

        return enrichedCheckpoints.filter((cp) => {
            const matchesQuery =
                !query ||
                cp.name.toLowerCase().includes(query) ||
                (cp.location_name && cp.location_name.toLowerCase().includes(query)) ||
                (cp.category && cp.category.toLowerCase().includes(query))

            const matchesMinCount = cp.submissionsCount >= minSubmissionsFilter

            return matchesQuery && matchesMinCount
        })
    }, [enrichedCheckpoints, checkpointSearch, minSubmissionsFilter])

    const isLoading = isLoadingLeaderboard || isLoadingCheckpoints || isLoadingScores

    return (
        <div className="flex h-full w-full flex-col items-center gap-6 p-4 overflow-y-auto">
            {/* Header */}
            <div className="flex w-full max-w-5xl items-center justify-between border-b-2 border-black pb-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-amber-500 stroke-[2.5]" />
                        {t('stats.title', 'Tapahtumatilastot')}
                    </h2>
                    <p className="text-xs font-bold text-black/70">
                        {t('stats.subtitle', 'Reaaliaikaiset tilastot rastisuorituksista ja pisterakenteesta.')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefreshAll}
                    disabled={isRefetchingLeaderboard}
                    className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-2xs hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', isRefetchingLeaderboard && 'animate-spin')} />
                    <span>{t('common.refresh', 'Päivitä')}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <span className="text-xs font-bold text-black/60">{t('common.loading', 'Ladataan tilastoja...')}</span>
                </div>
            ) : (
                <div className="flex w-full max-w-5xl flex-col gap-6">
                    {/* Key Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Points */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-amber-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalPoints', 'Pisteitä Annettu')}
                                </span>
                                <Award className="h-5 w-5 text-amber-700" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalPointsAwarded.toLocaleString()}</span>
                                <span className="text-xs font-extrabold text-black/60 block">pisteitä yhteensä</span>
                            </div>
                        </div>

                        {/* Active Teams */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-emerald-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalTeams', 'Aktiivisia Tiimejä')}
                                </span>
                                <Users className="h-5 w-5 text-emerald-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalTeams}</span>
                                <span className="text-xs font-extrabold text-black/60 block">mukanaolevaa joukkuetta</span>
                            </div>
                        </div>

                        {/* Total Checkpoint Visits */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-blue-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.visits', 'Rastikäyntejä')}
                                </span>
                                <CheckCircle2 className="h-5 w-5 text-blue-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalCheckpointsVisited.toLocaleString()}</span>
                                <span className="text-xs font-extrabold text-black/60 block">suoritettua rastia</span>
                            </div>
                        </div>

                        {/* Mean & Median Score per Team */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-purple-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.scoreStats', 'Piste / Joukkue')}
                                </span>
                                <Calculator className="h-5 w-5 text-purple-800" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <div>
                                    <span className="text-2xl font-black text-black">{avgScorePerTeam}</span>
                                    <span className="text-[10px] font-extrabold text-black/60 block uppercase">ka.</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-black">{medianScorePerTeam}</span>
                                    <span className="text-[10px] font-extrabold text-black/60 block uppercase">mediaani</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart 1: Top 10 Teams Breakdown */}
                    <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                        <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                            <h3 className="text-sm font-black uppercase text-black">
                                {t('stats.topTeamsChart', 'Top 10 Joukkueet Pisteiden Mukaan')}
                            </h3>
                            <span className="text-xs font-bold text-black/60">
                                {leaderboard.length} joukkuetta rekisteröity
                            </span>
                        </div>

                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topTeamsData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                    />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            border: '2px solid #000',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="points" name="Pisteet" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2 & 3: Category & Area Distribution Pie Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Submissions by Category Pie */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.categorySubmissionsChart', 'Suoritukset Kategorioittain')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {totalCheckpointsVisited} suoritusta
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categorySubmissionsData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {categorySubmissionsData.map((entry, index) => (
                                                <Cell key={`cat-cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '8px',
                                                border: '2px solid #000',
                                                fontWeight: 800,
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Legend
                                            formatter={(value) => (
                                                <span className="text-xs font-black text-black uppercase">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Submissions by Area Pie */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.areaSubmissionsChart', 'Suoritukset Alueittain')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {areas.length} aluetta
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                {areaSubmissionsData.length === 0 ? (
                                    <p className="flex h-full items-center justify-center text-xs font-bold text-black/50 italic">
                                        Ei alueraportteja vielä.
                                    </p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={areaSubmissionsData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {areaSubmissionsData.map((entry, index) => (
                                                    <Cell key={`area-cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '8px',
                                                    border: '2px solid #000',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Legend
                                                formatter={(value) => (
                                                    <span className="text-xs font-black text-black uppercase">{value}</span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Interactive Checkpoints & Submissions List */}
                    <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                        <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                            <div className="flex flex-col">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.checkpointSubmissions', 'Rastikohtaiset Suoritukset')}
                                </h3>
                                <span className="text-[10px] font-bold text-black/60">
                                    Keskiarvo: {avgSubmissionsPerCheckpoint} | Mediaani: {medianSubmissionsPerCheckpoint}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-black/60 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                                {filteredCheckpoints.length} / {checkpoints.length}
                            </span>
                        </div>

                        {/* Search & Min Submissions Filter Controls */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
                                <input
                                    type="text"
                                    value={checkpointSearch}
                                    onChange={(e) => setCheckpointSearch(e.target.value)}
                                    placeholder={t('stats.searchCheckpoints', 'Etsi rastia tai paikkaa...')}
                                    className="w-full rounded-md border-2 border-black bg-white py-1 pl-8 pr-2 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-black/20"
                                />
                            </div>

                            <div className="flex items-center gap-1 rounded-md border-2 border-black bg-black/5 px-2 py-1 shrink-0">
                                <Filter className="h-3 w-3 text-black/60" />
                                <span className="text-[10px] font-black uppercase text-black/70">Min suorituksia:</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={minSubmissionsFilter}
                                    onChange={(e) => setMinSubmissionsFilter(Math.max(0, Number(e.target.value)))}
                                    className="w-10 rounded border border-black bg-white text-center text-xs font-black text-black outline-none"
                                />
                            </div>
                        </div>

                        {/* Checkpoint Items */}
                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto divide-y-2 divide-black/10 pr-1">
                            {filteredCheckpoints.length === 0 ? (
                                <p className="py-6 text-center text-xs font-bold text-black/50 italic">
                                    {t('stats.noCheckpointsFound', 'Ei hakua vastaavia rasteja.')}
                                </p>
                            ) : (
                                filteredCheckpoints.map((cp) => (
                                    <div key={cp.id} className="flex items-center justify-between pt-2 first:pt-0">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black bg-amber-400 text-[10px] font-black">
                                                {cp.number ?? '•'}
                                            </span>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-black text-black truncate">{cp.name}</span>
                                                {cp.location_name && (
                                                    <span className="text-[10px] font-bold text-black/50 truncate">
                                                        {cp.location_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={cn(
                                                'rounded px-2 py-0.5 text-[10px] font-black border border-black',
                                                cp.submissionsCount > 0 ? 'bg-emerald-300 text-black' : 'bg-slate-100 text-black/60'
                                            )}>
                                                {cp.submissionsCount} suoritusta
                                            </span>
                                            <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black/60 border border-black/20">
                                                {cp.category}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
