import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
    createPhotoMutation,
    deletePhotoMutation,
    generateUploadUrlMutation,
    listPhotosOptions,
    listSuggestionsOptions,
    suggestTeamMutation,
    updatePhotoMutation,
    votePhotoMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export const PHOTOS_QUERY_KEY = ['photos']

export function usePhotos() {
    return useQuery(listPhotosOptions())
}

export function usePhotoSuggestions(photoId?: string) {
    return useQuery({
        ...listSuggestionsOptions({ path: { id: photoId! } }),
        enabled: Boolean(photoId),
    })
}

export function useGenerateUploadUrl() {
    return useMutation(generateUploadUrlMutation())
}

export function useCreatePhoto() {
    const queryClient = useQueryClient()
    return useMutation({
        ...createPhotoMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY })
        },
    })
}

export function useUpdatePhoto(photoId?: string) {
    const queryClient = useQueryClient()
    return useMutation({
        ...updatePhotoMutation(),
        mutationKey: ['photos', 'update', photoId],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY })
            if (photoId) {
                queryClient.invalidateQueries(listSuggestionsOptions({ path: { id: photoId } }))
            }
        },
    })
}

export function useDeletePhoto() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    return useMutation({
        ...deletePhotoMutation(),
        meta: {
            loadingMessage: t('photos.deleting', 'Deleting photo...'),
            successMessage: t('photos.deleted', 'Photo deleted successfully.'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY })
        },
    })
}

export function useVotePhoto() {
    const queryClient = useQueryClient()
    return useMutation({
        ...votePhotoMutation(),
        meta: {
            silent: true,
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY })
        },
    })
}

export function useSuggestTeam(photoId?: string) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    return useMutation({
        ...suggestTeamMutation(),
        meta: {
            loadingMessage: t('photos.submittingSuggestion', 'Submitting team tag...'),
            successMessage: t('photos.suggestionSubmitted', 'Team tag suggestion submitted!'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY })
            if (photoId) {
                queryClient.invalidateQueries(listSuggestionsOptions({ path: { id: photoId } }))
            }
        },
    })
}
