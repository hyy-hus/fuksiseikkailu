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
    Line,
    LineChart,
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
    Camera,
    CheckCircle2,
    Filter,
    Heart,
    Image as ImageIcon,
    LineChart as LineChartIcon,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
} from 'lucide-react'

import { useCheckpoints } from '@/hooks/useCheckpoints'
import { useLeaderboard, useScoreTimeline } from '@/hooks/useScores'
import { usePhotos, useVoteTimeline } from '@/hooks/usePhotos'
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

const CATEGORY_COLOR_LIST = Object.values(CATEGORY_COLORS)
const BUCKET_30_MIN_MS = 30 * 60 * 1000

function calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
        return Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    }
    return Math.round(sorted[middle])
}

interface CustomPieTooltipProps {
    active?: boolean
    payload?: Array<{
        name: string
        value: number
        payload: {
            name: string
            value: number
            totalSubmissions: number
            totalCheckpoints: number
            avgPerCheckpoint: number
            color: string
        }
    }>
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    return (
        <div className="rounded-lg border-2 border-black bg-white p-3 shadow-md text-xs font-bold text-black">
            <p className="text-sm font-black uppercase text-black border-b border-black/10 pb-1 mb-1.5 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-black" style={{ backgroundColor: data.color }} />
                {data.name}
            </p>
            <div className="flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                    <span className="text-black/70">Yhteensä suorituksia:</span>
                    <span className="font-black text-black">{data.totalSubmissions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-black/70">Rastimäärä:</span>
                    <span className="font-black text-black">{data.totalCheckpoints} rastia</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t border-black/10 text-amber-700">
                    <span>Keskiarvo / rasti:</span>
                    <span className="font-black">{data.avgPerCheckpoint} suoritusta</span>
                </div>
            </div>
        </div>
    )
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

    // Fetch Score Timeline
    const {
        data: rawScoreTimeline = [],
        isLoading: isLoadingScoreTimeline,
        refetch: refetchScoreTimeline,
    } = useScoreTimeline()

    // Fetch Checkpoints
    const {
        data: checkpoints = [],
        isLoading: isLoadingCheckpoints,
        refetch: refetchCheckpoints,
    } = useCheckpoints()

    // Fetch Photos
    const {
        data: photos = [],
        isLoading: isLoadingPhotos,
        refetch: refetchPhotos,
    } = usePhotos()

    // Fetch Vote Timeline Data
    const {
        data: rawVoteTimeline = [],
        isLoading: isLoadingVoteTimeline,
        refetch: refetchVoteTimeline,
    } = useVoteTimeline()

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
        refetchScoreTimeline()
        refetchCheckpoints()
        refetchPhotos()
        refetchVoteTimeline()
        checkpointScoreQueries.forEach((q) => q.refetch())
    }

    // --- Computed Score Accumulation Timeline (30-Minute Buckets) ---
    const cumulativeScoreTimelineData = React.useMemo(() => {
        if (!rawScoreTimeline.length) return []

        const sortedScores = [...rawScoreTimeline].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        let runningPoints = 0
        let runningSubmissions = 0
        const buckets = new Map<number, { points: number; submissions: number }>()

        sortedScores.forEach((item) => {
            const timeMs = new Date(item.created_at).getTime()
            const bucketKey = Math.floor(timeMs / BUCKET_30_MIN_MS) * BUCKET_30_MIN_MS

            runningPoints += item.score
            runningSubmissions += 1

            buckets.set(bucketKey, {
                points: runningPoints,
                submissions: runningSubmissions,
            })
        })

        return Array.from(buckets.entries()).map(([timestamp, data]) => ({
            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            totalPoints: data.points,
            totalSubmissions: data.submissions,
        }))
    }, [rawScoreTimeline])

    // --- Computed Photo & Vote Metrics ---
    const totalPhotos = photos.length

    const totalPhotoVotes = React.useMemo(() => {
        return photos.reduce((acc, photo) => acc + (photo.vote_count ?? 0), 0)
    }, [photos])

    // Cumulative Vote Count Time-Series Data (30-Minute Buckets)
    const cumulativeVoteTimelineData = React.useMemo(() => {
        if (!rawVoteTimeline.length) return []

        const sortedVotes = [...rawVoteTimeline].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        let runningTotal = 0
        const buckets = new Map<number, number>()

        sortedVotes.forEach((vote) => {
            const timeMs = new Date(vote.created_at).getTime()
            const bucketKey = Math.floor(timeMs / BUCKET_30_MIN_MS) * BUCKET_30_MIN_MS

            runningTotal += 1
            buckets.set(bucketKey, runningTotal)
        })

        return Array.from(buckets.entries()).map(([timestamp, totalVotes]) => ({
            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            totalVotes,
        }))
    }, [rawVoteTimeline])

