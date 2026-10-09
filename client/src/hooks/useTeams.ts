import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
    batchImport2Mutation,
    createTeamMutation,
    listTeamsOptions,
    updateTeamMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export const TEAMS_QUERY_KEY = ['teams']

export function useTeams() {
    return useQuery(listTeamsOptions())
}

export function useCreateTeam(onSuccess?: () => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...createTeamMutation(),
        mutationKey: ['teams', 'create'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

export function useUpdateTeam(teamId?: string, onSuccess?: () => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...updateTeamMutation(),
        mutationKey: ['teams', 'update', teamId],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
            onSuccess?.()
        },
    })
}

export function useBatchImportTeams(onSuccess?: () => void) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        ...batchImport2Mutation(),
        mutationKey: ['teams', 'batchCreate'],
        meta: {
            loadingMessage: t('teams.batchImport.meta.loading', 'Importing teams batch...'),
            successMessage: (_data: unknown) =>
                t('teams.batchImport.meta.success', 'Successfully imported teams batch!'),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
            onSuccess?.()
        },
    })
}
