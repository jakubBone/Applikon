import { useQuery } from '@tanstack/react-query'
import { fetchBadgeStats } from '../services/api'

export function useBadgeStats() {
  return useQuery({
    queryKey: ['badgeStats'],
    queryFn: fetchBadgeStats,
    staleTime: 60_000, // Refresh stats every minute
  })
}
