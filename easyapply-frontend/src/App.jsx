import { useState, useEffect } from 'react'
import KanbanBoard from './KanbanBoard'
import CVManager from './CVManager'
import NotesList from './NotesList'
import ApplicationTable from './ApplicationTable'
import BadgeWidget from './BadgeWidget'
import { fetchApplications, createApplication, updateApplication, updateApplicationStatus, updateApplicationStage, checkDuplicate, deleteApplication } from './services/db'
import './App.css'

// Komponent formularza wynagrodzenia (musi być poza App, żeby uniknąć utraty focusu)
const SalaryFormSection = ({ data, onChange }) => (
  <div className="salary-section">
    <label className="section-label">Proponowane wynagrodzenie</label>
    <span className="section-hint">Kwota, którą zaproponowałeś/aś w aplikacji</span>
    <div className="salary-row">
      <div className="salary-inputs">
        <input
          type="number"
          name="salaryMin"
          value={data.salaryMin}
          onChange={onChange}
          placeholder={data.isRange ? "Od" : "Kwota"}
          min="0"
          className="salary-input"
        />
        {data.isRange && (
          <input
            type="number"
            name="salaryMax"
            value={data.salaryMax}
            onChange={onChange}
            placeholder="Do"
            min="0"
            className="salary-input"
          />
        )}
        <select
          name="currency"
          value={data.currency}
          onChange={onChange}
          className="currency-select"
        >
          <option value="PLN">PLN</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="isRange"
          checked={data.isRange}
          onChange={onChange}
        />
        Widełki
      </label>
    </div>

    <div className="salary-options">
      <div className="option-group">
        <label className="toggle-label">
          <input
            type="radio"
            name="salaryType"
            value="BRUTTO"
            checked={data.salaryType === 'BRUTTO'}
            onChange={onChange}
          />
          Brutto
        </label>
        <label className="toggle-label">
          <input
            type="radio"
            name="salaryType"
            value="NETTO"
            checked={data.salaryType === 'NETTO'}
            onChange={onChange}
          />
          Netto
        </label>
      </div>

      <select
        name="contractType"
        value={data.contractType}
        onChange={onChange}
        className="contract-select"
      >
        <option value="">Typ umowy</option>
        <option value="B2B">B2B</option>
        <option value="UOP">UoP</option>
        <option value="UZ">Umowa zlecenie</option>
        <option value="INNA">Inna</option>
      </select>
    </div>
  </div>
)

