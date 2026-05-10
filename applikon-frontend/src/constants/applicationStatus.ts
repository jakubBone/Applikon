import type { ParseKeys } from 'i18next'
import type { ApplicationStatus } from '../types/domain'

export const STATUS_CONFIG: Record<ApplicationStatus, { labelKey: ParseKeys<'common'>; color: string; bg: string }> = {
  SENT:        { labelKey: 'statusConfig.SENT',        color: '#3498db', bg: '#ebf5fb' },
  IN_PROGRESS: { labelKey: 'statusConfig.IN_PROGRESS', color: '#f39c12', bg: '#fef9e7' },
  OFFER:       { labelKey: 'statusConfig.OFFER',       color: '#27ae60', bg: '#eafaf1' },
  REJECTED:    { labelKey: 'statusConfig.REJECTED',    color: '#95a5a6', bg: '#f5f5f5' },
}
