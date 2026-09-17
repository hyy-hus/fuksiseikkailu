import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpDown, Check, Heart, Loader2, Maximize2, Plus, Tag, Trash2, Users } from 'lucide-react'

import type { Photo } from '@/api/generated/types.gen'
import { useAuth } from '@/auth/AuthContext'
import { PhotoUploadModal } from '@/components/PhotoUploadModal'
import { SuggestTeamModal } from '@/components/SuggestTeamModal'
import {
    useDeletePhoto,
    usePhotos,
    usePhotoSuggestions,
    useUpdatePhoto,
    useVotePhoto,
} from '@/hooks/usePhotos'
import { cn } from '@/lib/utils'

const VOTED_PHOTOS_STORAGE_KEY = 'fuksimapp_voted_photo_ids'

function getVotedPhotoIds(): string[] {
    try {
        const stored = localStorage.getItem(VOTED_PHOTOS_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function recordVotedPhotoId(id: string) {
    try {
        const current = getVotedPhotoIds()
        if (!current.includes(id)) {
            localStorage.setItem(VOTED_PHOTOS_STORAGE_KEY, JSON.stringify([...current, id]))
        }
    } catch {
        // Fallback gracefully if localStorage is disabled
    }
}

type SortOption = 'latest' | 'votes'

export const Route = createFileRoute('/photos/')({
    component: PhotosGalleryRoute,
})

function PhotosGalleryRoute() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()
    const { data: photos = [] } = usePhotos()

    const [sortBy, setSortBy] = React.useState<SortOption>('latest')
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
    const [selectedPhotoForTagging, setSelectedPhotoForTagging] = React.useState<string | null>(null)
    const [activeLightboxPhoto, setActiveLightboxPhoto] = React.useState<Photo | null>(null)

    const [votedPhotoIds, setVotedPhotoIds] = React.useState<string[]>(() => getVotedPhotoIds())

    const voteMutation = useVotePhoto()
    const deleteMutation = useDeletePhoto()

    const handleVote = (e: React.MouseEvent, photo: Photo) => {
        e.stopPropagation()
        if (votedPhotoIds.includes(photo.id)) return

        setVotedPhotoIds((prev) => [...prev, photo.id])
        recordVotedPhotoId(photo.id)

        voteMutation.mutate(
            { path: { id: photo.id } },
            {
                onError: () => {
                    setVotedPhotoIds((prev) => prev.filter((id) => id !== photo.id))
                    try {
                        const updated = getVotedPhotoIds().filter((id) => id !== photo.id)
                        localStorage.setItem(VOTED_PHOTOS_STORAGE_KEY, JSON.stringify(updated))
                    } catch {
                        // Ignore storage errors
                    }
                },
            }
        )
    }

    const handleDelete = async (e: React.MouseEvent, photoId: string) => {
        e.stopPropagation()
        if (window.confirm(t('photos.confirmDelete', 'Delete this photo?'))) {
            await deleteMutation.mutateAsync({ path: { id: photoId } })
            if (activeLightboxPhoto?.id === photoId) {
                setActiveLightboxPhoto(null)
            }
        }
    }

    // Dynamic sorting memoized for performance
    const sortedPhotos = React.useMemo(() => {
        return [...photos].sort((a, b) => {
            if (sortBy === 'votes') {
                const countA = (a.vote_count ?? 0) + (votedPhotoIds.includes(a.id) ? 1 : 0)
                const countB = (b.vote_count ?? 0) + (votedPhotoIds.includes(b.id) ? 1 : 0)
                return countB - countA
            }
            // Default: Latest created first
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }, [photos, sortBy, votedPhotoIds])

    return (
        <div className="flex h-full w-full flex-col items-center gap-4 p-4 overflow-y-auto">
            {/* Header Toolbar */}
            <div className="flex w-full max-w-5xl items-center justify-between gap-4 border-b-2 border-black pb-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-black">
                        {t('photos.title', 'Asukilpailu')}
                    </h2>
                    <p className="text-xs font-bold text-black/70">
                        {t('photos.subtitle', 'Browse costume entries, vote for your favorites, and tag your team.')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-2.5 py-1.5 text-xs font-extrabold text-black shadow-2xs">
                        <ArrowUpDown className="h-3.5 w-3.5 text-black/60" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-transparent font-black uppercase outline-none cursor-pointer"
                        >
                            <option value="latest">{t('photos.sortLatest', 'Uusimmat')}</option>
                            <option value="votes">{t('photos.sortVotes', 'Eniten ääniä')}</option>
                        </select>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-4 py-2 text-xs font-black uppercase text-black shadow-2xs hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4 stroke-[3]" />
                            {t('photos.uploadButton', 'Upload Photos')}
                        </button>
                    )}
                </div>
            </div>

            {/* Photo Grid */}
            <div className="grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedPhotos.map((photo) => {
                    const hasVoted = votedPhotoIds.includes(photo.id)
                    const displayVoteCount = (photo.vote_count ?? 0) + (hasVoted ? 1 : 0)

                    return (
                        <div
                            key={photo.id}
                            onClick={() => setActiveLightboxPhoto(photo)}
                            className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                        >
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-black/5">
                                <img
                                    src={photo.url}
                                    alt={t('photos.altText', 'Costume entry photo')}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />

                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="h-6 w-6 text-white stroke-[2.5]" />
                                </div>
                            </div>

                            {/* Card Footer Controls */}
                            <div className="flex items-center justify-between border-t-2 border-black bg-white p-2.5">
                                <button
                                    type="button"
                                    disabled={hasVoted}
                                    onClick={(e) => handleVote(e, photo)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md border-2 border-black px-2.5 py-1 text-xs font-black transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-90',
                                        hasVoted
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-rose-100 text-rose-950 hover:bg-rose-200'
                                    )}
                                >
                                    <Heart
                                        className={cn(
                                            'h-3.5 w-3.5 transition-colors',
                                            hasVoted ? 'fill-white text-white' : 'fill-rose-600 text-rose-600'
                                        )}
                                    />
                                    <span>{displayVoteCount}</span>
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, photo.id)}
                                        className="rounded-md border-2 border-black bg-white p-1 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Lightbox Modal */}
            {activeLightboxPhoto && (
                <LightboxModal
                    photo={activeLightboxPhoto}
                    isVoted={votedPhotoIds.includes(activeLightboxPhoto.id)}
                    voteCount={
                        (activeLightboxPhoto.vote_count ?? 0) +
                        (votedPhotoIds.includes(activeLightboxPhoto.id) ? 1 : 0)
                    }
                    isAdmin={isAdmin}
                    onClose={() => setActiveLightboxPhoto(null)}
                    onVote={(e) => handleVote(e, activeLightboxPhoto)}
                    onOpenTagModal={() => setSelectedPhotoForTagging(activeLightboxPhoto.id)}
                />
            )}

            {/* Modals */}
            <PhotoUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />

            {selectedPhotoForTagging && (
                <SuggestTeamModal
                    photoId={selectedPhotoForTagging}
                    isOpen={Boolean(selectedPhotoForTagging)}
                    onClose={() => setSelectedPhotoForTagging(null)}
                />
            )}
        </div>
    )
}

interface LightboxModalProps {
    photo: Photo
    voteCount: number
    isVoted: boolean
    isAdmin: boolean
    onClose: () => void
    onVote: (e: React.MouseEvent) => void
    onOpenTagModal: () => void
}

function LightboxModal({
    photo,
    voteCount,
    isVoted,
    isAdmin,
    onClose,
    onVote,
    onOpenTagModal,
}: LightboxModalProps) {
    const { t } = useTranslation()
    const { data: suggestions = [], isLoading: isLoadingSuggestions } = usePhotoSuggestions(
        isAdmin ? photo.id : undefined
    )
    const updatePhoto = useUpdatePhoto(photo.id)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Lightbox Image */}
                <div className="relative flex w-full items-center justify-center bg-black/95 max-h-[65vh] overflow-hidden">
                    <img
                        src={photo.url}
                        alt={t('photos.altText', 'Costume entry photo')}
                        className="max-h-[65vh] w-auto object-contain"
                    />
                </div>

                {/* Lightbox Footer Controls */}
                <div className="flex w-full items-center justify-between border-t-2 border-black bg-white p-3">
                    <button
                        type="button"
                        disabled={isVoted}
                        onClick={onVote}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md border-2 border-black px-3 py-1.5 text-xs font-black transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-90',
                            isVoted ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-950 hover:bg-rose-200'
                        )}
                    >
                        <Heart className={cn('h-4 w-4', isVoted ? 'fill-white text-white' : 'fill-rose-600 text-rose-600')} />
                        <span>{t('photos.likesCount', '{{count}} Likes', { count: voteCount })}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Tag Team Action */}
                        <button
                            type="button"
                            onClick={onOpenTagModal}
                            className="flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-3 py-1.5 text-xs font-black text-black hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                            <Tag className="h-4 w-4" />
                            <span>{t('photos.tagTeam', 'Tag Team')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black hover:bg-black/5 cursor-pointer"
                        >
                            {t('common.close', 'Sulje')}
                        </button>
                    </div>
                </div>

                {/* Admin Team Tag Suggestions Inspector */}
                {isAdmin && (
                    <div className="flex w-full flex-col gap-2 border-t-2 border-black bg-amber-50/50 p-3 max-h-40 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-tight text-black flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-amber-600" />
                                {t('photos.teamSuggestions', 'Team Tag Suggestions')} ({suggestions.length})
                            </span>
                        </div>

                        {isLoadingSuggestions ? (
                            <div className="flex items-center gap-2 py-2 text-xs font-bold text-black/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('common.loading', 'Ladataan...')}
                            </div>
                        ) : suggestions.length === 0 ? (
                            <p className="text-[11px] font-bold text-black/50 italic py-1">
                                {t('photos.noSuggestions', 'Ei tiimiehdotuksia tälle kuvalle yet.')}
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {suggestions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 rounded-md border-2 border-black bg-white px-2.5 py-1 text-xs font-bold text-black shadow-2xs"
                                    >
                                        <span>{t('photos.teamNumber', 'Tiimi #{{number}}', { number: item.suggested_team_number })}</span>
                                        <button
                                            type="button"
                                            title={t('photos.acceptSuggestion', 'Hyväksy ehdotus')}
                                            onClick={() => {
                                                updatePhoto.mutate({
                                                    path: { id: photo.id },
                                                    body: { published: true },
                                                })
                                            }}
                                            className="rounded bg-emerald-400 p-0.5 text-black hover:bg-emerald-300 cursor-pointer"
                                        >
                                            <Check className="h-3 w-3 stroke-[3]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