    // Top 8 Voted Photos for Chart
    const topVotedPhotosData = React.useMemo(() => {
        return [...photos]
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
            .filter((p) => (p.vote_count ?? 0) > 0)
            .slice(0, 8)
            .map((photo, idx) => ({
                name: `Kuva #${idx + 1}`,
                votes: photo.vote_count ?? 0,
                id: photo.id,
            }))
    }, [photos])

    // --- Computed Score & Submission Metrics ---
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

    const avgCheckpointsPerTeam = React.useMemo(() => {
        if (totalTeams === 0) return '0'
        return (totalCheckpointsVisited / totalTeams).toFixed(1)
    }, [totalCheckpointsVisited, totalTeams])

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

    // Relative Submissions by Category Data
    const categorySubmissionsData = React.useMemo(() => {
        const categoryStats: Record<string, { totalSubmissions: number; totalCheckpoints: number }> = {}

        enrichedCheckpoints.forEach((cp) => {
            const cat = cp.category || 'other'
            if (!categoryStats[cat]) {
                categoryStats[cat] = { totalSubmissions: 0, totalCheckpoints: 0 }
            }
            categoryStats[cat].totalSubmissions += cp.submissionsCount
            categoryStats[cat].totalCheckpoints += 1
        })

        return Object.entries(categoryStats)
            .filter(([, stat]) => stat.totalSubmissions > 0)
            .map(([category, stat]) => {
                const avg = Math.round(stat.totalSubmissions / stat.totalCheckpoints)
                return {
                    name: t(`checkpoints.categories.${category}`, { defaultValue: category }),
                    value: avg,
                    totalSubmissions: stat.totalSubmissions,
                    totalCheckpoints: stat.totalCheckpoints,
                    avgPerCheckpoint: avg,
                    color: CATEGORY_COLORS[category] || '#9ca3af',
                }
            })
    }, [enrichedCheckpoints, t])

    // Relative Submissions by Area Data
    const areaSubmissionsData = React.useMemo(() => {
        const areaNameMap = new Map(areas.map((a) => [a.id, a.name]))
        const areaStats: Record<string, { totalSubmissions: number; totalCheckpoints: number }> = {}

        enrichedCheckpoints.forEach((cp) => {
            const areaName = (cp.area_id && areaNameMap.get(cp.area_id)) || t('stats.unknownArea', 'Tuntematon Alue')
            if (!areaStats[areaName]) {
                areaStats[areaName] = { totalSubmissions: 0, totalCheckpoints: 0 }
            }
            areaStats[areaName].totalSubmissions += cp.submissionsCount
            areaStats[areaName].totalCheckpoints += 1
        })

        return Object.entries(areaStats)
            .filter(([, stat]) => stat.totalSubmissions > 0)
            .map(([areaName, stat], idx) => {
                const avg = Math.round(stat.totalSubmissions / stat.totalCheckpoints)
                return {
                    name: areaName,
                    value: avg,
                    totalSubmissions: stat.totalSubmissions,
                    totalCheckpoints: stat.totalCheckpoints,
                    avgPerCheckpoint: avg,
                    color: CATEGORY_COLOR_LIST[idx % CATEGORY_COLOR_LIST.length],
                }
            })
    }, [enrichedCheckpoints, areas, t])

    // Overall Averages and Medians for Checkpoint Visits
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

    const isLoading =
        isLoadingLeaderboard ||
        isLoadingScoreTimeline ||
        isLoadingCheckpoints ||
        isLoadingScores ||
        isLoadingPhotos ||
        isLoadingVoteTimeline

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
                        {t('stats.subtitle', 'Reaaliaikaiset tilastot rastisuorituksista, asukilpailusta ja kuvista.')}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* 1. Total Points */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-amber-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalPoints', 'Pisteitä Annettu')}
                                </span>
                                <Award className="h-5 w-5 text-amber-700" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalPointsAwarded.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 2. Total Submissions */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-blue-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalSubmissions', 'Suorituksia Yhteensä')}
                                </span>
                                <CheckCircle2 className="h-5 w-5 text-blue-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalCheckpointsVisited.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 3. Active Teams */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-emerald-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalTeams', 'Aktiivisia Tiimejä')}
                                </span>
                                <Users className="h-5 w-5 text-emerald-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalTeams}</span>
                                <span className="text-xs font-extrabold text-black/60 block">
                                    ka. {avgScorePerTeam} p / tiimi
                                </span>
                            </div>
                        </div>

