# Plan usunięcia stage_history — EasyApply

## Problem

Funkcjonalność `stage_history` jest zaimplementowana w backendzie i frontendzie,
ale **nigdy nie jest wyświetlana użytkownikowi** — żaden komponent UI jej nie renderuje.

Backend zapisuje historię etapów (kiedy była HR rozmowa, kiedy technical interview itd.),
frontend otrzymuje te dane w każdej odpowiedzi `/api/applications`, ale je ignoruje.

**Wniosek:** to overengineering. Dane są zbierane, zajmują miejsce w bazie i komplikują kod,
ale nie dostarczają żadnej wartości użytkownikowi.

---

## Analiza użycia — gdzie stage_history istnieje w kodzie

### Backend — pliki do zmiany

| Plik | Co jest | Co zrobić |
|------|---------|-----------|
| `entity/StageHistory.java` | Encja JPA — mapuje tabelę `stage_history` | Usunąć plik |
| `repository/StageHistoryRepository.java` | Repo z `findByApplicationIdOrderByCreatedAtAsc`, `deleteByApplicationId` | Usunąć plik |
| `dto/StageHistoryResponse.java` | DTO zwracane w `ApplicationResponse` | Usunąć plik |
| `entity/Application.java` | Pole `List<StageHistory> stageHistory` z `@OneToMany`, getter, `addStageHistory()` | Usunąć pole i metody |
| `dto/ApplicationResponse.java` | Pole `List<StageHistoryResponse> stageHistory`, mapowanie w `fromEntity()` | Usunąć pole i mapowanie |
| `service/ApplicationService.java` | `stageHistoryRepository` (wstrzykiwany), `markCurrentStageCompleted()`, wywołania `stageHistoryRepository.save/delete` w `create()`, `addStage()`, `updateStage()` | Usunąć wszystkie użycia i metodę prywatną |
| `service/UserService.java` | `stageHistoryRepository` (wstrzykiwany), `stageHistoryRepository.save(initialStage)` przy tworzeniu demo aplikacji | Usunąć wszystkie użycia |
| `repository/ApplicationRepository.java` | `@EntityGraph(attributePaths = {"stageHistory"})` i metoda `findByUserIdWithStageHistory` | Usunąć `@EntityGraph` i zastąpić metodę standardowym `findByUserId` |
| `db/migration/` | Tabela `stage_history` zdefiniowana w `V1__init_schema.sql` | Dodać nową migrację `V5__drop_stage_history.sql` |

### Backend — pliki do zmiany w testach

| Plik | Co jest | Co zrobić |
|------|---------|-----------|
| `service/ApplicationServiceTest.java` | Mock `stageHistoryRepository`, test `updateStage_toInProgress_withCurrentStage_savesStageHistory` (dodany w tej sesji), weryfikacje `verify(stageHistoryRepository)` | Usunąć mock i wszystkie weryfikacje |
| `controller/ApplicationControllerTest.java` | `jsonPath("$.stageHistory").isArray()` i `jsonPath("$.stageHistory[?...]").exists()` | Usunąć asercje |

### Frontend — pliki do zmiany

| Plik | Co jest | Co zrobić |
|------|---------|-----------|
| `types/domain.ts` | Interface `StageHistory` (linie 23-27), pole `stageHistory: StageHistory[]` w `ApplicationResponse` (linia 51) | Usunąć interface i pole |

### Frontend — pliki NIE do zmiany (sprawdzone)

Następujące pliki mają `stageHistory` lub `currentStage` w nazwie/kodzie — **sprawdzone, nie wymagają zmian:**

| Plik | Dlaczego nie ruszamy |
|------|---------------------|
| `StageModal.tsx` | Używa `currentStage` (pole na encji Application) — to osobna rzecz, nie historia |
| `KanbanBoard.tsx` | Używa `currentStage` — nie używa `stageHistory` |
| `ApplicationCard.tsx` | Używa `currentStage` — nie używa `stageHistory` |

---

## Co NIE zmienia się dla użytkownika

- Kanban board działa tak samo — etapy (drag&drop) opierają się na polu `currentStage` w encji `Application`, nie na historii
- Zmiana statusów (WYSLANE → W_PROCESIE → OFERTA/ODMOWA) działa tak samo
- Widok szczegółów aplikacji działa tak samo
- Żadna widoczna funkcjonalność nie zniknie — bo żadna widoczna funkcjonalność tego nie używa

---

## Ryzyka

