# Plan: Angielskie kody enum + bugfix ContractType

## Zasada pracy (każdy etap)

1. **Implementacja** — Claude robi zmiany
2. **Testy** — `mvn test` + `npm run test:run` — oba muszą być zielone
3. **Commit** — Claude proponuje w konwencji projektu
4. **Kontynuacja** — Claude pyta czy idziemy dalej

---

## Mapowanie starych → nowych wartości

### RejectionReason
| Stary kod | Nowy kod |
|-----------|----------|
| `BRAK_ODPOWIEDZI` | `NO_RESPONSE` |
| `ODMOWA_MAILOWA` | `EMAIL_REJECTION` |
| `ODRZUCENIE_PO_ROZMOWIE` | `REJECTED_AFTER_INTERVIEW` |
| `INNE` | `OTHER` |

### ApplicationStatus
| Stary kod | Nowy kod |
|-----------|----------|
| `WYSLANE` | `SENT` |
| `W_PROCESIE` | `IN_PROGRESS` |
| `OFERTA` | `OFFER` |
| `ODMOWA` | `REJECTED` |

> Legacy (V3 migration — prawdopodobnie już brak w DB, ale statusConfig je obsługuje):
> `ROZMOWA` → `IN_PROGRESS`, `ZADANIE` → `IN_PROGRESS`, `ODRZUCONE` → `REJECTED`

> `ZAKONCZONE` — wirtualny status tylko we froncie (Kanban łączy OFFER+REJECTED).
> Po rename: staje się `FINISHED` (string w STATUSES, nie w backend enum).

### NoteCategory
| Stary kod | Nowy kod |
|-----------|----------|
| `PYTANIA` | `QUESTIONS` |
| `FEEDBACK` | `FEEDBACK` _(bez zmian)_ |
| `INNE` | `OTHER` |
| `PYTANIE` (legacy) | `QUESTIONS` _(DB UPDATE + usunięcie z enum)_ |
| `KONTAKT` (legacy) | `OTHER` _(DB UPDATE + usunięcie z enum)_ |

### ContractType
| Stary kod | Nowy kod | Znaczenie |
|-----------|----------|-----------|
| `B2B` | `B2B` _(bez zmian)_ | Business-to-Business |
| `UOP` | `EMPLOYMENT` | Umowa o Pracę |
| `UZ` | `MANDATE` | Umowa Zlecenie |
| `INNA` | `OTHER` | Inna |

### SalaryType
| Stary kod | Nowy kod |
|-----------|----------|
| `BRUTTO` | `GROSS` |
| `NETTO` | `NET` |

---

## ✅ Etap 1 — RejectionReason — WYKONANY

### Backend
- [x] `entity/RejectionReason.java` — zmień wartości enum
- [x] `db/migration/V5__rename_rejection_reasons.sql` — Flyway UPDATE
- [x] `service/ApplicationService.java` — brak bezpośrednich referencji (pass-through)
- [x] `service/StatisticsService.java` — `BRAK_ODPOWIEDZI` → `NO_RESPONSE`
- [x] `repository/ApplicationRepository.java` — brak bezpośrednich referencji
- [x] testy: `ApplicationControllerTest`, `ApplicationServiceTest`, `StatisticsControllerTest`, `StatisticsServiceTest`

### Frontend
- [x] `types/domain.ts` — `RejectionReason` type naprawiony (był rozsynchronizowany z backendem)
- [x] `kanban/types.ts` — `REJECTION_REASONS` — zaktualizowane `id` wartości
- [x] `kanban/EndModal.tsx` — `'INNE'` → `'OTHER'`
- [x] `kanban/ApplicationCard.tsx` — brak bezpośrednich referencji (używa `REJECTION_REASONS`)

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

### Flyway V5
```sql
UPDATE applications SET rejection_reason = 'NO_RESPONSE'            WHERE rejection_reason = 'BRAK_ODPOWIEDZI';
UPDATE applications SET rejection_reason = 'EMAIL_REJECTION'         WHERE rejection_reason = 'ODMOWA_MAILOWA';
UPDATE applications SET rejection_reason = 'REJECTED_AFTER_INTERVIEW' WHERE rejection_reason = 'ODRZUCENIE_PO_ROZMOWIE';
UPDATE applications SET rejection_reason = 'OTHER'                   WHERE rejection_reason = 'INNE';
```

