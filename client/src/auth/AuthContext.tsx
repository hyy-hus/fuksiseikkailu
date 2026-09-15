import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { User } from '@/api/generated/types.gen'
import { AUTH_QUERY_KEY, useMe } from '@/hooks/useAuth'

interface AuthContextType {
    token: string | null
    user: User | null
    isLoadingUser: boolean
    isAuthenticated: boolean
    isAdmin: boolean
    isStaff: boolean
    role: User['role'] | null
    login: (token: string) => void
    logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)
const TOKEN_KEY = 'access_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()

    const [token, setToken] = React.useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY)
    })

    const { data: user = null, isLoading: isLoadingUser } = useMe(Boolean(token))

    const login = React.useCallback((newToken: string) => {
        localStorage.setItem(TOKEN_KEY, newToken)
        setToken(newToken)
    }, [])

    const logout = React.useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
        window.location.href = '/login'
    }, [queryClient])

    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY) {
                setToken(e.newValue)
                if (!e.newValue) {
                    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
                    window.location.href = '/login'
                }
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [queryClient])

    const role = user?.role ?? null
    const isAdmin = role === 'admin'
    const isStaff = role === 'admin' || role === 'checkpoint'

    const value = React.useMemo(
        () => ({
            token,
            user,
            isLoadingUser,
            isAuthenticated: Boolean(token),
            isAdmin,
            isStaff,
            role,
            login,
            logout,
        }),
        [token, user, isLoadingUser, isAdmin, isStaff, role, login, logout]
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
