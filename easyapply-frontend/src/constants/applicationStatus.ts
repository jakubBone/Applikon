import type { ApplicationStatus } from '../types/domain'

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  WYSLANE:   { label: 'Wysłane',           color: '#3498db', bg: '#ebf5fb' },
  W_PROCESIE:{ label: 'W procesie',         color: '#f39c12', bg: '#fef9e7' },
  OFERTA:    { label: 'Oferta otrzymana',   color: '#27ae60', bg: '#eafaf1' },
  ODMOWA:    { label: 'Odmowa',             color: '#95a5a6', bg: '#f5f5f5' },
}
