import type { ParseKeys } from 'i18next'
import type { ApplicationStatus } from '../types/domain'

export const STATUS_CONFIG: Record<ApplicationStatus, { labelKey: ParseKeys<'common'>; color: string; bg: string }> = {
  WYSLANE:   { labelKey: 'statusConfig.WYSLANE',   color: '#3498db', bg: '#ebf5fb' },
  W_PROCESIE:{ labelKey: 'statusConfig.W_PROCESIE', color: '#f39c12', bg: '#fef9e7' },
  OFERTA:    { labelKey: 'statusConfig.OFERTA',    color: '#27ae60', bg: '#eafaf1' },
  ODMOWA:    { labelKey: 'statusConfig.ODMOWA',    color: '#95a5a6', bg: '#f5f5f5' },
}
