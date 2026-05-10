import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotes, createNote, updateNote, deleteNote } from '../services/api'
import type { NoteCategory } from '../types/domain'

export const noteKeys = {
  byApplication: (applicationId: number) => ['notes', applicationId] as const,
}

export function useNotes(applicationId: number) {
  return useQuery({
    queryKey: noteKeys.byApplication(applicationId),
    queryFn: () => fetchNotes(applicationId),
  })
}

export function useCreateNote(applicationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ content, category }: { content: string; category: NoteCategory | null }) =>
      createNote(applicationId, content, category),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.byApplication(applicationId) })
    },
  })
}

export function useUpdateNote(applicationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content, category }: { id: number; content: string; category: NoteCategory | null }) =>
      updateNote(id, content, category),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.byApplication(applicationId) })
    },
  })
}

export function useDeleteNote(applicationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.byApplication(applicationId) })
    },
  })
}
