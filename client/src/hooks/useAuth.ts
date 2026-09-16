import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
    getMeOptions,
    refreshTokenMutation,
    registerMutation,
    requestOtpMutation,
    verifyOtpMutation,
} from '@/api/generated/@tanstack/react-query.gen'

export const AUTH_QUERY_KEY = ['auth', 'me']
const TOKEN_KEY = 'access_token'

/**
 * Fetch active user profile from /users/me
 */
export function useMe(enabled = true) {
    return useQuery({
        ...getMeOptions(),
        // Use spread or cast as const tuple
        enabled,
        staleTime: 1000 * 60 * 5,
        retry: false,
    })
}

/**
 * Hook for requesting an OTP code sent to user email
 */
export function useRequestOtpMutation() {
    return useMutation({
        ...requestOtpMutation(),
        mutationKey: ['auth', 'requestOtp'],
    })
}

/**
 * Hook for verifying an OTP code to obtain session tokens
 */
export function useVerifyOtpMutation(onSuccess?: (token: string) => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...verifyOtpMutation(),
        mutationKey: ['auth', 'verifyOtp'],
        onSuccess: (data) => {
            if (data?.access_token) {
                localStorage.setItem(TOKEN_KEY, data.access_token)
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
                onSuccess?.(data.access_token)
            }
        },
    })
}

/**
 * Hook for registering a new user account
 */
export function useRegisterMutation(onSuccess?: (token: string) => void) {
    const queryClient = useQueryClient()

    return useMutation({
        ...registerMutation(),
        mutationKey: ['auth', 'register'],
        onSuccess: (data) => {
            if (data?.access_token) {
                localStorage.setItem(TOKEN_KEY, data.access_token)
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
                onSuccess?.(data.access_token)
            }
        },
    })
}

/**
 * Hook for manually refreshing session tokens
 */
export function useRefreshTokenMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        ...refreshTokenMutation(),
        mutationKey: ['auth', 'refreshToken'],
        onSuccess: (data) => {
            if (data?.access_token) {
                localStorage.setItem(TOKEN_KEY, data.access_token)
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
            }
        },
    })
}
