import { useState } from 'react'
import { useCreateApplication, useUpdateApplication } from '../../hooks/useApplications'
import { checkDuplicate } from '../../services/api'
import { SalaryFormSection } from './SalaryFormSection'
import type { SalaryFormData } from './SalaryFormSection'
import type { Application } from '../../types/domain'

interface FormData extends SalaryFormData {
  company: string
  position: string
  source: string
  link: string
  jobDescription: string
}

interface DuplicateWarning {
  message: string
}

interface Props {
  mode: 'create' | 'edit'
  application?: Application
  onClose: () => void
}

const DEFAULT_FORM_DATA: FormData = {
  company: '',
  position: '',
  salaryMin: '',
  salaryMax: '',
  isRange: false,
  currency: 'PLN',
  salaryType: 'BRUTTO',
  contractType: '',
  source: '',
  link: '',
  jobDescription: '',
}

function toFormData(app: Application): FormData {
  return {
    company: app.company,
    position: app.position,
    salaryMin: app.salaryMin?.toString() ?? '',
    salaryMax: app.salaryMax?.toString() ?? '',
    isRange: app.salaryMax !== null,
    currency: app.currency ?? 'PLN',
    salaryType: app.salaryType ?? 'BRUTTO',
    contractType: app.contractType ?? '',
    source: app.source ?? '',
    link: app.link ?? '',
    jobDescription: app.jobDescription ?? '',
  }
}

function toApplicationRequest(data: FormData) {
  return {
    company: data.company,
    position: data.position,
    salaryMin: data.salaryMin ? parseInt(data.salaryMin) : null,
    salaryMax: data.isRange && data.salaryMax ? parseInt(data.salaryMax) : null,
    currency: data.currency,
    salaryType: data.salaryMin ? data.salaryType : null,
    contractType: data.contractType || null,
    source: data.source || null,
    link: data.link || null,
    jobDescription: data.jobDescription || null,
  }
}

export function ApplicationForm({ mode, application, onClose }: Props) {
  const [formData, setFormData] = useState<FormData>(
    mode === 'edit' && application ? toFormData(application) : DEFAULT_FORM_DATA
  )
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)

  const createApplication = useCreateApplication()
  const updateApplication = useUpdateApplication()
  const isPending = createApplication.isPending || updateApplication.isPending

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (name === 'company' || name === 'position') {
      setDuplicateWarning(null)
    }
  }

  const handleCheckDuplicate = async (): Promise<boolean> => {
    if (!formData.company.trim() || !formData.position.trim()) return true
    try {
      const duplicates = await checkDuplicate(formData.company, formData.position)
      if (duplicates.length > 0) {
        const lastApp = duplicates[0]
        const date = new Date(lastApp.appliedAt).toLocaleDateString('pl-PL')
        setDuplicateWarning({
          message: `Już aplikowałeś do ${lastApp.company} na stanowisko ${lastApp.position} (${date})`,
        })
        return false
      }
    } catch {
      // Nie blokuj wysyłania przy błędzie sprawdzania duplikatów
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'create' && !duplicateWarning) {
      const canProceed = await handleCheckDuplicate()
      if (!canProceed) return
    }

    const applicationData = toApplicationRequest(formData)

    if (mode === 'create') {
      createApplication.mutate(applicationData, { onSuccess: onClose })
    } else if (application) {
      updateApplication.mutate(
        { id: application.id, data: applicationData },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <div className="form-modal">
      <div className="form-modal-content large">
        <h2>{mode === 'create' ? 'Dodaj nową aplikację' : 'Edytuj aplikację'}</h2>

        {duplicateWarning && (
          <div className="duplicate-warning">
            <p>{duplicateWarning.message}</p>
            <p>Czy chcesz kontynuować?</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`${mode}-company`}>Firma *</label>
              <input
                type="text"
                id={`${mode}-company`}
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Nazwa firmy nie może być pusta')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="np. Google"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`${mode}-position`}>Stanowisko *</label>
              <input
                type="text"
                id={`${mode}-position`}
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Stanowisko nie może być puste')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="np. Junior Developer"
              />
            </div>
          </div>

          <SalaryFormSection data={formData} onChange={handleInputChange} />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`${mode}-source`}>Źródło</label>
              <input
                type="text"
                id={`${mode}-source`}
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                placeholder="np. LinkedIn, NoFluffJobs"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`${mode}-link`}>Link do oferty</label>
              <input
                type="url"
                id={`${mode}-link`}
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor={`${mode}-jobDescription`}>Treść ogłoszenia</label>
            <textarea
              id={`${mode}-jobDescription`}
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleInputChange}
              placeholder={mode === 'create' ? 'Wklej treść ogłoszenia (na wypadek gdy link wygaśnie)' : undefined}
              rows={8}
              className="job-description-textarea"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isPending}>
              Anuluj
            </button>
            <button type="submit" className="submit-btn" disabled={isPending}>
              {mode === 'create'
                ? duplicateWarning ? 'Kontynuuj mimo duplikatu' : 'Dodaj aplikację'
                : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
