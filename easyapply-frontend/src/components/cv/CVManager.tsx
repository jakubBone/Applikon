import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './CVManager.css'
import {
  assignCVToApplication,
  downloadCV
} from '../../services/api'
import { isSafeUrl } from '../../utils/urlValidator'
import { useCVs, useUploadCV, useCreateCV, useUpdateCV, useDeleteCV } from '../../hooks/useCV'
import type { Application, CV, CVType } from '../../types/domain'

interface Props {
  applications: Application[]
  onCVAssigned: () => void
}

function CVManager({ applications, onCVAssigned }: Props) {
  const { t } = useTranslation()
  const { t: tErrors } = useTranslation('errors')
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

  useEffect(() => {
    if (selectedCv) {
      const updated = cvList.find(cv => cv.id === selectedCv.id)
      setSelectedCv(updated ?? null)
    }
  }, [cvList])

  const groupedCVs = {
    FILE: cvList.filter(cv => cv.type === 'FILE' || !cv.type),
    LINK: cvList.filter(cv => cv.type === 'LINK'),
    NOTE: cvList.filter(cv => cv.type === 'NOTE')
  }

  const getHostname = (url: string | undefined): string => {
    if (!url) return t('cv.onComputer')
    try {
      return new URL(url).hostname || url
    } catch {
      return url
    }
  }

  const getUsageCount = (cvId: number): number => {
    return applications.filter(app => app.cvId === cvId).length
  }

  const getAssignedApps = (cvId: number): Application[] => {
    return applications.filter(app => app.cvId === cvId)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert(tErrors('cv.pdfOnly'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tErrors('cv.fileTooLarge'))
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
        alert(tErrors('cv.uploadError'))
      },
    })
  }

  const handleCreateLinkOrNote = (e: React.FormEvent) => {
    e.preventDefault()

    if (!linkFormData.name.trim()) {
      alert(tErrors('cv.nameRequired'))
      return
    }

    if (linkFormData.type === 'LINK' && !isSafeUrl(linkFormData.externalUrl)) {
      alert(tErrors('cv.invalidUrl'))
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
        alert(tErrors('cv.saveError'))
      },
    })
  }

  const handleOpen = async (cv: CV) => {
    if (cv.type === 'LINK' && isSafeUrl(cv.externalUrl)) {
      window.open(cv.externalUrl ?? undefined, '_blank')
    } else if (cv.type === 'FILE' || !cv.type) {
      downloadCV(cv.id, cv.originalFileName ?? cv.fileName ?? 'CV')
    }
  }

  const handleDelete = (cvId: number) => {
    if (!confirm(tErrors('cv.deleteConfirm'))) return

    deleteCVMutation.mutate(cvId, {
      onSuccess: () => {
        if (selectedCv?.id === cvId) {
          setSelectedCv(null)
        }
        onCVAssigned()
      },
      onError: () => {
        alert(tErrors('cv.deleteError'))
      },
    })
  }

  const handleAssign = async () => {
    if (!selectedAppForAssign || !selectedCv) return

    try {
      await assignCVToApplication(selectedAppForAssign.id, selectedCv.id)
      onCVAssigned()
      setShowAssignModal(false)
      setSelectedAppForAssign(null)
    } catch (error) {
      console.error('CV assignment error:', error)
    }
  }

  const handleRemoveAssignment = async (appId: number) => {
    if (!confirm(tErrors('cv.removeAssignConfirm'))) return

    try {
      await assignCVToApplication(appId, null)
      onCVAssigned()
    } catch (error) {
      console.error('CV assignment removal error:', error)
    }
  }

  const handleEditClick = () => {
    if (!selectedCv) return
    setEditFormData({
      name: selectedCv.originalFileName || '',
      externalUrl: selectedCv.externalUrl || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCv) return

    if (!editFormData.name.trim()) {
      alert(tErrors('cv.nameRequired'))
      return
    }

    if (selectedCv.type === 'LINK' && !isSafeUrl(editFormData.externalUrl)) {
      alert(tErrors('cv.invalidUrl'))
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
        alert(tErrors('cv.saveError'))
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
             cv.type === 'LINK' ? getHostname(cv.externalUrl ?? undefined) :
             t('cv.onComputer')}
            {' • '}
            {usageCount > 0 ? t('cv.usedTimes', { count: usageCount }) : t('cv.unused')}
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
        <h2>{t('cv.title')}</h2>
        <button data-cy="add-cv-btn" className="add-cv-btn" onClick={() => setShowAddModal(true)}>
          {t('cv.addBtn')}
        </button>
      </div>

      {cvList.length === 0 ? (
        <div className="cv-empty-state">
          <div className="empty-icon">📄</div>
          <h3>{t('cv.empty')}</h3>
          <p>{t('cv.emptyDesc')}</p>
        </div>
      ) : (
        <div className="cv-layout">
          <div className="cv-list-panel">
            {renderGroup(t('cv.groupFiles'), '📄', groupedCVs.FILE, 'FILE')}
            {renderGroup(t('cv.groupLinks'), '🔗', groupedCVs.LINK, 'LINK')}
            {renderGroup(t('cv.groupLocal'), '💻', groupedCVs.NOTE, 'NOTE')}
          </div>

          <div className="cv-details-panel">
            {selectedCv ? (
              <>
                <div className="cv-details-header">
                  <h3>{selectedCv.originalFileName}</h3>
                </div>

                <div className="cv-details-info">
                  <div className="cv-detail-row">
                    <span className="cv-detail-label">{t('cv.detailType')}</span>
                    <span className="cv-detail-value">
                      {selectedCv.type === 'FILE' || !selectedCv.type ? t('cv.detailTypePdf') :
                       selectedCv.type === 'LINK' ? t('cv.detailTypeLink') : t('cv.detailTypeLocal')}
                    </span>
                  </div>
                  {(selectedCv.type === 'FILE' || !selectedCv.type) && selectedCv.fileSize && (
                    <div className="cv-detail-row">
                      <span className="cv-detail-label">{t('cv.detailSize')}</span>
                      <span className="cv-detail-value">{formatSize(selectedCv.fileSize)}</span>
                    </div>
                  )}
                  {selectedCv.type === 'LINK' && selectedCv.externalUrl && (
                    <div className="cv-detail-row">
                      <span className="cv-detail-label">{t('cv.detailLink')}</span>
                      <span className="cv-detail-value cv-link">{selectedCv.externalUrl}</span>
                    </div>
                  )}
                  <div className="cv-detail-row">
                    <span className="cv-detail-label">{t('cv.detailAdded')}</span>
                    <span className="cv-detail-value">{formatDate(selectedCv.uploadedAt)}</span>
                  </div>
                </div>

                <div className="cv-details-actions">
                  {(selectedCv.type === 'FILE' || !selectedCv.type) && (
                    <button className="cv-action-btn primary" onClick={() => handleOpen(selectedCv)}>
                      {t('cv.download')}
                    </button>
                  )}
                  {selectedCv.type === 'LINK' && selectedCv.externalUrl && (
                    <button className="cv-action-btn primary" onClick={() => handleOpen(selectedCv)}>
                      {t('cv.openLink')}
                    </button>
                  )}
                  {selectedCv.type !== 'FILE' && selectedCv.type && (
                    <button className="cv-action-btn secondary" onClick={handleEditClick}>
                      {t('notes.edit')}
                    </button>
                  )}
                  <button className="cv-action-btn danger" onClick={() => handleDelete(selectedCv.id)}>
                    {t('cv.delete')}
                  </button>
                </div>

                <div className="cv-assignments-section">
                  <div className="cv-assignments-header">
                    <h4>{t('cv.assignHeader', { count: getAssignedApps(selectedCv.id).length })}</h4>
                    <button
                      className="assign-btn"
                      onClick={() => {
                        setSelectedAppForAssign(null)
                        setShowAssignModal(true)
                      }}
                    >
                      {t('cv.assign')}
                    </button>
                  </div>

                  {getAssignedApps(selectedCv.id).length === 0 ? (
                    <p className="no-assignments">{t('cv.unassigned')}</p>
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
                            title={t('cv.removeAssignment')}
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
                <p>{t('cv.selectHint')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add CV modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content add-cv-modal" onClick={e => e.stopPropagation()}>

            {addStep === 'choose' && (
              <>
                <h3>{t('cv.addModalTitle')}</h3>
                <div className="add-cv-options">
                  <div
                    className="add-cv-option add-cv-option--disabled"
                    aria-disabled="true"
                    title={t('cv.uploadDisabledTooltip')}
                  >
                    <div className="option-icon">🔒</div>
                    <div className="option-content">
                      <h4>{t('cv.uploadOptionTitle')}</h4>
                      <p>{t('cv.uploadOptionDesc')}</p>
                      <ul className="option-features">
                        <li>{t('cv.uploadFeature1')}</li>
                        <li>{t('cv.uploadFeature2')}</li>
                        <li>{t('cv.uploadFeature3')}</li>
                      </ul>
                    </div>
                  </div>

                  <div className="add-cv-option" onClick={() => setAddStep('link')}>
                    <div className="option-icon">📝</div>
                    <div className="option-content">
                      <h4>{t('cv.noteOptionTitle')}</h4>
                      <p>{t('cv.noteOptionDesc')}</p>
                      <ul className="option-features">
                        <li>{t('cv.noteFeature1')}</li>
                        <li>{t('cv.noteFeature2')}</li>
                        <li>{t('cv.noteFeature3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={closeAddModal}>{t('cv.cancel')}</button>
                </div>
              </>
            )}

            {addStep === 'file' && (
              <>
                <button className="back-link" onClick={() => setAddStep('choose')}>
                  {t('cv.uploadModalBack')}
                </button>
                <h3>{t('cv.uploadModalTitle')}</h3>

                <div className="upload-area">
                  <label className="upload-dropzone">
                    <div className="dropzone-content">
                      <span className="dropzone-icon">📄</span>
                      <span className="dropzone-text">
                        {uploadCVMutation.isPending ? t('cv.uploading') : t('cv.dropHint')}
                      </span>
                      <span className="dropzone-hint">{t('cv.maxSize')}</span>
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
                    <strong>{t('cv.secureTitle')}</strong>
                    <p>{t('cv.secureDesc')}</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={closeAddModal}>{t('cv.cancel')}</button>
                </div>
              </>
            )}

            {addStep === 'link' && (
              <>
                <button className="back-link" onClick={() => setAddStep('choose')}>
                  {t('cv.noteModalBack')}
                </button>
                <h3>{t('cv.noteModalTitle')}</h3>

                <form onSubmit={handleCreateLinkOrNote} className="link-form">
                  <div className="form-group">
                    <label>{t('cv.nameLabel')}</label>
                    <input
                      type="text"
                      value={linkFormData.name}
                      onChange={(e) => setLinkFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('cv.namePlaceholder')}
                      required
                    />
                    <span className="form-hint">{t('cv.nameHint')}</span>
                  </div>

                  <div className="form-group">
                    <label>{t('cv.locationLabel')}</label>
                    <div className="type-toggle">
                      <button
                        type="button"
                        className={linkFormData.type === 'LINK' ? 'active' : ''}
                        onClick={() => setLinkFormData(prev => ({ ...prev, type: 'LINK' }))}
                      >
                        {t('cv.cloudBtn')}
                      </button>
                      <button
                        type="button"
                        className={linkFormData.type === 'NOTE' ? 'active' : ''}
                        onClick={() => setLinkFormData(prev => ({ ...prev, type: 'NOTE' }))}
                      >
                        {t('cv.localBtn')}
                      </button>
                    </div>
                  </div>

                  {linkFormData.type === 'LINK' && (
                    <div className="form-group">
                      <label>{t('cv.linkLabel')}</label>
                      <input
                        type="url"
                        value={linkFormData.externalUrl}
                        onChange={(e) => setLinkFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                        placeholder={t('cv.linkPlaceholder')}
                      />
                      <span className="form-hint">{t('cv.linkHint')}</span>
                    </div>
                  )}

                  <div className="privacy-info">
                    <span className="privacy-icon">💡</span>
                    <div>
                      {linkFormData.type === 'LINK' ? (
                        <>
                          <strong>{t('cv.cloudInfoTitle')}</strong>
                          <p>{t('cv.cloudInfoDesc')}</p>
                        </>
                      ) : (
                        <>
                          <strong>{t('cv.localInfoTitle')}</strong>
                          <p>{t('cv.localInfoDesc')}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={closeAddModal}>{t('cv.cancel')}</button>
                    <button type="submit" className="primary">{t('cv.save')}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign CV modal */}
      {showAssignModal && selectedCv && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t('cv.assignModalTitle')}</h3>
            <p className="selected-cv-info">
              {selectedCv
                ? t('cv.assignSelected', { name: selectedCv.originalFileName })
                : t('cv.assignSelectedNone')}
            </p>
            <p>{t('cv.assignChooseApp')}</p>
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
                    <span className="current-cv">{t('cv.assignCurrentCv', { name: app.cvFileName })}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAssignModal(false)}>{t('cv.cancel')}</button>
              <button
                className="primary assign-confirm-btn"
                disabled={!selectedAppForAssign}
                onClick={handleAssign}
              >
                {t('cv.assignBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit CV modal */}
      {showEditModal && selectedCv && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t('cv.editModalTitle')}</h3>
            <form onSubmit={handleEditSubmit} className="link-form">
              <div className="form-group">
                <label>{t('cv.editNameLabel')}</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('cv.namePlaceholder')}
                  required
                />
              </div>

              {selectedCv.type === 'LINK' && (
                <div className="form-group">
                  <label>{t('cv.linkLabel')}</label>
                  <input
                    type="url"
                    value={editFormData.externalUrl}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                    placeholder={t('cv.linkPlaceholder')}
                  />
                </div>
              )}

              {selectedCv.type === 'FILE' && (
                <p className="form-hint edit-hint">{t('cv.editHint')}</p>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>{t('cv.cancel')}</button>
                <button type="submit" className="primary">{t('cv.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CVManager
