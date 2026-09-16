import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
    listByCheckpointOptions,
    submitScoreMutation,
    updateScoreMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export function useCheckpointScores(checkpointId: string) {
    return useQuery(listByCheckpointOptions({ path: { checkpoint_id: checkpointId } }))
}

export function useSubmitScore(checkpointId: string, onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...submitScoreMutation(),
        mutationKey: ['scores', 'submit', checkpointId],
        meta: {
            loadingMessage: t('scores.meta.submitting', 'Submitting score...'),
            successMessage: t('scores.meta.success', 'Score recorded successfully!'),
        },
        onSuccess: () => {
            // Invalidate the exact checkpoint scores query key so the history list refreshes instantly
            const options = listByCheckpointOptions({ path: { checkpoint_id: checkpointId } })
            queryClient.invalidateQueries({ queryKey: options.queryKey })

            // Also invalidate leaderboard queries if active
            queryClient.invalidateQueries({ queryKey: ['scores'] })

            onSuccess?.()
        },
    })
}

export function useUpdateScore(checkpointId: string, onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...updateScoreMutation(),
        mutationKey: ['scores', 'update', checkpointId],
        meta: {
            loadingMessage: t('scores.meta.updating', 'Updating score...'),
            successMessage: t('scores.meta.updateSuccess', 'Score updated successfully!'),
        },
        onSuccess: () => {
            // Invalidate the exact checkpoint scores query key so the history list refreshes instantly
            const options = listByCheckpointOptions({ path: { checkpoint_id: checkpointId } })
            queryClient.invalidateQueries({ queryKey: options.queryKey })

            // Also invalidate leaderboard queries if active
            queryClient.invalidateQueries({ queryKey: ['scores'] })

            onSuccess?.()
        },
    })
}
