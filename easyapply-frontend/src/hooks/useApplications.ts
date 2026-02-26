import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  updateApplicationStage,
  addStage,
  deleteApplication,
  checkDuplicate,
  assignCVToApplication,
} from '../services/api'
import type { ApplicationRequest, StageUpdateRequest } from '../types/domain'

// Klucze zapytań — centralne miejsce, eliminuje literówki przy invalidacji cache
export const applicationKeys = {
  all: ['applications'] as const,
  duplicates: (company: string, position: string) =>
    ['applications', 'duplicates', company, position] as const,
}

/**
 * useApplications — pobiera listę wszystkich aplikacji użytkownika.
 *
 * useQuery automatycznie:
 * - zarządza stanem loading/error/data
 * - cache'uje wyniki (staleTime z QueryClient)
 * - odświeża dane przy powrocie do zakładki (refetchOnWindowFocus)
 */
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: fetchApplications,
  })
}

/**
 * useCreateApplication — tworzy nową aplikację.
 *
 * useMutation:
 * - onSuccess: unieważnia cache aplikacji → React Query automatycznie
 *   ponownie pobierze listę, widok odświeży się bez ręcznego setState
 */
export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplicationRequest) => createApplication(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationRequest }) =>
      updateApplication(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['badgeStats'] })
    },
  })
}

export function useUpdateStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StageUpdateRequest }) =>
      updateApplicationStage(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['badgeStats'] })
    },
  })
}

export function useAddStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageName }: { id: number; stageName: string }) =>
      addStage(id, stageName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useAssignCV() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, cvId }: { applicationId: number; cvId: number | null }) =>
      assignCVToApplication(applicationId, cvId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useCheckDuplicate(company: string, position: string) {
  return useQuery({
    queryKey: applicationKeys.duplicates(company, position),
    queryFn: () => checkDuplicate(company, position),
    // Odpytuj tylko gdy oba pola są wypełnione
    enabled: company.length > 0 && position.length > 0,
    staleTime: 0, // Duplikaty zawsze sprawdzaj na świeżo
  })
}
