import { useState, useEffect } from 'react'
import { fetchNotes, deleteNote, getSessionId } from './services/api'
import './NotesList.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Kategorie notatek (uproszczone)
const CATEGORIES = [
  { value: 'PYTANIA', label: 'Pytania z rozmowy', color: '#3498db', bg: '#ebf5fb' },
  { value: 'FEEDBACK', label: 'Feedback', color: '#27ae60', bg: '#eafaf1' },
  { value: 'INNE', label: 'Inne', color: '#95a5a6', bg: '#f4f6f6' }
]

// Mapowanie starych kategorii na nowe
const LEGACY_CATEGORY_MAP = {
  'PYTANIE': { value: 'PYTANIA', label: 'Pytania z rozmowy', color: '#3498db', bg: '#ebf5fb' },
  'KONTAKT': { value: 'INNE', label: 'Inne', color: '#95a5a6', bg: '#f4f6f6' }
}

const getCategoryConfig = (category) => {
  // Sprawdź czy to stara kategoria
  if (LEGACY_CATEGORY_MAP[category]) {
    return LEGACY_CATEGORY_MAP[category]
  }
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[2]
}

// Względny czas
const getRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Przed chwilą'
  if (diffMins < 60) return `${diffMins} min temu`
  if (diffHours < 24) return `${diffHours} godz. temu`
  if (diffDays === 1) return 'Wczoraj'
  if (diffDays < 7) return `${diffDays} dni temu`

  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function NotesList({ applicationId }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState('PYTANIA')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('PYTANIA')

  useEffect(() => {
    loadNotes()
  }, [applicationId])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await fetchNotes(applicationId)
      setNotes(data)
    } catch (error) {
      console.error('Błąd pobierania notatek:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': getSessionId()
        },
        body: JSON.stringify({ content: newNote.trim(), category: newCategory })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error('Błąd serwera')
      }

      const note = await response.json()
      setNotes(prev => [note, ...prev])
      setNewNote('')
      setNewCategory('PYTANIA')
    } catch (error) {
      console.error('Błąd dodawania notatki:', error)
      alert('Nie udało się dodać notatki. Upewnij się, że backend jest uruchomiony.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return

    try {
      await deleteNote(noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Błąd usuwania notatki:', error)
      alert('Nie udało się usunąć notatki')
    }
  }

  const handleEditStart = (note) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditCategory(note.category || 'PYTANIA')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditContent('')
    setEditCategory('PYTANIA')
  }

  const handleEditSave = async (noteId) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': getSessionId()
        },
        body: JSON.stringify({ content: editContent.trim(), category: editCategory })
      })

      if (!response.ok) throw new Error('Błąd aktualizacji')

      const updated = await response.json()
      setNotes(prev => prev.map(n => n.id === noteId ? updated : n))
      setEditingId(null)
      setEditContent('')
      setEditCategory('PYTANIA')
    } catch (error) {
      console.error('Błąd aktualizacji notatki:', error)
      alert('Nie udało się zaktualizować notatki')
    }
  }

  return (
    <div className="notes-list">
      <h3>Notatki</h3>

      {/* Formularz dodawania */}
      <form onSubmit={handleSubmit} className="note-form">
        <div className="category-buttons">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${newCategory === cat.value ? 'active' : ''}`}
              onClick={() => setNewCategory(cat.value)}
              style={{
                '--cat-color': cat.color,
                '--cat-bg': cat.bg
              }}
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
          disabled={submitting}
        />
        <button type="submit" className="submit-note-btn" disabled={submitting || !newNote.trim()}>
          {submitting ? 'Dodawanie...' : 'Dodaj notatkę'}
        </button>
      </form>

      {/* Lista notatek */}
      {loading ? (
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
                style={{ '--note-color': catConfig.color }}
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
                          style={{
                            '--cat-color': cat.color,
                            '--cat-bg': cat.bg
                          }}
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
                      <button className="save-btn" onClick={() => handleEditSave(note.id)}>
                        Zapisz
                      </button>
                      <button className="cancel-edit-btn" onClick={handleEditCancel}>
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="note-header">
                      <span
                        className="category-tag"
                        style={{
                          backgroundColor: catConfig.bg,
                          color: catConfig.color
                        }}
                      >
                        {catConfig.label}
                      </span>
                      <span className="note-date">{getRelativeTime(note.createdAt)}</span>
                    </div>
                    <div className="note-content">{note.content}</div>
                    <div className="note-actions">
                      <button className="action-btn edit" onClick={() => handleEditStart(note)}>
                        Edytuj
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(note.id)}>
                        Usuń
                      </button>
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

export default NotesList
