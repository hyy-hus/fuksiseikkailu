import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    getSettingsOptions,
    resetScoresMutation,
    toggleLeaderboardMutation,
    toggleScoresMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export function useSettings() {
    return useQuery({
        ...getSettingsOptions(),
        staleTime: 1000 * 30, // Cache settings for 30 seconds
    })
}

export function useToggleScores() {
    const queryClient = useQueryClient()

    return useMutation({
        ...toggleScoresMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getSettingsOptions().queryKey })
        },
    })
}

export function useToggleLeaderboard() {
    const queryClient = useQueryClient()

    return useMutation({
        ...toggleLeaderboardMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getSettingsOptions().queryKey })
        },
    })
}

export function useResetScores() {
    const queryClient = useQueryClient()

    return useMutation({
        ...resetScoresMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries()
        },
    })
}
