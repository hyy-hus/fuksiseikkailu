import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, Tag, X } from 'lucide-react'

import { useSuggestTeam } from '@/hooks/usePhotos'
import { useTeams } from '@/hooks/useTeams'

interface SuggestTeamModalProps {
    photoId: string
    isOpen: boolean
    onClose: () => void
}

export function SuggestTeamModal({ photoId, isOpen, onClose }: SuggestTeamModalProps) {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = React.useState('')
    const { data: teams = [], isLoading } = useTeams()
    const suggestTeamMutation = useSuggestTeam(photoId)

    if (!isOpen) return null

    const filteredTeams = teams.filter((team) => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return true
        return (
            team.name.toLowerCase().includes(q) ||
            (team.number && String(team.number).includes(q))
        )
    })

    const handleSelectTeam = async (teamNumber: number) => {
        await suggestTeamMutation.mutateAsync({
            path: { id: photoId },
            body: { suggested_team_number: teamNumber },
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-black bg-amber-400 p-3.5">
                    <h3 className="text-sm font-extrabold uppercase tracking-tight text-black flex items-center gap-1.5">
                        <Tag className="h-4 w-4" />
                        {t('photos.tagTeamTitle', 'Tag Your Team')}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border-2 border-black bg-white p-1 hover:bg-black/10 cursor-pointer"
                    >
                        <X className="h-4 w-4 text-black" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b-2 border-black/10 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/50" />
                        <input
                            type="text"
                            placeholder={t('photos.searchTeamPlaceholder', 'Search team by name or number...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border-2 border-black bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                    </div>
                </div>

                {/* Team List */}
                <div className="flex flex-col max-h-60 overflow-y-auto divide-y-2 divide-black/5 bg-white">
                    {isLoading && (
                        <div className="flex items-center justify-center p-6 text-black">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    )}

                    {!isLoading && filteredTeams.length === 0 && (
                        <p className="p-6 text-center text-xs font-bold text-black/60">
                            {t('photos.noTeamsFound', 'No matching teams found.')}
                        </p>
                    )}

                    {!isLoading &&
                        filteredTeams.map((team) => (
                            <button
                                key={team.id}
                                type="button"
                                onClick={() => team.number && handleSelectTeam(team.number)}
                                className="flex items-center justify-between p-3 text-left hover:bg-amber-100/60 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black text-black truncate">{team.name}</span>
                                </div>
                                {team.number && (
                                    <span className="rounded border-2 border-black bg-white px-2 py-0.5 text-xs font-black text-black shadow-2xs">
                                        #{team.number}
                                    </span>
                                )}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    )
}
