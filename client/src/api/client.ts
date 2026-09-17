import { client } from './generated/client.gen'
import { refreshToken } from './generated/sdk.gen'

client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
})

let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else if (token) {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// 1. Request Interceptor: Inject Bearer token into outgoing requests
client.interceptors.request.use((request) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
})

// 2. Response Interceptor: Handle 401s and execute refresh flow ONLY if logged in
client.interceptors.response.use(async (response, request) => {
    const existingToken = localStorage.getItem('access_token')

    // Only attempt refresh and redirect if the user HAD a token and gets a 401
    if (response.status === 401 && existingToken && !request.url.includes('/auth/')) {
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            }).then((newToken) => {
                const headers = new Headers(request.headers)
                headers.set('Authorization', `Bearer ${newToken}`)
                return fetch(request.url, {
                    method: request.method,
                    headers,
                    body: request.body,
                })
            })
        }

        isRefreshing = true

        try {
            const { data, error } = await refreshToken()

            if (error || !data?.access_token) {
                throw new Error('Failed to refresh authentication session')
            }

            const newToken = data.access_token
            localStorage.setItem('access_token', newToken)
            processQueue(null, newToken)

            const headers = new Headers(request.headers)
            headers.set('Authorization', `Bearer ${newToken}`)

            return fetch(request.url, {
                method: request.method,
                headers,
                body: request.body,
            })
        } catch (refreshErr) {
            processQueue(refreshErr, null)
            localStorage.removeItem('access_token')

            // Only redirect to login if session renewal failed
            window.location.href = 'auth/login'
            return Promise.reject(refreshErr)
        } finally {
            isRefreshing = false
        }
    }

    // Unauthenticated guest user got a 401 -> return response normally without redirecting!
    return response
})
