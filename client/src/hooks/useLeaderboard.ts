import { useQuery } from '@tanstack/react-query'
import { getLeaderboardOptions } from '@/api/generated/@tanstack/react-query.gen'

export function useLeaderboard() {
    return useQuery({
        ...getLeaderboardOptions(),
        refetchInterval: 15000, // Auto-refresh leaderboard every 15 seconds
    })
}
