import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNotes'
import type { NoteCategory } from '../../types/domain'
import './NotesList.css'

const CATEGORIES: { value: NoteCategory; labelKey: ParseKeys<'common'>; color: string; bg: string }[] = [
  { value: 'PYTANIA', labelKey: 'notes.catPytania', color: '#3498db', bg: '#ebf5fb' },
  { value: 'FEEDBACK', labelKey: 'notes.catFeedback', color: '#27ae60', bg: '#eafaf1' },
  { value: 'INNE', labelKey: 'notes.catInne', color: '#95a5a6', bg: '#f4f6f6' },
]

const LEGACY_CATEGORY_MAP: Record<string, { value: NoteCategory; labelKey: ParseKeys<'common'>; color: string; bg: string }> = {
  'PYTANIE': { value: 'PYTANIA', labelKey: 'notes.catPytania', color: '#3498db', bg: '#ebf5fb' },
  'KONTAKT': { value: 'INNE', labelKey: 'notes.catInne', color: '#95a5a6', bg: '#f4f6f6' },
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
  const { t } = useTranslation()
  const { t: tErrors } = useTranslation('errors')
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
    if (!confirm(tErrors('notes.deleteConfirm'))) return
    deleteNote.mutate(noteId)
  }

  return (
    <div className="notes-list">
      <h3>{t('notes.title')}</h3>

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
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('notes.placeholder')}
          rows={2}
          disabled={createNote.isPending}
        />
        <button type="submit" className="submit-note-btn" disabled={createNote.isPending || !newNote.trim()}>
          {createNote.isPending ? t('notes.adding') : t('notes.add')}
        </button>
      </form>

      {isLoading ? (
        <p className="loading">{t('notes.loading')}</p>
      ) : notes.length === 0 ? (
        <p className="empty">{t('notes.empty')}</p>
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
                          {t(cat.labelKey)}
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
                      <button className="save-btn" onClick={() => handleEditSave(note.id)}>{t('notes.save')}</button>
                      <button className="cancel-edit-btn" onClick={() => setEditingId(null)}>{t('notes.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="note-header">
                      <span className="category-tag" style={{ backgroundColor: catConfig.bg, color: catConfig.color }}>
                        {t(catConfig.labelKey)}
                      </span>
                      <span className="note-date">{getRelativeTime(note.createdAt)}</span>
                    </div>
                    <div className="note-content">{note.content}</div>
                    <div className="note-actions">
                      <button className="action-btn edit" onClick={() => { setEditingId(note.id); setEditContent(note.content); setEditCategory(note.category) }}>{t('notes.edit')}</button>
                      <button className="action-btn delete" onClick={() => handleDelete(note.id)}>{t('notes.delete')}</button>
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
