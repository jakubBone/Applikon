import { useState } from 'react'
import { NotesList } from '../notes/NotesList'
import { ApplicationForm } from './ApplicationForm'
import { downloadCV } from '../../services/api'
import { isSafeUrl } from '../../utils/urlValidator'
import { STATUS_CONFIG } from '../../constants/applicationStatus'
import type { Application } from '../../types/domain'

interface Props {
  application: Application
  onBack: () => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSalary(app: Application): string | null {
  if (!app.salaryMin) return null

  let salaryStr = app.salaryMin.toLocaleString('pl-PL')
  if (app.salaryMax) {
    salaryStr += ` - ${app.salaryMax.toLocaleString('pl-PL')}`
  }
  salaryStr += ` ${app.currency ?? 'PLN'}`

  const extras: string[] = []
  if (app.salaryType) extras.push(app.salaryType.toLowerCase())
  if (app.contractType) extras.push(app.contractType)
  if (extras.length > 0) {
    salaryStr += ` (${extras.join(', ')})`
  }

  return salaryStr
}

export function ApplicationDetails({ application, onBack }: Props) {
  const [showEditForm, setShowEditForm] = useState(false)

  const salary = formatSalary(application)

  return (
    <div className="details-view">
      <button className="back-btn" onClick={onBack}>
        ← Powrót
      </button>

      <div className="details-header">
        <div className="details-title">
          <div className="details-title-row">
            <h2>{application.company}</h2>
            <button className="edit-btn" onClick={() => setShowEditForm(true)}>
              ✏️ Edytuj
            </button>
          </div>
          <p className="details-position">{application.position}</p>
          <div className="status-info">
            <span
              className="status-badge large"
              style={{ backgroundColor: STATUS_CONFIG[application.status].color }}
            >
              {STATUS_CONFIG[application.status].label}
            </span>
            {application.currentStage && (
              <span className="current-stage-badge">{application.currentStage}</span>
            )}
          </div>
          <div className="details-actions">
            <button className="back-btn-mobile" onClick={onBack}>
              ← Powrót
            </button>
          </div>
        </div>
      </div>

      {showEditForm && (
        <ApplicationForm
          mode="edit"
          application={application}
          onClose={() => setShowEditForm(false)}
        />
      )}

      <div className="details-grid">
        <div className="details-info">
          <h3>Informacje</h3>
          <div className="info-list">
            {salary && (
              <div className="info-item">
                <span className="label">Zaproponowałeś wynagrodzenie:</span>
                <span className="value salary">{salary}</span>
              </div>
            )}
            {application.source && (
              <div className="info-item">
                <span className="label">Źródło:</span>
                <span className="value">{application.source}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Data aplikacji:</span>
              <span className="value">{formatDate(application.appliedAt)}</span>
            </div>
            {application.link && isSafeUrl(application.link) && (
              <div className="info-item">
                <span className="label">Link:</span>
                <a
                  href={application.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="value link"
                >
                  Zobacz ofertę
                </a>
              </div>
            )}
            {application.cvFileName && (
              <div className="info-item">
                <span className="label">CV:</span>
                <span className="value cv-value">
                  {application.cvFileName}
                  {application.cvType === 'FILE' && (
                    <button
                      className="cv-download-btn"
                      onClick={() => downloadCV(application.cvId!, application.cvFileName!)}
                    >
                      Pobierz
                    </button>
                  )}
                  {application.cvType === 'LINK' && application.cvExternalUrl && (
                    <button
                      className="cv-download-btn cv-link-btn"
                      onClick={() => window.open(application.cvExternalUrl!, '_blank')}
                    >
                      Otwórz
                    </button>
                  )}
                  {application.cvType === 'NOTE' && (
                    <span className="cv-note-hint">(lokalnie)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {application.jobDescription && (
            <div className="job-description">
              <h4>Treść ogłoszenia</h4>
              <pre className="job-description-content">{application.jobDescription}</pre>
            </div>
          )}
        </div>

        <div className="details-notes">
          <NotesList applicationId={application.id} />
        </div>
      </div>
    </div>
  )
}