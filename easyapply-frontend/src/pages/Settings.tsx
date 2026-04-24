import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Footer } from '../components/layout/Footer'
import { deleteAccount } from '../services/api'
import './Settings.css'

export function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleBack = () => {
    navigate('/dashboard')
  }
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showDeleteModal])

  const confirmWord = t('settings.deleteAccount.confirmWord') || 'DELETE'
  const isConfirmValid = confirmInput === confirmWord

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    setConfirmInput('')
    setError(null)
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      await deleteAccount()
      // Show success and clear app-specific local data before redirect
      alert(t('settings.deleteAccount.success') || 'Account deleted')
      // Clear only EasyApply-specific localStorage (preserve language settings, etc)
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('easyapply_') || key === 'tour_completed'
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
      // Small delay to ensure everything is cleared before redirect
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch {
      setError(t('settings.deleteAccount.error') || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  if (!user) {
    return <div>{t('app.loading')}</div>
  }

  const privacyAcceptedAt = user.privacyPolicyAcceptedAt
    ? new Date(user.privacyPolicyAcceptedAt).toLocaleDateString(
        t('settings.dateLocale') || 'pl-PL'
      )
    : '—'

  return (
    <div className="settings-page">
      <div className="settings-container">
        <button className="back-btn" onClick={handleBack}>
          {t('details.back')}
        </button>
        <h1>{t('settings.title')}</h1>

        <section className="settings-section">
          <h2>{t('settings.accountSection')}</h2>

          <div className="settings-field">
            <label>{t('settings.emailLabel')}</label>
            <input type="email" value={user.email} disabled readOnly />
          </div>

          <div className="settings-field">
            <label>{t('settings.privacyAcceptedAt')}</label>
            <div className="settings-field-value">{privacyAcceptedAt}</div>
          </div>
        </section>

        <section className="settings-section settings-danger">
          <h2>{t('settings.dangerZone')}</h2>

          <button
            onClick={handleDeleteClick}
            className="settings-delete-button"
          >
            {t('settings.deleteAccount.button')}
          </button>
        </section>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h2 className="settings-modal-title">
              {t('settings.deleteAccount.confirmTitle')}
            </h2>

            <div className="settings-modal-warning">
              {t('settings.deleteAccount.warning')}
            </div>

            <div className="settings-modal-field">
              <label>{t('settings.deleteAccount.confirmInputPrompt')}</label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmWord}
                disabled={isDeleting}
                className="settings-modal-input"
              />
            </div>

            {error && <div className="settings-modal-error">{error}</div>}

            <div className="settings-modal-buttons">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="settings-modal-cancel"
              >
                {t('settings.deleteAccount.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!isConfirmValid || isDeleting}
                className="settings-modal-confirm"
              >
                {isDeleting
                  ? t('app.loading')
                  : t('settings.deleteAccount.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
