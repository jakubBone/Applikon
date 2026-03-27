export const isMobile = () => window.innerWidth <= 768

export interface KanbanStatus {
  id: string
  labelKey: string
  color: string
}

export const STATUSES: KanbanStatus[] = [
  { id: 'WYSLANE', labelKey: 'kanban.statusWYSLANE', color: '#3498db' },
  { id: 'W_PROCESIE', labelKey: 'kanban.statusW_PROCESIE', color: '#f39c12' },
  { id: 'ZAKONCZONE', labelKey: 'kanban.statusZAKONCZONE', color: '#95a5a6' },
]

export const PREDEFINED_STAGES = [
  'Rozmowa z HR',
  'Rozmowa techniczna',
  'Rozmowa z managerem',
  'Zadanie rekrutacyjne',
  'Rozmowa finalna',
]

export const REJECTION_REASONS = [
  { id: 'BRAK_ODPOWIEDZI', labelKey: 'kanban.rejectionBrakOdpowiedzi' },
  { id: 'ODMOWA_MAILOWA', labelKey: 'kanban.rejectionOdmowaMailowa' },
  { id: 'ODRZUCENIE_PO_ROZMOWIE', labelKey: 'kanban.rejectionOdrzuceniePo' },
  { id: 'INNE', labelKey: 'kanban.rejectionInne' },
]
