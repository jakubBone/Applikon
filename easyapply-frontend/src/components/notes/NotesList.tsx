import { useState } from 'react'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNotes'
import type { NoteCategory } from '../../types/domain'
import './NotesList.css'

const CATEGORIES: { value: NoteCategory; label: string; color: string; bg: string }[] = [
  { value: 'PYTANIA', label: 'Pytania z rozmowy', color: '#3498db', bg: '#ebf5fb' },
  { value: 'FEEDBACK', label: 'Feedback', color: '#27ae60', bg: '#eafaf1' },
  { value: 'INNE', label: 'Inne', color: '#95a5a6', bg: '#f4f6f6' },
]

const LEGACY_CATEGORY_MAP: Record<string, typeof CATEGORIES[number]> = {
  'PYTANIE': { value: 'PYTANIA', label: 'Pytania z rozmowy', color: '#3498db', bg: '#ebf5fb' },
  'KONTAKT': { value: 'INNE', label: 'Inne', color: '#95a5a6', bg: '#f4f6f6' },
}

const getCategoryConfig = (category: string) =>
  LEGACY_CATEGORY_MAP[category] ?? CATEGORIES.find(c => c.value === category) ?? CATEGORIES[2]

const getRelativeTime = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Przed chwilą'
  if (diffMins < 60) return `${diffMins} min temu`
  if (diffHours < 24) return `${diffHours} godz. temu`
  if (diffDays === 1) return 'Wczoraj'
  if (diffDays < 7) return `${diffDays} dni temu`
  return new Date(dateString).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface NotesListProps {
  applicationId: number
}

export function NotesList({ applicationId }: NotesListProps) {
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState<NoteCategory>('PYTANIA')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState<NoteCategory>('PYTANIA')

  const { data: notes = [], isLoading } = useNotes(applicationId)
  const createNote = useCreateNote(applicationId)
  const updateNote = useUpdateNote(applicationId)
  const deleteNote = useDeleteNote(applicationId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    createNote.mutate(
      { content: newNote.trim(), category: newCategory },
      { onSuccess: () => { setNewNote(''); setNewCategory('PYTANIA') } }
    )
  }

  const handleEditSave = (noteId: number) => {
    if (!editContent.trim()) return
    updateNote.mutate(
      { id: noteId, content: editContent.trim(), category: editCategory },
      { onSuccess: () => { setEditingId(null); setEditContent('') } }
    )
  }

  const handleDelete = (noteId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return
    deleteNote.mutate(noteId)
  }

  return (
    <div className="notes-list">
      <h3>Notatki</h3>

      <form onSubmit={handleSubmit} className="note-form">
        <div className="category-buttons">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${newCategory === cat.value ? 'active' : ''}`}
              onClick={() => setNewCategory(cat.value)}
              style={{ '--cat-color': cat.color, '--cat-bg': cat.bg } as React.CSSProperties}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Dodaj notatkę..."
          rows={2}
          disabled={createNote.isPending}
        />
        <button type="submit" className="submit-note-btn" disabled={createNote.isPending || !newNote.trim()}>
          {createNote.isPending ? 'Dodawanie...' : 'Dodaj notatkę'}
        </button>
      </form>

      {isLoading ? (
        <p className="loading">Ładowanie notatek...</p>
      ) : notes.length === 0 ? (
        <p className="empty">Brak notatek</p>
      ) : (
        <div className="notes-container">
          {notes.map(note => {
            const catConfig = getCategoryConfig(note.category)
            return (
              <div
                key={note.id}
                className="note-item"
                style={{ '--note-color': catConfig.color } as React.CSSProperties}
              >
                {editingId === note.id ? (
                  <div className="note-edit">
                    <div className="category-buttons small">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          className={`category-btn ${editCategory === cat.value ? 'active' : ''}`}
                          onClick={() => setEditCategory(cat.value)}
                          style={{ '--cat-color': cat.color, '--cat-bg': cat.bg } as React.CSSProperties}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button className="save-btn" onClick={() => handleEditSave(note.id)}>Zapisz</button>
                      <button className="cancel-edit-btn" onClick={() => setEditingId(null)}>Anuluj</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="note-header">
                      <span className="category-tag" style={{ backgroundColor: catConfig.bg, color: catConfig.color }}>
                        {catConfig.label}
                      </span>
                      <span className="note-date">{getRelativeTime(note.createdAt)}</span>
                    </div>
                    <div className="note-content">{note.content}</div>
                    <div className="note-actions">
                      <button className="action-btn edit" onClick={() => { setEditingId(note.id); setEditContent(note.content); setEditCategory(note.category) }}>Edytuj</button>
                      <button className="action-btn delete" onClick={() => handleDelete(note.id)}>Usuń</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
