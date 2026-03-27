import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <div className="salary-section">
      <label className="section-label">{t('salary.label')}</label>
      <span className="section-hint">{t('salary.hint')}</span>

      <div className="salary-row">
        <div className="salary-inputs">
          <input
            type="number"
            name="salaryMin"
            value={data.salaryMin}
            onChange={onChange}
            placeholder={data.isRange ? t('salary.from') : t('salary.amount')}
            min="0"
            className="salary-input"
          />
          {data.isRange && (
            <input
              type="number"
              name="salaryMax"
              value={data.salaryMax}
              onChange={onChange}
              placeholder={t('salary.to')}
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
          {t('salary.range')}
        </label>
      </div>

      <div className="salary-options">
        <div className="option-group">
          <label className="toggle-label">
            <input type="radio" name="salaryType" value="BRUTTO" checked={data.salaryType === 'BRUTTO'} onChange={onChange} />
            {t('salary.brutto')}
          </label>
          <label className="toggle-label">
            <input type="radio" name="salaryType" value="NETTO" checked={data.salaryType === 'NETTO'} onChange={onChange} />
            {t('salary.netto')}
          </label>
        </div>
        <select name="contractType" value={data.contractType} onChange={onChange} className="contract-select">
          <option value="">{t('salary.contractTypePlaceholder')}</option>
          <option value="B2B">B2B</option>
          <option value="UOP">UoP</option>
          <option value="UZ">{t('salary.uzLabel')}</option>
          <option value="INNA">{t('salary.otherLabel')}</option>
        </select>
      </div>
    </div>
  )
}
