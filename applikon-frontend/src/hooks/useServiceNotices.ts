import { useQuery } from '@tanstack/react-query'
import { fetchActiveNotices } from '../services/api'

export function useServiceNotices() {
  return useQuery({
    queryKey: ['service-notices'],
    queryFn: fetchActiveNotices,
    staleTime: 5 * 60 * 1000,
  })
}
