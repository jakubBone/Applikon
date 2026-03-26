export const isMobile = () => window.innerWidth <= 768

export interface KanbanStatus {
  id: string
  label: string
  color: string
}

export const STATUSES: KanbanStatus[] = [
  { id: 'WYSLANE', label: 'Wysłane', color: '#3498db' },
  { id: 'W_PROCESIE', label: 'W procesie', color: '#f39c12' },
  { id: 'ZAKONCZONE', label: 'Zakończone', color: '#95a5a6' },
]

export const PREDEFINED_STAGES = [
  'Rozmowa z HR',
  'Rozmowa techniczna',
  'Rozmowa z managerem',
  'Zadanie rekrutacyjne',
  'Rozmowa finalna',
]

export const REJECTION_REASONS = [
  { id: 'BRAK_ODPOWIEDZI', label: 'Brak odpowiedzi' },
  { id: 'ODMOWA_MAILOWA', label: 'Odmowa mailowa' },
  { id: 'ODRZUCENIE_PO_ROZMOWIE', label: 'Odrzucenie po rozmowie' },
  { id: 'INNE', label: 'Inny powód' },
]