| Ryzyko | Poziom | Mitygacja |
|--------|--------|-----------|
| Migracja DROP TABLE jest nieodwracalna | Średni | Dane i tak są bezużyteczne (frontend nigdy ich nie wyświetlał). Zrób backup bazy przed wykonaniem. |
| Pominięcie jakiegoś użycia w kodzie → błąd kompilacji | Niski | Kompilacja (`mvn compile`) złapie to przed deploymentem |
| Test który przestaje kompilować | Niski | `mvn test` łapie wszystkie |
| `findByUserIdWithStageHistory` jest używana w serwisie — po zmianie na `findByUserId` trzeba sprawdzić czy lazy loading nie psuje serializacji | Średni | Opisane w kroku 6 poniżej |

---

## Plan wykonania (krok po kroku)

Każdy krok kończy się `mvn test` — nie przechodzimy dalej jeśli testy są czerwone.

### Krok 1 — Migracja bazy: DROP TABLE
- [ ] Dodać `V5__drop_stage_history.sql`:
  ```sql
  ALTER TABLE applications DROP CONSTRAINT IF EXISTS fk_applications_stage_history;
  ALTER TABLE cvs DROP CONSTRAINT IF EXISTS fk_cvs_stage_history;
  DROP TABLE IF EXISTS stage_history;
  ```
- [ ] `mvn compile` — sprawdzić czy Flyway nie krzyczy

### Krok 2 — Usunąć pliki
- [ ] Usunąć `entity/StageHistory.java`
- [ ] Usunąć `repository/StageHistoryRepository.java`
- [ ] Usunąć `dto/StageHistoryResponse.java`
- [ ] `mvn compile` — będą błędy (użycia w innych plikach), to oczekiwane

### Krok 3 — Posprzątać `Application.java`
- [ ] Usunąć `import StageHistory`
- [ ] Usunąć pole `List<StageHistory> stageHistory`
- [ ] Usunąć getter `getStageHistory()`
- [ ] Usunąć metodę `addStageHistory()`
- [ ] `mvn compile`

### Krok 4 — Posprzątać `ApplicationResponse.java`
- [ ] Usunąć `import StageHistoryResponse`
- [ ] Usunąć pole `List<StageHistoryResponse> stageHistory` z rekordu
- [ ] Usunąć mapowanie `application.getStageHistory()...` w `fromEntity()`
- [ ] `mvn compile`

### Krok 5 — Posprzątać `ApplicationService.java`
- [ ] Usunąć `import StageHistoryRepository` i `import StageHistory`
- [ ] Usunąć pole `stageHistoryRepository` i jego wstrzykiwanie w konstruktorze
- [ ] Usunąć metodę `markCurrentStageCompleted()`
- [ ] W `create()`: usunąć `stageHistoryRepository.save(new StageHistory(...))`
- [ ] W `addStage()`: usunąć wywołanie `markCurrentStageCompleted(application)` i `stageHistoryRepository.save(...)`
- [ ] W `updateStage()`: usunąć `stageHistoryRepository.deleteByApplicationId(...)` i `stageHistoryRepository.save(...)` (dodane w tej sesji)
- [ ] `mvn compile`

### Krok 6 — Posprzątać `ApplicationRepository.java` i `UserService.java`
- [ ] W `ApplicationRepository`: usunąć `@EntityGraph`, usunąć metodę `findByUserIdWithStageHistory`, dodać zwykłe `findByUserId` (lub sprawdzić czy już istnieje)
- [ ] W `ApplicationService.findAllByUserId()`: zmienić wywołanie na `findByUserId`
- [ ] W `UserService`: usunąć `import StageHistoryRepository` i `import StageHistory`, usunąć pole i wstrzyknięcie w konstruktorze, usunąć `stageHistoryRepository.save(initialStage)`
- [ ] `mvn compile`

### Krok 7 — Posprzątać testy
- [ ] W `ApplicationServiceTest`: usunąć mock `stageHistoryRepository`, usunąć test `updateStage_toInProgress_withCurrentStage_savesStageHistory`, usunąć wszystkie `verify(stageHistoryRepository)`
- [ ] W `ApplicationControllerTest`: usunąć asercje `$.stageHistory`
- [ ] `mvn test` — musi być zielony

### Krok 8 — Frontend
- [ ] W `domain.ts`: usunąć interface `StageHistory`, usunąć pole `stageHistory` z `ApplicationResponse`
- [ ] Sprawdzić czy TypeScript się kompiluje (`npm run build` lub `tsc --noEmit`)

---

## Weryfikacja końcowa

Po wszystkich krokach:
- [ ] `mvn test` — zielony
- [ ] `npm run build` — bez błędów TypeScript
- [ ] Restart aplikacji — brak błędów przy starcie (Flyway, JPA)
- [ ] Ręcznie: zaloguj się, otwórz aplikację, przeciągnij na Kanbanie — wszystko działa tak jak przed zmianami

---

## Kiedy to robić

Ten plan jest gotowy do wykonania w dowolnym momencie jako osobna sesja.
Nie jest częścią Etapu 4 nauki — to niezależny cleanup.
