import { useState, useEffect } from 'react'
import './CVManager.css'
import {
  assignCVToApplication,
  downloadCV
} from '../../services/api'
import { useCVs, useUploadCV, useCreateCV, useUpdateCV, useDeleteCV } from '../../hooks/useCV'
import type { Application, CV, CVType } from '../../types/domain'

interface Props {
  applications: Application[]
  onCVAssigned: () => void
}

function CVManager({ applications, onCVAssigned }: Props) {
  // React Query — pobieranie i mutacje CV (zamiast ręcznego useState + useEffect + fetchCVs)
  const { data: cvList = [] } = useCVs()
  const uploadCVMutation = useUploadCV()
  const createCVMutation = useCreateCV()
  const updateCVMutation = useUpdateCV()
  const deleteCVMutation = useDeleteCV()

  const [selectedCv, setSelectedCv] = useState<CV | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addStep, setAddStep] = useState<'choose' | 'file' | 'link'>('choose')
  const [linkFormData, setLinkFormData] = useState<{ name: string; externalUrl: string; type: CVType }>({ name: '', externalUrl: '', type: 'LINK' })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAppForAssign, setSelectedAppForAssign] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: '', externalUrl: '' })

  // Synchronizuj selectedCv z danymi z cache (gdy React Query odświeży listę)
  useEffect(() => {
    if (selectedCv) {
      const updated = cvList.find(cv => cv.id === selectedCv.id)
      setSelectedCv(updated ?? null)
    }
  }, [cvList])

  // Grupowanie CV według typu
  const groupedCVs = {
    FILE: cvList.filter(cv => cv.type === 'FILE' || !cv.type),
    LINK: cvList.filter(cv => cv.type === 'LINK'),
    NOTE: cvList.filter(cv => cv.type === 'NOTE')
  }

  // Liczenie użyć CV
  const getUsageCount = (cvId: number): number => {
    return applications.filter(app => app.cvId === cvId).length
  }

  // Aplikacje przypisane do wybranego CV
  const getAssignedApps = (cvId: number): Application[] => {
    return applications.filter(app => app.cvId === cvId)
  }

  // Upload CV (plik)
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Dozwolone są tylko pliki PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Plik nie może przekraczać 5MB')
      return
    }

    uploadCVMutation.mutate(file, {
      onSuccess: (newCv) => {
        setSelectedCv(newCv)
        setShowAddModal(false)
        setAddStep('choose')
        e.target.value = ''
      },
      onError: () => {
        alert('Błąd podczas uploadu')
      },
    })
  }

  // Utwórz CV typu LINK lub NOTE
  const handleCreateLinkOrNote = (e: React.FormEvent) => {
    e.preventDefault()

    if (!linkFormData.name.trim()) {
      alert('Podaj nazwę CV')
      return
    }

    createCVMutation.mutate({
      originalFileName: linkFormData.name,
      type: linkFormData.type,
      externalUrl: linkFormData.type === 'LINK' ? linkFormData.externalUrl : undefined
    }, {
      onSuccess: (newCv) => {
        setSelectedCv(newCv)
        setShowAddModal(false)
        setAddStep('choose')
        setLinkFormData({ name: '', externalUrl: '', type: 'LINK' })
      },
      onError: () => {
        alert('Błąd podczas zapisywania')
      },
    })
  }

  // Pobierz/Otwórz CV
  const handleOpen = async (cv: CV) => {
    if (cv.type === 'LINK' && cv.externalUrl) {
      window.open(cv.externalUrl, '_blank')
    } else if (cv.type === 'FILE' || !cv.type) {
      downloadCV(cv.id, cv.originalFileName ?? cv.fileName ?? 'CV')
    }
  }

  // Usuń CV
  const handleDelete = (cvId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć to CV? Zostanie ono również usunięte z przypisanych aplikacji.')) return

    deleteCVMutation.mutate(cvId, {
      onSuccess: () => {
        if (selectedCv?.id === cvId) {
          setSelectedCv(null)
        }
        onCVAssigned()
      },
      onError: () => {
        alert('Błąd usuwania CV')
      },
    })
  }

  // Przypisz CV do aplikacji
  const handleAssign = async () => {
    if (!selectedAppForAssign || !selectedCv) return

    try {
      await assignCVToApplication(selectedAppForAssign.id, selectedCv.id)
      onCVAssigned()
      setShowAssignModal(false)
      setSelectedAppForAssign(null)
    } catch (error) {
      console.error('Błąd przypisania CV:', error)
    }
  }

  // Usuń przypisanie CV
  const handleRemoveAssignment = async (appId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć przypisanie CV?')) return

    try {
      await assignCVToApplication(appId, null)
      onCVAssigned()
    } catch (error) {
      console.error('Błąd usuwania przypisania:', error)
    }
  }

  // Otwórz modal edycji
  const handleEditClick = () => {
    if (!selectedCv) return
    setEditFormData({
      name: selectedCv.originalFileName || '',
      externalUrl: selectedCv.externalUrl || ''
    })
    setShowEditModal(true)
  }

  // Zapisz edycję CV
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCv) return

    if (!editFormData.name.trim()) {
      alert('Podaj nazwę CV')
      return
    }

    updateCVMutation.mutate({
      id: selectedCv.id,
      data: {
        originalFileName: editFormData.name,
        externalUrl: selectedCv.type === 'LINK' ? editFormData.externalUrl : undefined
      }
    }, {
      onSuccess: (updatedCv) => {
        setSelectedCv(updatedCv)
        setShowEditModal(false)
      },
      onError: () => {
        alert('Błąd podczas zapisywania')
      },
    })
  }

  const formatSize = (bytes: number | null | undefined): string | null => {
    if (!bytes) return null
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setAddStep('choose')
    setLinkFormData({ name: '', externalUrl: '', type: 'LINK' })
  }

  const renderCVItem = (cv: CV) => {
    const usageCount = getUsageCount(cv.id)
    const typeClass = cv.type === 'LINK' ? 'type-link' : cv.type === 'NOTE' ? 'type-note' : 'type-file'

    return (
      <div
        key={cv.id}
        className={`cv-item ${typeClass} ${selectedCv?.id === cv.id ? 'selected' : ''}`}
        onClick={() => setSelectedCv(cv)}
      >
        <div className="cv-item-content">
          <div className="cv-item-name">{cv.originalFileName}</div>
          <div className="cv-item-meta">
            {cv.type === 'FILE' || !cv.type ? formatSize(cv.fileSize) :
             cv.type === 'LINK' && cv.externalUrl ? new URL(cv.externalUrl).hostname :
             'na komputerze'}
            {' • '}
            {usageCount > 0 ? `użyte ${usageCount}×` : 'nieużyte'}
          </div>
        </div>
      </div>
    )
  }

  const renderGroup = (title: string, icon: string, items: CV[], type: string) => {
    if (items.length === 0) return null

    return (
      <div className="cv-group">
        <div className={`cv-group-header ${type.toLowerCase()}`}>
          <span className="cv-group-icon">{icon}</span>
          <span className="cv-group-title">{title}</span>
          <span className="cv-group-count">({items.length})</span>
        </div>
        <div className="cv-group-items">
          {items.map(cv => renderCVItem(cv))}
        </div>
      </div>
    )
  }

  return (
    <div className="cv-manager">
      <div className="cv-header">
        <h2>Moje CV</h2>
        <button className="add-cv-btn" onClick={() => setShowAddModal(true)}>
          + Dodaj CV
        </button>
      </div>

      {cvList.length === 0 ? (
        <div className="cv-empty-state">
          <div className="empty-icon">📄</div>
          <h3>Brak CV</h3>
          <p>Dodaj swoje pierwsze CV, aby móc je przypisywać do aplikacji</p>
        </div>
      ) : (
        <div className="cv-layout">
          {/* Lewa kolumna - lista CV */}
          <div className="cv-list-panel">
            {renderGroup('Przesłane pliki', '📄', groupedCVs.FILE, 'FILE')}
            {renderGroup('Linki zewnętrzne', '🔗', groupedCVs.LINK, 'LINK')}
            {renderGroup('Na moim komputerze', '💻', groupedCVs.NOTE, 'NOTE')}
          </div>

          {/* Prawa kolumna - szczegóły */}
          <div className="cv-details-panel">
            {selectedCv ? (
              <>
                <div className="cv-details-header">
                  <h3>{selectedCv.originalFileName}</h3>
                </div>

                <div className="cv-details-info">
                  <div className="cv-detail-row">
                    <span className="cv-detail-label">Typ:</span>
                    <span className="cv-detail-value">
                      {selectedCv.type === 'FILE' || !selectedCv.type ? '📄 Plik PDF' :
                       selectedCv.type === 'LINK' ? '🔗 Link zewnętrzny' : '💻 Na komputerze'}
                    </span>
                  </div>
                  {(selectedCv.type === 'FILE' || !selectedCv.type) && selectedCv.fileSize && (
                    <div className="cv-detail-row">
                      <span className="cv-detail-label">Rozmiar:</span>
                      <span className="cv-detail-value">{formatSize(selectedCv.fileSize)}</span>
                    </div>
                  )}
                  {selectedCv.type === 'LINK' && selectedCv.externalUrl && (
                    <div className="cv-detail-row">
                      <span className="cv-detail-label">Link:</span>
                      <span className="cv-detail-value cv-link">{selectedCv.externalUrl}</span>
                    </div>
                  )}
                  <div className="cv-detail-row">
                    <span className="cv-detail-label">Dodano:</span>
                    <span className="cv-detail-value">{formatDate(selectedCv.uploadedAt)}</span>
                  </div>
                </div>

                <div className="cv-details-actions">
                  {(selectedCv.type === 'FILE' || !selectedCv.type) && (
                    <button className="cv-action-btn primary" onClick={() => handleOpen(selectedCv)}>
                      Pobierz
                    </button>
                  )}
                  {selectedCv.type === 'LINK' && selectedCv.externalUrl && (
                    <button className="cv-action-btn primary" onClick={() => handleOpen(selectedCv)}>
                      Otwórz link
                    </button>
                  )}
                  {selectedCv.type !== 'FILE' && selectedCv.type && (
                    <button className="cv-action-btn secondary" onClick={handleEditClick}>
                      Edytuj
                    </button>
                  )}
                  <button className="cv-action-btn danger" onClick={() => handleDelete(selectedCv.id)}>
                    Usuń
                  </button>
                </div>

                <div className="cv-assignments-section">
                  <div className="cv-assignments-header">
                    <h4>Przypisane do ({getAssignedApps(selectedCv.id).length})</h4>
                    <button
                      className="assign-btn"
                      onClick={() => {
                        setSelectedAppForAssign(null)
                        setShowAssignModal(true)
                      }}
                    >
                      + Przypisz
                    </button>
                  </div>

                  {getAssignedApps(selectedCv.id).length === 0 ? (
                    <p className="no-assignments">To CV nie jest przypisane do żadnej aplikacji</p>
                  ) : (
                    <div className="cv-assignments-list">
                      {getAssignedApps(selectedCv.id).map(app => (
                        <div key={app.id} className="cv-assignment-item">
                          <div className="assignment-info">
                            <div className="assignment-company">{app.company}</div>
                            <div className="assignment-position">{app.position}</div>
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveAssignment(app.id)}
                            title="Usuń przypisanie"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="cv-details-empty">
                <div className="empty-icon">👈</div>
                <p>Wybierz CV z listy, aby zobaczyć szczegóły</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal dodawania CV */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content add-cv-modal" onClick={e => e.stopPropagation()}>

            {addStep === 'choose' && (
              <>
                <h3>Jak chcesz dodać CV?</h3>
                <div className="add-cv-options">
                  <div className="add-cv-option" onClick={() => setAddStep('file')}>
                    <div className="option-icon">📁</div>
                    <div className="option-content">
                      <h4>Prześlij plik</h4>
                      <p>Zapisz plik PDF prywatnie w aplikacji</p>
                      <ul className="option-features">
                        <li>Przechowywanie lokalne</li>
                        <li>Tylko Ty masz dostęp</li>
                        <li>Usuń kiedy chcesz</li>
                      </ul>
                    </div>
                  </div>

                  <div className="add-cv-option" onClick={() => setAddStep('link')}>
                    <div className="option-icon">📝</div>
                    <div className="option-content">
                      <h4>Nie przesyłaj pliku</h4>
                      <p>Zapisz tylko informację, które CV wysłałeś</p>
                      <ul className="option-features">
                        <li>Podaj link do Drive/Dropbox</li>
                        <li>...lub tylko zanotuj nazwę pliku</li>
                        <li>Plik zostaje na Twoim komputerze</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={closeAddModal}>Anuluj</button>
                </div>
              </>
            )}

            {addStep === 'file' && (
              <>
                <button className="back-link" onClick={() => setAddStep('choose')}>
                  ← Wróć
                </button>
                <h3>Prześlij CV</h3>

                <div className="upload-area">
                  <label className="upload-dropzone">
                    <div className="dropzone-content">
                      <span className="dropzone-icon">📄</span>
                      <span className="dropzone-text">
                        {uploadCVMutation.isPending ? 'Wysyłanie...' : 'Kliknij lub przeciągnij plik PDF'}
                      </span>
                      <span className="dropzone-hint">Maksymalnie 5MB</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleUpload}
                      disabled={uploadCVMutation.isPending}
                      hidden
                    />
                  </label>
                </div>

                <div className="privacy-info">
                  <span className="privacy-icon">🔒</span>
                  <div>
                    <strong>Twój plik jest bezpieczny</strong>
                    <p>Zapisany lokalnie, tylko dla Ciebie. Możesz go usunąć w dowolnym momencie.</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={closeAddModal}>Anuluj</button>
                </div>
              </>
            )}

            {addStep === 'link' && (
              <>
                <button className="back-link" onClick={() => setAddStep('choose')}>
                  ← Wróć
                </button>
                <h3>Zapisz informację o CV</h3>

                <form onSubmit={handleCreateLinkOrNote} className="link-form">
                  <div className="form-group">
                    <label>Nazwa pliku CV *</label>
                    <input
                      type="text"
                      value={linkFormData.name}
                      onChange={(e) => setLinkFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="np. CV_Junior_Java_2026.pdf"
                      required
                    />
                    <span className="form-hint">
                      Wpisz nazwę pliku CV, który wysłałeś do tej firmy
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Gdzie masz ten plik?</label>
                    <div className="type-toggle">
                      <button
                        type="button"
                        className={linkFormData.type === 'LINK' ? 'active' : ''}
                        onClick={() => setLinkFormData(prev => ({ ...prev, type: 'LINK' }))}
                      >
                        🔗 W chmurze (mam link)
                      </button>
                      <button
                        type="button"
                        className={linkFormData.type === 'NOTE' ? 'active' : ''}
                        onClick={() => setLinkFormData(prev => ({ ...prev, type: 'NOTE' }))}
                      >
                        💻 Na moim komputerze
                      </button>
                    </div>
                  </div>

                  {linkFormData.type === 'LINK' && (
                    <div className="form-group">
                      <label>Link do CV</label>
                      <input
                        type="url"
                        value={linkFormData.externalUrl}
                        onChange={(e) => setLinkFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                      />
                      <span className="form-hint">
                        Wklej link do Google Drive, Dropbox, OneDrive itp.
                      </span>
                    </div>
                  )}

                  <div className="privacy-info">
                    <span className="privacy-icon">💡</span>
                    <div>
                      {linkFormData.type === 'LINK' ? (
                        <>
                          <strong>Plik zostaje w chmurze</strong>
                          <p>Zapisujemy tylko link. Pamiętaj o ustawieniu udostępniania!</p>
                        </>
                      ) : (
                        <>
                          <strong>Zapisujesz tylko nazwę pliku</strong>
                          <p>Dzięki temu będziesz wiedzieć, które CV wysłałeś do tej firmy.</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={closeAddModal}>Anuluj</button>
                    <button type="submit" className="primary">Zapisz</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal przypisania CV */}
      {showAssignModal && selectedCv && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Przypisz CV do aplikacji</h3>
            <p className="selected-cv-info">
              Wybrane CV: <strong>{selectedCv.originalFileName}</strong>
            </p>
            <p>Wybierz aplikację:</p>
            <div className="app-select-list">
              {applications.filter(app => app.cvId !== selectedCv.id).map(app => (
                <div
                  key={app.id}
                  className={`app-select-item ${selectedAppForAssign?.id === app.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAppForAssign(app)}
                >
                  <strong>{app.company}</strong>
                  <span>{app.position}</span>
                  {app.cvFileName && (
                    <span className="current-cv">Obecne CV: {app.cvFileName}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAssignModal(false)}>Anuluj</button>
              <button
                className="primary assign-confirm-btn"
                disabled={!selectedAppForAssign}
                onClick={handleAssign}
              >
                Przypisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edycji CV */}
      {showEditModal && selectedCv && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edytuj CV</h3>
            <form onSubmit={handleEditSubmit} className="link-form">
              <div className="form-group">
                <label>Nazwa CV *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="np. CV_Junior_Java_2026.pdf"
                  required
                />
              </div>

              {selectedCv.type === 'LINK' && (
                <div className="form-group">
                  <label>Link do CV</label>
                  <input
                    type="url"
                    value={editFormData.externalUrl}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              {selectedCv.type === 'FILE' && (
                <p className="form-hint edit-hint">
                  Możesz zmienić tylko nazwę wyświetlaną. Plik pozostaje bez zmian.
                </p>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>Anuluj</button>
                <button type="submit" className="primary">Zapisz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CVManager