---

## ✅ Etap 2 — NoteCategory — WYKONANY

### Backend
- [x] `entity/NoteCategory.java` — `PYTANIA`→`QUESTIONS`, `INNE`→`OTHER`, usunięte legacy `PYTANIE`, `KONTAKT`
- [x] `entity/Note.java` — domyślna wartość `INNE` → `OTHER` (3 miejsca + column default)
- [x] `db/migration/V6__rename_note_categories.sql`
- [x] `dto/NoteRequest.java`, `dto/NoteResponse.java` — brak bezpośrednich referencji
- [x] `service/UserService.java` — brak referencji do NoteCategory
- [x] testy: `NoteControllerTest`, `NoteServiceTest`

### Frontend
- [x] `types/domain.ts` — `NoteCategory` type
- [x] `notes/NotesList.tsx` — `CATEGORIES` values + `LEGACY_CATEGORY_MAP` (dodano mapowania dla starych `PYTANIA`/`INNE` z DB)
- [x] `notes/NotesList.tsx` — domyślny `useState` `'PYTANIA'` → `'QUESTIONS'`

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

---

## ✅ Etap 3 — SalaryType — WYKONANY

### Backend
- [x] `entity/SalaryType.java` — `BRUTTO`→`GROSS`, `NETTO`→`NET`
- [x] `db/migration/V7__rename_salary_types.sql`
- [x] `service/UserService.java` — `SalaryType.NETTO` → `SalaryType.NET`
- [x] testy: `ApplicationControllerTest` (string literal), `ApplicationServiceTest` (enum ref)

### Frontend
- [x] `types/domain.ts` — `SalaryType` type
- [x] `components/applications/SalaryFormSection.tsx` — `value="BRUTTO/NETTO"` i `checked` porównania
- [x] `components/applications/ApplicationForm.tsx` — domyślna wartość `'BRUTTO'` → `'GROSS'`
- [x] `ApplicationTable.tsx`, `ApplicationDetails.tsx` — `salaryType.toLowerCase()` działa poprawnie (`'gross'`, `'net'`)

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

---

## ✅ Etap 4 — ContractType + bugfix wyświetlania — WYKONANY

### Backend
- [x] `entity/ContractType.java` — `UOP`→`EMPLOYMENT`, `UZ`→`MANDATE`, `INNA`→`OTHER`
- [x] `db/migration/V8__rename_contract_types.sql`
- [x] `service/UserService.java` — `ContractType.UOP` → `ContractType.EMPLOYMENT`
- [x] testy: `ApplicationServiceTest` (`ContractType.UOP` → `EMPLOYMENT`)

### Frontend — bugfix
- [x] `types/domain.ts` — naprawiony (był: `UOP|B2B|UZ|UOD|INNE`, teraz: `B2B|EMPLOYMENT|MANDATE|OTHER`)
- [x] `i18n/locales/en/common.json` — dodano `contractB2B`, `contractEmployment`, `contractMandate`, `contractOther`
- [x] `i18n/locales/pl/common.json` — odpowiedniki PL
- [x] `components/applications/SalaryFormSection.tsx` — `<option>` values zaktualizowane, etykiety przez `t()`
- [x] `components/applications/ApplicationTable.tsx` — inline `contractKeys` map, `t()` zamiast surowej wartości
- [x] `components/applications/ApplicationDetails.tsx` — `formatSalary` rozszerzone o `t: TFunction`, `CONTRACT_TYPE_KEYS` map

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

---

## ✅ Etap 5 — ApplicationStatus — WYKONANY

### Backend
- [x] `entity/ApplicationStatus.java` — WYSLANE→SENT, W_PROCESIE→IN_PROGRESS, OFERTA→OFFER, ODMOWA→REJECTED
- [x] `entity/Application.java` — domyślna wartość `WYSLANE` → `SENT`
- [x] `db/migration/V9__rename_application_statuses.sql` (incl. legacy ROZMOWA/ZADANIE/ODRZUCONE)
- [x] `service/ApplicationService.java` — wszystkie odwołania
- [x] `service/StatisticsService.java` — ODMOWA→REJECTED, OFERTA→OFFER
- [x] `service/UserService.java` — WYSLANE→SENT
- [x] testy: `ApplicationControllerTest`, `ApplicationServiceTest`, `StatisticsServiceTest`, `StatisticsControllerTest`, `NoteControllerTest`, `CVServiceTest`, `NoteServiceTest`

