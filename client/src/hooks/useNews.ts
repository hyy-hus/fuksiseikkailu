import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
    createNewsArticleMutation,
    deleteNewsArticleMutation,
    getNewsArticleOptions,
    listNewsOptions,
    updateNewsArticleMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export const NEWS_QUERY_KEY = ['news']

export function useNews() {
    return useQuery({
        ...listNewsOptions(),
        refetchInterval: 5 * 60 * 1000, // 5 minutes polling
        staleTime: 60 * 1000,
    })
}

export function useNewsArticle(id?: string) {
    return useQuery({
        ...getNewsArticleOptions({ path: { id: id! } }),
        enabled: Boolean(id),
    })
}

export function useCreateNews(onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...createNewsArticleMutation(),
        mutationKey: ['news', 'create'],
        meta: {
            loadingMessage: t('news.meta.creating', 'Creating news article...'),
            successMessage: t('news.meta.created', 'News article created successfully!'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

export function useUpdateNews(articleId?: string, onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...updateNewsArticleMutation(),
        mutationKey: ['news', 'update', articleId],
        meta: {
            loadingMessage: t('news.meta.updating', 'Updating news article...'),
            successMessage: t('news.meta.updated', 'News article updated successfully!'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

export function useDeleteNews(onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...deleteNewsArticleMutation(),
        mutationKey: ['news', 'delete'],
        meta: {
            loadingMessage: t('news.meta.deleting', 'Deleting news article...'),
            successMessage: t('news.meta.deleted', 'News article deleted successfully!'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY })
            onSuccess?.()
        },
    })
}