                        {/* 4. Average Checkpoints per Team */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-purple-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.avgCheckpointsPerTeam', 'Rasteja / tiimi (ka.)')}
                                </span>
                                <MapPin className="h-5 w-5 text-purple-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{avgCheckpointsPerTeam}</span>
                            </div>
                        </div>

                        {/* 5. Total Photos Uploaded */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-sky-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.totalPhotos', 'Ladattuja Kuvia')}
                                </span>
                                <Camera className="h-5 w-5 text-sky-800" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalPhotos}</span>
                            </div>
                        </div>

                        {/* 6. Photo Competition Total Votes */}
                        <div className="flex flex-col justify-between rounded-xl border-2 border-black bg-rose-200 p-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-black/70">
                                    {t('stats.photoVotes', 'Asukilpailun ääniä')}
                                </span>
                                <Heart className="h-5 w-5 text-rose-700 fill-rose-500" />
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-black text-black">{totalPhotoVotes.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Line Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Accumulative Points & Submissions Timeline */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 text-amber-600 stroke-[2.5]" />
                                    {t('stats.pointsAccumulationChart', 'Pisteiden & Suoritusten Kertymä')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {totalPointsAwarded.toLocaleString()} p annettu
                                </span>
                            </div>

                            <div className="h-64 w-full pt-2">
                                {cumulativeScoreTimelineData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center flex-col gap-2 text-black/50">
                                        <BarChart3 className="h-8 w-8 stroke-[1.5]" />
                                        <p className="text-xs font-bold italic">Ei vielä pisteitä aikajanalla.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={cumulativeScoreTimelineData} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '8px',
                                                    border: '2px solid #000',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                }}
                                                labelFormatter={(label) => `Aika: ${label}`}
                                            />
                                            <Legend
                                                formatter={(value) => (
                                                    <span className="text-xs font-black text-black uppercase">{value}</span>
                                                )}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="totalPoints"
                                                name="Pisteitä Yhteensä"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 5, stroke: '#000', strokeWidth: 2, fill: '#f59e0b' }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="totalSubmissions"
                                                name="Suorituksia"
                                                stroke="#3b82f6"
                                                strokeWidth={2.5}
                                                strokeDasharray="4 4"
                                                dot={false}
                                                activeDot={{ r: 5, stroke: '#000', strokeWidth: 2, fill: '#3b82f6' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Accumulative Votes Timeline Line Chart */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                    <LineChartIcon className="h-4 w-4 text-rose-600 stroke-[2.5]" />
                                    {t('stats.voteAccumulationChart', 'Äänten kertymä')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {totalPhotoVotes} ääntä annettu
                                </span>
                            </div>

                            <div className="h-64 w-full pt-2">
                                {cumulativeVoteTimelineData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center flex-col gap-2 text-black/50">
                                        <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                                        <p className="text-xs font-bold italic">Ei vielä ääniä aikajanalla.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={cumulativeVoteTimelineData} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }} />
                                            <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '8px',
                                                    border: '2px solid #000',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                }}
                                                formatter={(value) => [`${value} ääntä`, 'Kertymä']}
                                                labelFormatter={(label) => `Aika: ${label}`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="totalVotes"
                                                name="Ääniä yhteensä"
                                                stroke="#f43f5e"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6, stroke: '#000', strokeWidth: 2, fill: '#f43f5e' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart Section 1: Top 10 Teams & Top Voted Photos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top 10 Teams Breakdown */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.topTeamsChart', 'Top 10 Joukkueet Pisteittäin')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {leaderboard.length} joukkuetta
                                </span>
                            </div>

                            <div className="h-64 w-full pt-2">
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

                        {/* Top Voted Costume Photos Chart */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                    {t('stats.topPhotosChart', 'Suosituimmat asukilpailun kuvat')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {totalPhotoVotes} ääntä
                                </span>
                            </div>

                            <div className="h-64 w-full pt-2">
                                {topVotedPhotosData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center flex-col gap-2 text-black/50">
                                        <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                                        <p className="text-xs font-bold italic">Ei vielä ääniä asukilpailussa.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topVotedPhotosData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }} />
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
                                            <Bar dataKey="votes" name="Ääniä" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart Section 2: Relative Category & Area Distribution Pie Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Submissions Relative to Category Checkpoint Count */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.categorySubmissionsChart', 'Aktiivisuus Kategorioittain (Ka. / Rasti)')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    Suhteutettu rastimäärään
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
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend
                                            formatter={(value) => (
                                                <span className="text-xs font-black text-black uppercase">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Submissions Relative to Area Checkpoint Count */}
                        <div className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-5 shadow-md">
                            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                <h3 className="text-sm font-black uppercase text-black">
                                    {t('stats.areaSubmissionsChart', 'Aktiivisuus Alueittain (Ka. / Rasti)')}
                                </h3>
                                <span className="text-xs font-bold text-black/60">
                                    {areas.length} aluetta
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                {areaSubmissionsData.length === 0 ? (
                                    <p className="flex h-full items-center justify-center text-xs font-bold text-black/50 italic">
                                        Ei alueita vielä.
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
                                            <Tooltip content={<CustomPieTooltip />} />
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
                                            <span
                                                className={cn(
                                                    'rounded px-2 py-0.5 text-[10px] font-black border border-black',
                                                    cp.submissionsCount > 0 ? 'bg-emerald-300 text-black' : 'bg-slate-100 text-black/60'
                                                )}
                                            >
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