### Frontend
- [x] `types/domain.ts` — `ApplicationStatus` type
- [x] `constants/applicationStatus.ts` — STATUS_CONFIG klucze i labelKeys
- [x] `kanban/types.ts` — STATUSES ids i labelKeys
- [x] `kanban/KanbanBoard.tsx` — wszystkie literały (WYSLANE/W_PROCESIE/OFERTA/ODMOWA/ZAKONCZONE + legacy)
- [x] `kanban/ApplicationCard.tsx` — W_PROCESIE/OFFER/ODMOWA
- [x] `kanban/EndModal.tsx` — OFERTA/ODMOWA
- [x] `kanban/MoveModal.tsx` — OFERTA/ODMOWA/ZAKONCZONE
- [x] `applications/ApplicationTable.tsx` — usunięto legacy statusConfig entries, zaktualizowano fallback
- [x] `i18n/locales/en/common.json` — statusConfig i kanban klucze przemianowane, legacy usunięte
- [x] `i18n/locales/pl/common.json` — to samo
- [x] testy: `App.test.tsx`, `useApplications.test.tsx`

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

---

## ✅ Etap 6 — i18n key cleanup — WYKONANY

Rename kluczy JSON z PL-nych nazw na EN (bez zmian DB, tylko frontend):

| Stary klucz | Nowy klucz |
|-------------|------------|
| `notes.catPytania` | `notes.catQuestions` |
| `notes.catInne` | `notes.catOther` |
| `salary.brutto` | `salary.gross` |
| `salary.netto` | `salary.net` |
| `kanban.statusWYSLANE` | `kanban.statusSENT` _(już po Etapie 5)_ |
| `kanban.statusW_PROCESIE` | `kanban.statusIN_PROGRESS` _(już po Etapie 5)_ |
| `kanban.statusZAKONCZONE` | `kanban.statusFINISHED` _(już po Etapie 5)_ |
| `kanban.rejectionBrakOdpowiedzi` | `kanban.rejectionNoResponse` |
| `kanban.rejectionOdmowaMailowa` | `kanban.rejectionEmailRejection` |
| `kanban.rejectionOdrzuceniePo` | `kanban.rejectionAfterInterview` |
| `kanban.rejectionInne` | `kanban.rejectionOther` |
| `statusConfig.WYSLANE` | `statusConfig.SENT` _(już po Etapie 5)_ |
| `statusConfig.W_PROCESIE` | `statusConfig.IN_PROGRESS` _(już po Etapie 5)_ |
| `statusConfig.OFERTA` | `statusConfig.OFFER` _(już po Etapie 5)_ |
| `statusConfig.ODMOWA` | `statusConfig.REJECTED` _(już po Etapie 5)_ |

- [x] `en/common.json` + `pl/common.json` — rename kluczy
- [x] `notes/NotesList.tsx` — `CATEGORIES` i `LEGACY_CATEGORY_MAP` labelKey
- [x] `kanban/types.ts` — `REJECTION_REASONS` labelKey
- [x] `components/applications/SalaryFormSection.tsx` — `t('salary.brutto/netto')` → `t('salary.gross/net')`

### Wyniki testów
- `mvn test` — 84/84 ✅
- `npm run test:run` — 67/67 ✅

---

## Ważne uwagi

- **ZAKONCZONE** nigdy nie istnieje w backendzie — to wirtualna kolumna Kanbana łącząca `OFFER` i `REJECTED`
- **Legacy statusy** (`ROZMOWA`, `ZADANIE`, `ODRZUCONE`) po Etapie 5 można usunąć z `statusConfig` jeśli V9 migration jest już pewna (można to zrobić opcjonalnie w Etapie 5)
- **Frontend type mismatches** naprawione przy okazji każdego etapu (były: `ContractType` miał `UOD`/`INNE` zamiast `INNA`, `RejectionReason` miał zupełnie inne wartości niż backend)

---

*Stworzono: 2026-03-29*