function App() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [previousView, setPreviousView] = useState('kanban')
  const [showForm, setShowForm] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [formData, setFormData] = useState({
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
    jobDescription: ''
  })

  const loadApplications = async () => {
    try {
      const data = await fetchApplications()
      setApplications(data)
    } catch (error) {
      console.error('Błąd pobierania aplikacji:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleStatusChange = async (applicationId, newStatus) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    )

    try {
      await updateApplicationStatus(applicationId, newStatus)
    } catch (error) {
      console.error('Błąd zmiany statusu:', error)
      loadApplications()
    }
  }

  const handleStageChange = async (applicationId, stageData) => {
    // Optymistyczna aktualizacja UI
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? {
              ...app,
              status: stageData.status,
              currentStage: stageData.currentStage,
              // Wyczyść dane odmowy przy przejściu do W_PROCESIE lub WYSLANE
              ...(stageData.status === 'W_PROCESIE' || stageData.status === 'WYSLANE' ? {
                rejectionReason: null,
                rejectionDetails: null
              } : {})
            }
          : app
      )
    )

    try {
      const updatedApp = await updateApplicationStage(applicationId, stageData)
      // Zaktualizuj z danymi z serwera (w tym historią etapów)
      setApplications(prev =>
        prev.map(app => app.id === applicationId ? updatedApp : app)
      )
    } catch (error) {
      console.error('Błąd zmiany etapu:', error)

      // Pokaż komunikat użytkownikowi
      alert('Nie udało się zmienić statusu aplikacji. Sprawdź połączenie z internetem i spróbuj ponownie.')

      loadApplications()
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (name === 'company' || name === 'position') {
      setDuplicateWarning(null)
    }
  }

  const handleCheckDuplicate = async () => {
    if (!formData.company.trim() || !formData.position.trim()) return true

    try {
      const duplicates = await checkDuplicate(formData.company, formData.position)
      if (duplicates.length > 0) {
        const lastApp = duplicates[0]
        const date = new Date(lastApp.appliedAt).toLocaleDateString('pl-PL')
        setDuplicateWarning({
          message: `Już aplikowałeś do ${lastApp.company} na stanowisko ${lastApp.position} (${date})`,
          duplicates
        })
        return false
      }
    } catch (error) {
      console.error('Błąd sprawdzania duplikatów:', error)
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!duplicateWarning) {
      const canProceed = await handleCheckDuplicate()
      if (!canProceed) return
    }

    const applicationData = {
      company: formData.company,
      position: formData.position,
      salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
      salaryMax: formData.isRange && formData.salaryMax ? parseInt(formData.salaryMax) : null,
      currency: formData.currency,
      salaryType: formData.salaryMin ? formData.salaryType : null,
      contractType: formData.contractType || null,
      source: formData.source,
      link: formData.link,
      jobDescription: formData.jobDescription
    }

    try {
      const newApplication = await createApplication(applicationData)
      setApplications(prev => [newApplication, ...prev])
      setFormData({
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
        jobDescription: ''
      })
      setShowForm(false)
      setDuplicateWarning(null)
    } catch (error) {
      console.error('Błąd dodawania aplikacji:', error)
    }
  }

  const handleViewDetails = (app) => {
    setPreviousView(view)
    setSelectedApp(app)
    setView('details')
  }

  const handleBackToList = () => {
    setSelectedApp(null)
    setView(previousView)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSalary = (app) => {
    if (!app.salaryMin) return null

    let salaryStr = app.salaryMin.toLocaleString('pl-PL')
    if (app.salaryMax) {
      salaryStr += ` - ${app.salaryMax.toLocaleString('pl-PL')}`
    }
    salaryStr += ` ${app.currency || 'PLN'}`

    const extras = []
    if (app.salaryType) extras.push(app.salaryType.toLowerCase())
    if (app.contractType) extras.push(app.contractType)

    if (extras.length > 0) {
      salaryStr += ` (${extras.join(', ')})`
    }

    return salaryStr
  }

  const getStatusColor = (status) => {
    const colors = {
      'WYSLANE': '#3498db',
      'W_PROCESIE': '#f39c12',
      'OFERTA': '#27ae60',
      'ODMOWA': '#95a5a6'
    }
    return colors[status] || '#95a5a6'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'WYSLANE': 'Wysłane',
      'W_PROCESIE': 'W procesie',
      'OFERTA': 'Oferta otrzymana',
      'ODMOWA': 'Odmowa'
    }
    return labels[status] || status
  }

  const handleEditClick = () => {
    setEditFormData({
      company: selectedApp.company || '',
      position: selectedApp.position || '',
      salaryMin: selectedApp.salaryMin || '',
      salaryMax: selectedApp.salaryMax || '',
      isRange: !!selectedApp.salaryMax,
      currency: selectedApp.currency || 'PLN',
      salaryType: selectedApp.salaryType || 'BRUTTO',
      contractType: selectedApp.contractType || '',
      source: selectedApp.source || '',
      link: selectedApp.link || '',
      jobDescription: selectedApp.jobDescription || ''
    })
    setShowEditForm(true)
  }

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    const applicationData = {
      company: editFormData.company,
      position: editFormData.position,
      salaryMin: editFormData.salaryMin ? parseInt(editFormData.salaryMin) : null,
      salaryMax: editFormData.isRange && editFormData.salaryMax ? parseInt(editFormData.salaryMax) : null,
      currency: editFormData.currency,
      salaryType: editFormData.salaryMin ? editFormData.salaryType : null,
      contractType: editFormData.contractType || null,
      source: editFormData.source,
      link: editFormData.link,
      jobDescription: editFormData.jobDescription
    }

    try {
      const updatedApp = await updateApplication(selectedApp.id, applicationData)
      setApplications(prev =>
        prev.map(app => app.id === selectedApp.id ? updatedApp : app)
      )
      setSelectedApp(updatedApp)
      setShowEditForm(false)
      setEditFormData(null)
    } catch (error) {
      console.error('Błąd aktualizacji aplikacji:', error)
      alert('Nie udało się zaktualizować aplikacji')
    }
  }

  const handleDeleteApplications = async (ids) => {
    try {
      await Promise.all([...ids].map(id => deleteApplication(id)))
      setApplications(prev => prev.filter(app => !ids.has(app.id)))
    } catch (error) {
      console.error('Błąd usuwania aplikacji:', error)
      alert('Nie udało się usunąć niektórych aplikacji')
      loadApplications()
    }
  }

  return (
    <div className="app">
        <header className="header">
          <div className="header-left">
            <div className="header-brand">
              <img src="/vite.svg" alt="EasyApply logo" className="logo" />
              <h1>EasyApply</h1>
            </div>
            <p className="header-tagline">Przejmij kontrolę nad chaosem w rekrutacji!</p>
          </div>
          <BadgeWidget refreshTrigger={applications} />
        </header>

      {view !== 'details' && (
        <div className="toolbar">
          <div className="view-tabs">
            <button
              className={`tab-btn ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
            >
              Kanban
            </button>
            <button
              className={`tab-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              Lista
            </button>
            <button
              className={`tab-btn ${view === 'cv' ? 'active' : ''}`}
              onClick={() => setView('cv')}
            >
              CV
            </button>
          </div>
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zamknij' : '+ Dodaj aplikację'}
          </button>
        </div>
      )}

      {/* Modal formularza dodawania */}
      {showForm && (
        <div className="form-modal">
          <div className="form-modal-content large">
            <h2>Dodaj nową aplikację</h2>

            {duplicateWarning && (
              <div className="duplicate-warning">
                <p>{duplicateWarning.message}</p>
                <p>Czy chcesz kontynuować?</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="application-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company">Firma *</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    placeholder="np. Google"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Stanowisko *</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    placeholder="np. Junior Developer"
                  />
                </div>
              </div>

              <SalaryFormSection data={formData} onChange={handleInputChange} />

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source">Źródło</label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="np. LinkedIn, NoFluffJobs"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="link">Link do oferty</label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="jobDescription">Treść ogłoszenia</label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Wklej treść ogłoszenia (na wypadek gdy link wygaśnie)"
                  rows={8}
                  className="job-description-textarea"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowForm(false)
                  setDuplicateWarning(null)
                }}>
                  Anuluj
                </button>
                <button type="submit" className="submit-btn">
                  {duplicateWarning ? 'Kontynuuj mimo duplikatu' : 'Dodaj aplikację'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="main-content">
        {loading ? (
          <p className="loading">Ładowanie...</p>
        ) : view === 'details' && selectedApp ? (
          <div className="details-view">
            <button className="back-btn" onClick={handleBackToList}>
              ← Powrót
            </button>

            <div className="details-header">
              <div className="details-title">
                <h2>{selectedApp.company}</h2>
                <div className="status-info">
                  <span
                    className="status-badge large"
                    style={{ backgroundColor: getStatusColor(selectedApp.status) }}
                  >
                    {getStatusLabel(selectedApp.status)}
                  </span>
                  {selectedApp.currentStage && (
                    <span className="current-stage-badge">
                      {selectedApp.currentStage}
                    </span>
                  )}
                </div>
                <button className="edit-btn" onClick={handleEditClick}>
                  Edytuj
                </button>
              </div>
              <p className="details-position">{selectedApp.position}</p>
            </div>

            {/* Modal edycji */}
            {showEditForm && editFormData && (
              <div className="form-modal">
                <div className="form-modal-content large">
                  <h2>Edytuj aplikację</h2>
                  <form onSubmit={handleEditSubmit} className="application-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-company">Firma *</label>
                        <input
                          type="text"
                          id="edit-company"
                          name="company"
                          value={editFormData.company}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-position">Stanowisko *</label>
                        <input
                          type="text"
                          id="edit-position"
                          name="position"
                          value={editFormData.position}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                    </div>

                    <SalaryFormSection data={editFormData} onChange={handleEditInputChange} />

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-source">Źródło</label>
                        <input
                          type="text"
                          id="edit-source"
                          name="source"
                          value={editFormData.source}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-link">Link do oferty</label>
                        <input
                          type="url"
                          id="edit-link"
                          name="link"
                          value={editFormData.link}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="edit-jobDescription">Treść ogłoszenia</label>
                      <textarea
                        id="edit-jobDescription"
                        name="jobDescription"
                        value={editFormData.jobDescription}
                        onChange={handleEditInputChange}
                        rows={8}
                        className="job-description-textarea"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={() => {
                        setShowEditForm(false)
                        setEditFormData(null)
                      }}>
                        Anuluj
                      </button>
                      <button type="submit" className="submit-btn">
                        Zapisz zmiany
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="details-grid">
              <div className="details-info">
                <h3>Informacje</h3>
                <div className="info-list">
                  {formatSalary(selectedApp) && (
                    <div className="info-item">
                      <span className="label">Proponowane wynagrodzenie:</span>
                      <span className="value salary">{formatSalary(selectedApp)}</span>
                    </div>
                  )}
                  {selectedApp.source && (
                    <div className="info-item">
                      <span className="label">Źródło:</span>
                      <span className="value">{selectedApp.source}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Data aplikacji:</span>
                    <span className="value">{formatDate(selectedApp.appliedAt)}</span>
                  </div>
                  {selectedApp.link && (
                    <div className="info-item">
                      <span className="label">Link:</span>
                      <a href={selectedApp.link} target="_blank" rel="noopener noreferrer" className="value link">
                        Zobacz ofertę
                      </a>
                    </div>
                  )}
                  {selectedApp.cvFileName && (
                    <div className="info-item">
                      <span className="label">CV:</span>
                      <span className="value cv-value">
                        {selectedApp.cvFileName}
                        {selectedApp.cvType === 'FILE' && (
                          <button
                            className="cv-download-btn"
                            onClick={() => window.open(`http://localhost:8080/api/cv/${selectedApp.cvId}/download`, '_blank')}
                          >
                            Pobierz
                          </button>
                        )}
                        {selectedApp.cvType === 'LINK' && selectedApp.cvExternalUrl && (
                          <button
                            className="cv-download-btn cv-link-btn"
                            onClick={() => window.open(selectedApp.cvExternalUrl, '_blank')}
                          >
                            Otwórz
                          </button>
                        )}
                        {selectedApp.cvType === 'NOTE' && (
                          <span className="cv-note-hint">(lokalnie)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {selectedApp.jobDescription && (
                  <div className="job-description">
                    <h4>Treść ogłoszenia</h4>
                    <pre className="job-description-content">{selectedApp.jobDescription}</pre>
                  </div>
                )}
              </div>

              <div className="details-notes">
                <NotesList applicationId={selectedApp.id} />
              </div>
            </div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            applications={applications}
            onStatusChange={handleStatusChange}
            onStageChange={handleStageChange}
            onCardClick={handleViewDetails}
          />
        ) : view === 'cv' ? (
          <CVManager
            applications={applications}
            onCVAssigned={loadApplications}
          />
        ) : (
          <ApplicationTable
            applications={applications}
            onRowClick={handleViewDetails}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteApplications}
          />
        )}
      </main>
    </div>
  )
}

export default App
// force rebuild

