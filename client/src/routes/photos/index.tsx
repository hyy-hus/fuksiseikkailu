import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { Heart, Maximize2, Plus, Tag, Trash2 } from 'lucide-react'

import type { Photo } from '@/api/generated/types.gen'
import { useAuth } from '@/auth/AuthContext'
import { PhotoUploadModal } from '@/components/PhotoUploadModal'
import { SuggestTeamModal } from '@/components/SuggestTeamModal'
import { useDeletePhoto, usePhotos, useVotePhoto } from '@/hooks/usePhotos'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/photos/')({
    component: PhotosGalleryRoute,
})

function PhotosGalleryRoute() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()
    const { data: photos = [] } = usePhotos()

    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
    const [selectedPhotoForTagging, setSelectedPhotoForTagging] = React.useState<string | null>(null)
    const [activeLightboxPhoto, setActiveLightboxPhoto] = React.useState<Photo | null>(null)

    const voteMutation = useVotePhoto()
    const deleteMutation = useDeletePhoto()

    const handleVote = (e: React.MouseEvent, photoId: string) => {
        e.stopPropagation()
        voteMutation.mutate({ path: { id: photoId } })
    }

    const handleDelete = async (e: React.MouseEvent, photoId: string) => {
        e.stopPropagation()
        if (window.confirm(t('photos.confirmDelete', 'Delete this photo?'))) {
            await deleteMutation.mutateAsync({ path: { id: photoId } })
        }
    }

    return (
        <div className="flex h-full w-full flex-col items-center gap-4 p-4 overflow-y-auto">
            <div className="flex w-full max-w-5xl items-center justify-between gap-4 border-b-2 border-black pb-4">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-black">
                        {t('photos.title', 'Event Gallery')}
                    </h2>
                    <p className="text-xs font-bold text-black/70">
                        {t('photos.subtitle', 'Browse event highlights, like your favorites, and tag your team.')}
                    </p>
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

            {/* Photo Grid */}
            <div className="grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        onClick={() => setActiveLightboxPhoto(photo)}
                        className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                    >
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-black/5">
                            <img
                                src={photo.url}
                                alt="Event photo"
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
                                onClick={(e) => handleVote(e, photo.id)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md border-2 border-black px-2.5 py-1 text-xs font-black transition-colors cursor-pointer',
                                    'bg-rose-100 text-rose-950 hover:bg-rose-200'
                                )}
                            >
                                <Heart className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
                                <span>{photo.vote_count ?? 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedPhotoForTagging(photo.id)
                                    }}
                                    className="flex items-center gap-1 rounded-md border-2 border-black bg-amber-400 px-2.5 py-1 text-xs font-black text-black hover:bg-amber-300 transition-colors cursor-pointer"
                                >
                                    <Tag className="h-3.5 w-3.5" />
                                    <span>{t('photos.tag', 'Tag')}</span>
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
                    </div>
                ))}
            </div>

            {/* Lightbox Preview */}
            {activeLightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                    onClick={() => setActiveLightboxPhoto(null)}
                >
                    <div
                        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={activeLightboxPhoto.url}
                            alt="Event photo view"
                            className="max-h-[75vh] w-auto object-contain"
                        />
                        <div className="flex w-full items-center justify-between border-t-2 border-black bg-white p-3">
                            <span className="text-xs font-black text-black">
                                {t('photos.likesCount', '{{count}} Likes', { count: activeLightboxPhoto.vote_count ?? 0 })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveLightboxPhoto(null)}
                                className="rounded-md border-2 border-black bg-amber-400 px-3 py-1 text-xs font-black text-black cursor-pointer"
                            >
                                {t('common.close', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
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
