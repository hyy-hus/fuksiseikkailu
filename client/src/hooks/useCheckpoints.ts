import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
    batchImportMutation,
    createCheckpointMutation,
    listCheckpointsOptions,
    updateCheckpointMutation,
} from '@/api/generated/@tanstack/react-query.gen'
// import type { CreateCheckpoint, UpdateCheckpoint } from '@/api/generated/types.gen'

export const CHECKPOINTS_QUERY_KEY = ['checkpoints']

/**
 * Fetch all checkpoints from the backend
 */
export function useCheckpoints() {
    return useQuery(listCheckpointsOptions())
}

/**
 * Hook for creating a single checkpoint
 */
export function useCreateCheckpoint(onSuccess?: () => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...createCheckpointMutation(),
        mutationKey: ['checkpoints', 'create'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CHECKPOINTS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

/**
 * Hook for updating an existing checkpoint
 */
export function useUpdateCheckpoint(checkpointId?: string, onSuccess?: () => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...updateCheckpointMutation(),
        mutationKey: ['checkpoints', 'update', checkpointId],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CHECKPOINTS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

/**
 * Hook for batch importing checkpoints
 */
export function useBatchImportCheckpoints(onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...batchImportMutation(),
        mutationKey: ['checkpoints', 'batchCreate'],
        meta: {
            loadingMessage: t('batchImport.meta.loading', 'Importing checkpoints batch...'),
            successMessage: (data: unknown) =>
                t('batchImport.meta.success', 'Successfully imported {{count}} checkpoints!', {
                    count: Array.isArray(data) ? data.length : '',
                }),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CHECKPOINTS_QUERY_KEY })
            onSuccess?.()
        },
    })
}
