import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { User } from '@/api/generated/types.gen'
import { AUTH_QUERY_KEY, useMe, useRefreshTokenMutation } from '@/hooks/useAuth'

interface AuthContextType {
    token: string | null
    user: User | null
    isLoadingUser: boolean
    isAuthenticated: boolean
    isAdmin: boolean
    isStaff: boolean
    role: string | null
    login: (token: string) => void
    logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)
const TOKEN_KEY = 'access_token'

// Interval settings (in milliseconds)
const REFRESH_INTERVAL = 1000 * 60 * 5 // Refresh access token every 5 minutes
const INACTIVITY_TIMEOUT = 1000 * 60 * 30 // Logout after 30 minutes of inactivity

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()

    const [token, setToken] = React.useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY)
    })

    // Track user activity timestamp
    const lastActivityRef = React.useRef<number>(Date.now())

    // Fetch user details only if token exists
    const { data: user = null, isLoading: isLoadingUser } = useMe(Boolean(token))
    const refreshTokenMutation = useRefreshTokenMutation()

    const login = React.useCallback((newToken: string) => {
        localStorage.setItem(TOKEN_KEY, newToken)
        setToken(newToken)
        lastActivityRef.current = Date.now()
    }, [])

    const logout = React.useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    }, [queryClient])

    // Listen for user activity across the document
    React.useEffect(() => {
        if (!token) return

        const updateActivity = () => {
            lastActivityRef.current = Date.now()
        }

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
        events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }))

        return () => {
            events.forEach((evt) => window.removeEventListener(evt, updateActivity))
        }
    }, [token])

    // Background interval: Refresh token every 5 mins if active, or log out if idle > 30 mins
    React.useEffect(() => {
        if (!token) return

        const interval = setInterval(async () => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current

            if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
                // User has been idle for 30+ mins -> log out and redirect
                logout()
                window.location.href = '/auth/login'
                return
            }

            // User is active -> proactively refresh token in background
            try {
                const response = await refreshTokenMutation.mutateAsync({})
                if (response?.access_token) {
                    setToken(response.access_token)
                }
            } catch {
                // If refresh fails (e.g. refresh cookie expired), log out cleanly
                logout()
                window.location.href = '/auth/login'
            }
        }, REFRESH_INTERVAL)

        return () => clearInterval(interval)
    }, [token, logout, refreshTokenMutation])

    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY) {
                setToken(e.newValue)
                if (!e.newValue) {
                    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
                }
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [queryClient])

    // Normalize role string comparison
    const normalizedRole = user?.role ? String(user.role).toLowerCase() : null
    const isAdmin = normalizedRole === 'admin'
    const isStaff = normalizedRole === 'admin' || normalizedRole === 'checkpoint'

    const value = React.useMemo(
        () => ({
            token,
            user,
            isLoadingUser,
            isAuthenticated: Boolean(token),
            isAdmin,
            isStaff,
            role: normalizedRole,
            login,
            logout,
        }),
        [token, user, isLoadingUser, isAdmin, isStaff, normalizedRole, login, logout]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
