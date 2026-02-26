import type { Currency, SalaryType } from '../../types/domain'

export interface SalaryFormData {
  salaryMin: string
  salaryMax: string
  isRange: boolean
  currency: Currency
  salaryType: SalaryType
  contractType: string
}

interface Props {
  data: SalaryFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function SalaryFormSection({ data, onChange }: Props) {
  return (
    <div className="salary-section">
      <label className="section-label">Zaproponowałeś wynagrodzenie</label>
      <span className="section-hint">Kwota, którą zaproponowałeś/aś w aplikacji</span>

      <div className="salary-row">
        <div className="salary-inputs">
          <input
            type="number"
            name="salaryMin"
            value={data.salaryMin}
            onChange={onChange}
            placeholder={data.isRange ? 'Od' : 'Kwota'}
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
          <select name="currency" value={data.currency} onChange={onChange} className="currency-select">
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" name="isRange" checked={data.isRange} onChange={onChange} />
          Widełki
        </label>
      </div>

      <div className="salary-options">
        <div className="option-group">
          <label className="toggle-label">
            <input type="radio" name="salaryType" value="BRUTTO" checked={data.salaryType === 'BRUTTO'} onChange={onChange} />
            Brutto
          </label>
          <label className="toggle-label">
            <input type="radio" name="salaryType" value="NETTO" checked={data.salaryType === 'NETTO'} onChange={onChange} />
            Netto
          </label>
        </div>
        <select name="contractType" value={data.contractType} onChange={onChange} className="contract-select">
          <option value="">Typ umowy</option>
          <option value="B2B">B2B</option>
          <option value="UOP">UoP</option>
          <option value="UZ">Umowa zlecenie</option>
          <option value="INNA">Inna</option>
        </select>
      </div>
    </div>
  )
}
