import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Award, CheckCircle2, Clock, Edit3, Search, Send, Users, X } from 'lucide-react'

import type { Score, SubmitScorePayload, UpdateScorePayload } from '@/api/generated/types.gen'
import { useCheckpointScores, useSubmitScore, useUpdateScore } from '@/hooks/useScores'
import { useTeams } from '@/hooks/useTeams'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface ScoreFormProps {
    checkpointId: string
    checkpointName?: string
}

export function ScoreForm({ checkpointId, checkpointName }: ScoreFormProps) {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)
    const [points, setPoints] = React.useState<number>(1)
    const [participantsPresent, setParticipantsPresent] = React.useState<number>(1)
    const [editingScoreId, setEditingScoreId] = React.useState<string | null>(null)

    const { data: teams = [] } = useTeams()
    const { data: scores = [], isLoading: isLoadingScores } = useCheckpointScores(checkpointId)

    const resetForm = () => {
        setSelectedTeamId(null)
        setEditingScoreId(null)
        setSearchQuery('')
        setPoints(1)
        setParticipantsPresent(1)
    }

    const submitMutation = useSubmitScore(checkpointId, resetForm)
    const updateMutation = useUpdateScore(checkpointId, resetForm)

    const isEditing = Boolean(editingScoreId)
    const activeMutation = isEditing ? updateMutation : submitMutation

    // Filter teams based on search query
    const filteredTeams = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return teams

        return teams.filter((team) => {
            const nameMatch = team.name.toLowerCase().includes(q)
            const numberMatch = team.number !== null && String(team.number).includes(q)
            return nameMatch || numberMatch
        })
    }, [teams, searchQuery])

    const selectedTeam = teams.find((t) => t.id === selectedTeamId)
    const existingScoreForSelectedTeam = scores.find((s) => s.team_id === selectedTeamId)

    // Handle team selection
    const handleSelectTeam = (teamId: string) => {
        setSelectedTeamId(teamId)
        setEditingScoreId(null)
        const teamScore = scores.find((s) => s.team_id === teamId)
        if (teamScore) {
            setPoints(teamScore.score)
            setParticipantsPresent(teamScore.participants_present ?? 1)
        } else {
            setPoints(1)
            const teamObj = teams.find((t) => t.id === teamId)
            setParticipantsPresent(teamObj?.participants && teamObj.participants > 0 ? teamObj.participants : 1)
        }
    }

    // Handle edit from history list
    const handleEditFromHistory = (score: Score) => {
        setEditingScoreId(score.id)
        setSelectedTeamId(score.team_id)
        setPoints(score.score)
        setParticipantsPresent(score.participants_present ?? 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTeamId) return

        if (isEditing && editingScoreId) {
            const payload: UpdateScorePayload = {
                score: points,
                participants_present: participantsPresent,
            }
            await updateMutation.mutateAsync({
                path: { id: editingScoreId },
                body: payload,
            })
        } else {
            const payload: SubmitScorePayload = {
                checkpoint_id: checkpointId,
                team_id: selectedTeamId,
                score: points,
                participants_present: participantsPresent,
            }
            await submitMutation.mutateAsync({ body: payload })
        }
    }

    return (
        <div className={cn('flex w-full flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b-2 border-black bg-amber-400 p-4 text-black')}>
                <div>
                    <h3 className={cn('text-base font-black uppercase tracking-tight')}>
                        {checkpointName
                            ? t('scores.headerTitleNamed', 'Record Score: {{name}}', { name: checkpointName })
                            : t('scores.headerTitle', 'Record Checkpoint Score')}
                    </h3>
                    <p className={cn('mt-0.5 text-xs font-bold text-black/80')}>
                        {t('scores.headerSubtitle', 'Search for a team, select points and present participants.')}
                    </p>
                </div>

                {isEditing && (
                    <button
                        type="button"
                        onClick={resetForm}
                        className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-black text-black hover:bg-black/5 cursor-pointer')}
                    >
                        <X className="h-3.5 w-3.5" />
                        {t('common.cancel', 'Cancel Edit')}
                    </button>
                )}
            </div>

            {/* Error Banner */}
            {activeMutation.error && (
                <div className={cn('m-4 flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-3 text-xs font-bold text-black')}>
                    <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600')} />
                    <p>{getApiErrorMessage(activeMutation.error)}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}>
                {/* Team Search & List Box */}
                <div className={cn('flex flex-col gap-1.5')}>
                    <label className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                        {t('scores.labels.selectTeam', 'Select Team *')}
                    </label>
                    <div className={cn('relative')}>
                        <Search className={cn('absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50')} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('scores.placeholders.searchTeam', 'Type team name or number...')}
                            className={cn('w-full rounded-md border-2 border-black bg-white py-2 pl-8 pr-3 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                        />
                    </div>

                    <div className={cn('mt-1 max-h-48 overflow-y-auto rounded-md border-2 border-black divide-y-2 divide-black/10 bg-white')}>
                        {filteredTeams.length === 0 ? (
                            <div className={cn('p-3 text-center text-xs font-medium text-black/50')}>
                                {t('scores.noTeamsFound', 'No matching teams found.')}
                            </div>
                        ) : (
                            filteredTeams.map((team) => {
                                const isSelected = selectedTeamId === team.id
                                const teamScore = scores.find((s) => s.team_id === team.id)

                                return (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => handleSelectTeam(team.id)}
                                        className={cn(
                                            'flex w-full items-center justify-between p-2.5 text-left transition-colors cursor-pointer',
                                            isSelected ? 'bg-amber-300 font-extrabold' : 'hover:bg-black/5'
                                        )}
                                    >
                                        <div className={cn('flex items-center gap-2.5 min-w-0')}>
                                            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black bg-white text-[10px] font-black')}>
                                                {team.number ?? '•'}
                                            </span>
                                            <span className={cn('truncate text-xs text-black')}>{team.name}</span>
                                        </div>

                                        {teamScore && (
                                            <span className={cn('flex items-center gap-1 rounded bg-emerald-300 px-1.5 py-0.5 text-[10px] font-black text-black border border-black')}>
                                                <CheckCircle2 className={cn('h-3 w-3')} />
                                                {teamScore.score} pts
                                            </span>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Grid 1: Points (1 - 5) */}
                <div className={cn('flex flex-col gap-2 pt-2 border-t-2 border-black/10 transition-opacity', !selectedTeam && 'opacity-40 pointer-events-none')}>
                    <div className={cn('flex items-center justify-between')}>
                        <span className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                            {selectedTeam
                                ? t('scores.labels.pointsNamed', 'Points for {{name}} (1 - 5)', { name: selectedTeam.name })
                                : t('scores.labels.points', 'Points (1 - 5)')}
                        </span>
                        {existingScoreForSelectedTeam && !isEditing && (
                            <span className={cn('text-[10px] font-bold text-amber-700')}>
                                {t('scores.existingScoreHint', 'Recorded: {{score}} pts', { score: existingScoreForSelectedTeam.score })}
                            </span>
                        )}
                    </div>

                    <div className={cn('grid grid-cols-5 gap-2')}>
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((scoreVal) => (
                            <button
                                key={scoreVal}
                                type="button"
                                onClick={() => setPoints(scoreVal)}
                                className={cn(
                                    'flex h-11 items-center justify-center rounded-md border-2 border-black font-black text-sm transition-all shadow-2xs cursor-pointer',
                                    points === scoreVal && selectedTeam
                                        ? 'bg-amber-400 text-black scale-105 ring-2 ring-black'
                                        : 'bg-white text-black hover:bg-black/5'
                                )}
                            >
                                {scoreVal}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid 2: Participants Present (1 - 12) */}
                <div className={cn('flex flex-col gap-2 pt-2 border-t-2 border-black/10 transition-opacity', !selectedTeam && 'opacity-40 pointer-events-none')}>
                    <div className={cn('flex items-center justify-between')}>
                        <span className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                            {t('scores.labels.participantsPresent', 'Participants Present (1 - 12)')}
                        </span>
                        {selectedTeam && (
                            <span className={cn('text-[10px] font-bold text-black/60')}>
                                {t('scores.registeredParticipants', 'Registered: {{count}}', { count: selectedTeam.participants })}
                            </span>
                        )}
                    </div>

                    <div className={cn('grid grid-cols-6 sm:grid-cols-12 gap-1.5')}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((partVal) => (
                            <button
                                key={partVal}
                                type="button"
                                onClick={() => setParticipantsPresent(partVal)}
                                className={cn(
                                    'flex h-10 items-center justify-center rounded-md border-2 border-black font-black text-xs transition-all shadow-2xs cursor-pointer',
                                    participantsPresent === partVal && selectedTeam
                                        ? 'bg-blue-400 text-black scale-105 ring-2 ring-black'
                                        : 'bg-white text-black hover:bg-black/5'
                                )}
                            >
                                {partVal}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Action */}
                <button
                    type="submit"
                    disabled={!selectedTeamId || activeMutation.isPending}
                    className={cn('mt-2 flex items-center justify-center gap-2 rounded-md border-2 border-black bg-emerald-400 py-3 text-xs font-black uppercase text-black shadow-2xs hover:bg-emerald-300 transition-colors disabled:opacity-50 cursor-pointer')}
                >
                    {isEditing ? <Edit3 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {isEditing
                        ? t('scores.updateButton', 'Update Score')
                        : t('scores.submitButton', 'Submit Score')}
                </button>
            </form>

            {/* Scores History List */}
            <div className={cn('border-t-2 border-black bg-white')}>
                <div className={cn('border-b-2 border-black bg-black/5 p-4')}>
                    <h4 className={cn('text-xs font-black uppercase tracking-wider text-black')}>
                        {t('scores.historyTitle', 'Given Scores ({{count}})', { count: scores.length })}
                    </h4>
                </div>

                {isLoadingScores ? (
                    <div className={cn('p-6 text-center text-xs font-bold text-black/50')}>
                        {t('scores.loadingList', 'Loading scores...')}
                    </div>
                ) : scores.length === 0 ? (
                    <div className={cn('flex flex-col items-center justify-center p-8 text-center')}>
                        <Award className={cn('h-7 w-7 text-black/30')} />
                        <p className={cn('mt-1.5 text-xs font-bold text-black/60')}>
                            {t('scores.noScoresRecorded', 'No scores given yet.')}
                        </p>
                    </div>
                ) : (
                    <div className={cn('divide-y-2 divide-black/10 max-h-72 overflow-y-auto')}>
                        {scores.map((score) => {
                            const team = teams.find((t) => t.id === score.team_id)
                            const dateObj = new Date(score.updated_at || score.created_at)
                            const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                            return (
                                <div key={score.id} className={cn('flex items-center justify-between p-3 hover:bg-black/5 transition-colors')}>
                                    <div className={cn('flex items-center gap-2.5 min-w-0')}>
                                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black bg-amber-400 text-xs font-bold text-black')}>
                                            {team?.number ?? '•'}
                                        </span>
                                        <div className={cn('flex flex-col min-w-0')}>
                                            <span className={cn('font-bold text-xs text-black truncate')}>{team?.name ?? score.team_id}</span>
                                            <div className={cn('flex items-center gap-2 text-[10px] font-medium text-black/60')}>
                                                <span className={cn('flex items-center gap-1')}>
                                                    <Clock className={cn('h-3 w-3 text-black/40')} />
                                                    {formattedTime}
                                                </span>
                                                <span>•</span>
                                                <span className={cn('flex items-center gap-1 text-black/80 font-bold')}>
                                                    <Users className={cn('h-3 w-3 text-black/40')} />
                                                    {score.participants_present} present
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn('flex items-center gap-2')}>
                                        <span className={cn('rounded border-2 border-black bg-emerald-300 px-2.5 py-0.5 font-black text-xs text-black')}>
                                            {score.score} pts
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleEditFromHistory(score)}
                                            className={cn('flex items-center gap-1 rounded border-2 border-black bg-amber-400 px-2 py-0.5 text-xs font-black text-black hover:bg-amber-300 cursor-pointer')}
                                        >
                                            <Edit3 className={cn('h-3 w-3')} />
                                            {t('common.edit', 'Edit')}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
