import type { ParseKeys, TFunction } from 'i18next'

export const isMobile = () => window.innerWidth <= 768

export interface KanbanStatus {
  id: string
  labelKey: ParseKeys<'common'>
  color: string
}

export const STATUSES: KanbanStatus[] = [
  { id: 'WYSLANE', labelKey: 'kanban.statusWYSLANE', color: '#3498db' },
  { id: 'W_PROCESIE', labelKey: 'kanban.statusW_PROCESIE', color: '#f39c12' },
  { id: 'ZAKONCZONE', labelKey: 'kanban.statusZAKONCZONE', color: '#95a5a6' },
]

export const PREDEFINED_STAGES: { key: string; labelKey: ParseKeys<'common'> }[] = [
  { key: 'stage.hrInterview',        labelKey: 'stage.hrInterview' },
  { key: 'stage.technicalInterview', labelKey: 'stage.technicalInterview' },
  { key: 'stage.managerInterview',   labelKey: 'stage.managerInterview' },
  { key: 'stage.recruitmentTask',    labelKey: 'stage.recruitmentTask' },
  { key: 'stage.finalInterview',     labelKey: 'stage.finalInterview' },
]

// Maps legacy Polish DB values to i18n keys — no DB migration needed
const LEGACY_STAGE_MAP: Record<string, string> = {
  'Rozmowa z HR':         'stage.hrInterview',
  'Rozmowa techniczna':   'stage.technicalInterview',
  'Rozmowa z managerem':  'stage.managerInterview',
  'Zadanie rekrutacyjne': 'stage.recruitmentTask',
  'Rozmowa finalna':      'stage.finalInterview',
}

// Returns display string for any stored value (key, legacy Polish, or custom text)
export const translateStageName = (name: string | null | undefined, t: TFunction): string => {
  if (!name) return ''
  if (name.startsWith('stage.')) return t(name as ParseKeys<'common'>)
  const mappedKey = LEGACY_STAGE_MAP[name]
  if (mappedKey) return t(mappedKey as ParseKeys<'common'>)
  return name // custom stage — show as-is
}

// Returns canonical key for comparisons (active state in dropdown)
export const normalizeStageKey = (name: string | null | undefined): string => {
  if (!name) return ''
  if (name.startsWith('stage.')) return name
  return LEGACY_STAGE_MAP[name] ?? name
}

export const REJECTION_REASONS: { id: string; labelKey: ParseKeys<'common'> }[] = [
  { id: 'BRAK_ODPOWIEDZI', labelKey: 'kanban.rejectionBrakOdpowiedzi' },
  { id: 'ODMOWA_MAILOWA', labelKey: 'kanban.rejectionOdmowaMailowa' },
  { id: 'ODRZUCENIE_PO_ROZMOWIE', labelKey: 'kanban.rejectionOdrzuceniePo' },
  { id: 'INNE', labelKey: 'kanban.rejectionInne' },
]
