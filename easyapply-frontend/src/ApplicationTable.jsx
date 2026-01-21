import { useState } from 'react'
import './ApplicationTable.css'

// Funkcja do generowania koloru na podstawie nazwy firmy
const getCompanyColor = (company) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF7F50', '#9370DB', '#20B2AA'
  ]
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Formatowanie daty (dd.mm.yyyy)
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Ile dni minęło
const getDaysSince = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Dzisiaj'
  if (diffDays === 1) return '1 dzień'
  return `${diffDays} dni`
}

const statusConfig = {
  'WYSLANE': { label: 'Wysłane', color: '#3498db', bg: '#ebf5fb' },
  'W_PROCESIE': { label: 'W procesie', color: '#f39c12', bg: '#fef9e7' },
  'OFERTA': { label: 'Oferta', color: '#27ae60', bg: '#eafaf1' },
  'ODMOWA': { label: 'Odmowa', color: '#95a5a6', bg: '#f5f5f5' },
  // Stare statusy (kompatybilność wsteczna)
  'ROZMOWA': { label: 'W procesie', color: '#f39c12', bg: '#fef9e7' },
  'ZADANIE': { label: 'W procesie', color: '#f39c12', bg: '#fef9e7' },
  'ODRZUCONE': { label: 'Odmowa', color: '#95a5a6', bg: '#f5f5f5' }
}

function ApplicationTable({ applications, onRowClick, onStatusChange, onDelete }) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [sortField, setSortField] = useState('appliedAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(applications.map(app => app.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id, e) => {
    e.stopPropagation()
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDeleteSelected = async () => {
    if (onDelete) {
      await onDelete(selectedIds)
      setSelectedIds(new Set())
      setShowDeleteConfirm(false)
    }
  }

  // Filtrowanie
  const filteredApplications = applications.filter(app => {
    // Filtr tekstowy
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        (app.source && app.source.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }
    // Filtr statusu
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false
    }
    return true
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (sortField === 'salaryMin') {
      aVal = aVal || 0
      bVal = bVal || 0
    }

    if (sortField === 'appliedAt') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Statystyki dla filtrów
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  const formatSalary = (app) => {
    if (!app.salaryMin) return '-'

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

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Szukaj po firmie, stanowisku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <div className="status-filters">
          <button
            className={`status-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Wszystkie ({applications.length})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = statusCounts[key] || 0
            if (count === 0) return null
            return (
              <button
                key={key}
                className={`status-filter-btn ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
                style={{ '--status-color': config.color }}
              >
                {config.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {filteredApplications.length !== applications.length && (
        <div className="filter-info">
          Wyświetlanie {filteredApplications.length} z {applications.length} aplikacji
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="selection-bar">
          <span className="selection-info">
            Zaznaczono: {selectedIds.size} {selectedIds.size === 1 ? 'aplikację' : selectedIds.size < 5 ? 'aplikacje' : 'aplikacji'}
          </span>
          <div className="selection-actions">
            <button
              className="action-btn delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Usuń zaznaczone
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Potwierdzenie usunięcia</h3>
            <p>
              Czy na pewno chcesz usunąć {selectedIds.size} {selectedIds.size === 1 ? 'aplikację' : selectedIds.size < 5 ? 'aplikacje' : 'aplikacji'}?
            </p>
            <p className="confirm-warning">Ta operacja jest nieodwracalna.</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Anuluj
              </button>
              <button
                className="confirm-btn delete"
                onClick={handleDeleteSelected}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="app-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedIds.size === applications.length && applications.length > 0}
              />
            </th>
            <th className="sortable" onClick={() => handleSort('company')}>
              <span className="th-content">
                <span className="th-icon">🏢</span>
                Firma
                {sortField === 'company' && (
                  <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </span>
            </th>
            <th className="sortable" onClick={() => handleSort('position')}>
              <span className="th-content">
                <span className="th-icon">💼</span>
                Stanowisko
                {sortField === 'position' && (
                  <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </span>
            </th>
            <th className="sortable" onClick={() => handleSort('salaryMin')}>
              <span className="th-content">
                <span className="th-icon">💰</span>
                Wynagrodzenie
                {sortField === 'salaryMin' && (
                  <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </span>
            </th>
            <th>
              <span className="th-content">
                <span className="th-icon">🔗</span>
                Źródło
              </span>
            </th>
            <th className="sortable" onClick={() => handleSort('appliedAt')}>
              <span className="th-content">
                <span className="th-icon">📅</span>
                Data
                {sortField === 'appliedAt' && (
                  <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </span>
            </th>
            <th>
              <span className="th-content">
                <span className="th-icon">⏱️</span>
                Dni temu
              </span>
            </th>
            <th className="sortable" onClick={() => handleSort('status')}>
              <span className="th-content">
                <span className="th-icon">📊</span>
                Status
                {sortField === 'status' && (
                  <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedApplications.map(app => {
            const status = statusConfig[app.status] || statusConfig['WYSLANE']
            const companyColor = getCompanyColor(app.company)

            return (
              <tr
                key={app.id}
                className={selectedIds.has(app.id) ? 'selected' : ''}
                onClick={() => onRowClick(app)}
              >
                <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={(e) => handleSelectRow(app.id, e)}
                  />
                </td>
                <td className="company-col">
                  <div className="company-cell">
                    <span
                      className="company-initial"
                      style={{ backgroundColor: companyColor }}
                    >
                      {app.company.charAt(0).toUpperCase()}
                    </span>
                    <span className="company-name">{app.company}</span>
                  </div>
                </td>
                <td className="position-col">{app.position}</td>
                <td className="salary-col">
                  <span className="salary-value">
                    {formatSalary(app)}
                  </span>
                </td>
                <td className="source-col">
                  {app.source ? (
                    <span className="source-link">{app.source}</span>
                  ) : (
                    <span className="no-source">-</span>
                  )}
                </td>
                <td className="date-col">
                  <span className="date-value">{formatDate(app.appliedAt)}</span>
                </td>
                <td className="days-col">
                  <span className="days-value">{getDaysSince(app.appliedAt)}</span>
                </td>
                <td className="status-col">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                      borderColor: status.color
                    }}
                  >
                    {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {sortedApplications.length === 0 && (
        <div className="empty-table">
          {applications.length === 0
            ? 'Brak aplikacji. Dodaj pierwszą!'
            : 'Brak wyników dla wybranych filtrów'}
        </div>
      )}
    </div>
  )
}

export default ApplicationTable
