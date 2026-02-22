// ============================================================
// Typy domenowe EasyApply — odzwierciedlają odpowiedzi backendu
// ============================================================

export type ApplicationStatus = 'WYSLANE' | 'W_PROCESIE' | 'OFERTA' | 'ODMOWA'

export type ContractType = 'UOP' | 'B2B' | 'UZ' | 'UOD' | 'INNE'

export type SalaryType = 'BRUTTO' | 'NETTO'

export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP'

export type RejectionReason = 'BRAK_ODPOWIEDZI' | 'ODRZUCONO_CV' | 'ODRZUCONO_NA_ROZMOWIE' | 'WYCOFANIE' | 'INNE'

export type CVType = 'FILE' | 'LINK' | 'NOTE'

export type NoteCategory = 'PYTANIA' | 'FEEDBACK' | 'INNE'

// ============================================================
// Encje
// ============================================================

export interface StageHistory {
  id: number
  stageName: string
  completedAt: string | null
  createdAt: string
  completed: boolean
}

export interface Application {
  id: number
  company: string
  position: string
  status: ApplicationStatus
  currentStage: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: Currency | null
  salaryType: SalaryType | null
  contractType: ContractType | null
  source: string | null
  link: string | null
  jobDescription: string | null
  rejectionReason: RejectionReason | null
  appliedAt: string
  cvId: number | null
  stageHistory: StageHistory[]
}

export interface Note {
  id: number
  content: string
  category: NoteCategory
  applicationId: number
  createdAt: string
}

export interface CV {
  id: number
  fileName: string | null
  originalFileName: string | null
  fileSize: number | null
  uploadedAt: string | null
  type: CVType
  externalUrl: string | null
}

export interface User {
  id: string
  email: string
  name: string
}

// ============================================================
// Typy żądań (request bodies)
// ============================================================

export interface ApplicationRequest {
  company: string
  position: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: Currency | null
  salaryType?: SalaryType | null
  contractType?: ContractType | null
  source?: string | null
  link?: string | null
  jobDescription?: string | null
}

export interface StageUpdateRequest {
  stageName: string
  rejectionReason?: RejectionReason | null
  offerSalaryMin?: number | null
  offerSalaryMax?: number | null
}

// ============================================================
// Badge / statystyki
// ============================================================

// Odzwierciedla BadgeResponse.java z backendu
export interface BadgeInfo {
  name: string
  icon: string
  description: string
  threshold: number
  currentCount: number
  nextThreshold: number | null
  nextBadgeName: string | null
}

// Odzwierciedla BadgeStatsResponse.java z backendu
export interface BadgeStats {
  rejectionBadge: BadgeInfo | null
  ghostingBadge: BadgeInfo | null
  totalRejections: number
  totalGhosting: number
  totalOffers: number
  sweetRevengeUnlocked: boolean
}
