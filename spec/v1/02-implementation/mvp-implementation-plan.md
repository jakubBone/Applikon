# EasyApply — Plan Prac MVP (Updated)

---

## ETAP 1: Backend API

**Cel:** Działające REST API zwracające i zapisujące aplikacje w PostgreSQL z obsługą widełek wynagrodzeń, typów umów i treści ogłoszeń.

### Kroki:

1. **Stwórz projekt Spring Boot z PostgreSQL**
   - Wygeneruj projekt: Spring Initializr (Java 21, Spring Boot 3.4, dependencies: Web, Data JPA, PostgreSQL, Validation)
   - Skonfiguruj `application.properties`:
     ```properties
     spring.datasource.url=jdbc:postgresql://localhost:5432/easyapply_db
     spring.datasource.username=postgres
     spring.datasource.password=postgres
     spring.jpa.hibernate.ddl-auto=update
     spring.jpa.show-sql=true
     spring.servlet.multipart.max-file-size=5MB
     spring.servlet.multipart.max-request-size=5MB
     ```
   - Stwórz bazę PostgreSQL: `CREATE DATABASE easyapply_db;`

2. **Zdefiniuj encję Application**
   - Stwórz `Application.java` z polami:
     - id, company, position, link
     - salaryMin, salaryMax (widełki wynagrodzeń)
     - currency (PLN/EUR/USD/GBP)
     - salaryType (enum: BRUTTO, NETTO)
     - contractType (enum: B2B, UOP, UZ, INNA)
     - salarySource (enum - źródło stawki)
     - source, status, jobDescription, agency, appliedAt
     - currentStage (aktualny etap rekrutacji)
     - rejectionReason (enum: BRAK_ODPOWIEDZI, ODMOWA_MAILOWA, ODRZUCENIE_PO_ROZMOWIE, INNE)
     - rejectionDetails (szczegóły odmowy)
     - cv (relacja @ManyToOne do CV)
     - stageHistory (relacja @OneToMany do StageHistory)
   - Dodaj enum `ApplicationStatus` (WYSLANE, W_PROCESIE, OFERTA, ODMOWA)
   - Dodaj walidację: @NotBlank dla company/position, @Min(0) dla salaryMin/salaryMax
   - Dodaj `@EntityListeners(AuditingEntityListener.class)` do klasy Application
   - Pole appliedAt: `@CreatedDate private LocalDateTime appliedAt;` (auto-ustawiane na czas dodania)

3. **Zdefiniuj encję StageHistory (historia etapów)**
   - Stwórz `StageHistory.java` z polami: id, application, stageName, completed, createdAt, completedAt
   - Relacja @ManyToOne z Application
   - Metoda `markCompleted()` do zamykania etapów

4. **Zbuduj repository i service**
   - Stwórz `ApplicationRepository extends JpaRepository`
   - Stwórz `StageHistoryRepository extends JpaRepository`
   - Stwórz `ApplicationService` z metodami:
     - create() - tworzy aplikację z początkowym wpisem w historii etapów
     - findAll(), findById()
     - updateStatus(), updateStage() - obsługa przejść między statusami
     - addStage() - dodawanie nowego etapu rekrutacji
     - findDuplicates() - wykrywanie duplikatów (company + position, case-insensitive)
     - update(), delete()

5. **Zbuduj REST controller**
   - Endpoint: `POST /api/applications` (tworzy aplikację, @Valid dla walidacji)
   - Endpoint: `GET /api/applications` (zwraca listę)
   - Endpoint: `GET /api/applications/{id}` (zwraca szczegóły)
   - Endpoint: `PUT /api/applications/{id}` (aktualizuje aplikację)
   - Endpoint: `DELETE /api/applications/{id}` (usuwa aplikację)
   - Endpoint: `PATCH /api/applications/{id}/status` (zmienia status)
   - Endpoint: `PATCH /api/applications/{id}/stage` (zmienia etap z obsługą zakończenia)
   - Endpoint: `POST /api/applications/{id}/stage` (dodaje nowy etap)
   - Endpoint: `GET /api/applications/check-duplicate` (sprawdza duplikaty)
   - Endpoint: `PATCH /api/applications/{id}/cv` (przypisuje CV)

6. **Dodaj konfigurację CORS**
   - Stwórz `@Configuration` klasę `CorsConfig` z `WebMvcConfigurer`
   - Zezwól na requesty z `http://localhost:5173` (frontend Vite)
   - Dozwolone metody: GET, POST, PUT, PATCH, DELETE
   - Dozwolone headers: Content-Type, Authorization

7. **Dodaj globalną obsługę błędów**
   - Stwórz `@RestControllerAdvice` klasę `GlobalExceptionHandler`
   - Obsłuż `MethodArgumentNotValidException` (walidacja) → 400 Bad Request
   - Obsłuż `EntityNotFoundException` → 404 Not Found
   - Obsłuż `Exception` (fallback) → 500 Internal Server Error
   - Zwróć JSON z `{"error": "message", "timestamp": "..."}`

8. **Włącz JPA Auditing**
   - Dodaj `@EnableJpaAuditing` do głównej klasy aplikacji (@SpringBootApplication)
   - Umożliwi to działanie @CreatedDate dla pola appliedAt

### Edge cases do obsłużenia:

- **Wielowalutowość:** Pole `currency` (String: PLN/EUR/USD/GBP) bez przelicznika
- **Widełki wynagrodzeń:** Pola `salaryMin` i `salaryMax` (Integer, nullable)
- **Typ wynagrodzenia:** Pole `salaryType` (enum: BRUTTO/NETTO)
- **Typ umowy:** Pole `contractType` (enum: B2B/UOP/UZ/INNA)
- **Wygasłe linki:** Pole `jobDescription` (TEXT) na treść ogłoszenia
- **Rekrutacja ukryta:** Pole `agency` (String, nullable) na nazwę agencji pośredniczącej
- **Elastyczne etapy:** Pole `currentStage` (String) + tabela `stage_history`
- **Powody odmowy:** Pole `rejectionReason` (enum) + `rejectionDetails` (String)

### Definicja "done":

- Aplikacja zapisuje się w PostgreSQL z wszystkimi polami (appliedAt auto-generowane)
- API zwraca JSON z zapisanymi danymi
- Walidacja działa (błąd 400 przy pustej firmie, komunikat JSON)
- Status można zmieniać przez PATCH
- Etapy rekrutacji są śledzone w historii
- CORS działa (frontend może wywołać API z localhost:5173)
- Error handling zwraca czytelne błędy w formacie JSON

### Test:

```bash
# Uruchom backend
./mvnw spring-boot:run

# Test 1: Dodaj aplikację z widełkami (appliedAt auto-generowane)
curl -X POST http://localhost:8080/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company":"Google",
    "position":"Junior Java Dev",
    "salaryMin":8000,
    "salaryMax":12000,
    "currency":"PLN",
    "salaryType":"BRUTTO",
    "contractType":"B2B",
    "link":"https://careers.google.com/123",
    "source":"LinkedIn",
    "jobDescription":"Java 11+, Spring Boot, Docker",
    "agency":null
  }'
# Zwraca: {"id":1, "company":"Google", ..., "appliedAt":"2026-01-18T12:34:56", "status":"WYSLANE"}

# Test 2: Sprawdź listę
curl http://localhost:8080/api/applications
# Zwraca JSON array z aplikacjami

# Test 3: Walidacja - brak company (powinno zwrócić 400)
curl -X POST http://localhost:8080/api/applications \
  -H "Content-Type: application/json" \
  -d '{"position":"Dev","salaryMin":5000,"currency":"PLN"}'
# Zwraca: {"error":"company: Nazwa firmy nie może być pusta", ...}

# Test 4: Zmiana etapu na "W procesie"
curl -X PATCH http://localhost:8080/api/applications/1/stage \
  -H "Content-Type: application/json" \
  -d '{"status":"W_PROCESIE","currentStage":"Rozmowa z HR"}'

# Test 5: Sprawdzenie duplikatów
curl "http://localhost:8080/api/applications/check-duplicate?company=Google&position=Junior%20Java%20Dev"
# Zwraca: [{"id":1, "company":"Google", ...}]
```

---

## ETAP 2: Frontend - Formularz i Lista

**Cel:** React UI wyświetlające listę aplikacji, formularz dodawania z widełkami wynagrodzeń i ostrzeżenie o duplikatach.

### Kroki:

1. **Stwórz projekt React z JavaScript**
   - `npm create vite@latest easyapply-frontend -- --template react`
   - Zainstaluj @dnd-kit: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - Stwórz plik `src/services/api.js` z funkcjami API

2. **Zbuduj serwis API**
   - Stwórz `src/services/api.js` z funkcjami:
     - fetchApplications(), createApplication(), updateApplication()
     - updateApplicationStatus(), updateApplicationStage()
     - checkDuplicate(), deleteApplication()
   - Użyj fetch API do komunikacji z http://localhost:8080/api/applications

3. **Zbuduj komponent App.jsx**
   - Zarządzanie stanem aplikacji (applications, view, formData, selectedApp)
   - Przełączanie widoków: Kanban, Lista, CV, Szczegóły
   - Formularz dodawania aplikacji w modalu z polami:
     - company, position (wymagane)
     - salaryMin, salaryMax, isRange (checkbox dla widełek)
     - currency (select: PLN/EUR/USD/GBP)
     - salaryType (radio: Brutto/Netto)
     - contractType (select: B2B/UoP/UZ/Inna)
     - source, link, jobDescription (textarea)
   - UWAGA: appliedAt jest auto-generowane przez backend (@CreatedDate) - NIE dodawać do formularza
   - Przed wysłaniem: wywołaj checkDuplicate() i pokaż ostrzeżenie jeśli firma+stanowisko już istnieją
   - Formularz edycji aplikacji (ten sam layout co dodawanie)

4. **Zbuduj komponent SalaryFormSection**
   - Wydzielony komponent dla sekcji wynagrodzenia
   - Input dla salaryMin, opcjonalny input dla salaryMax (widoczny gdy isRange=true)
   - Select dla waluty
   - Radio buttons dla typu (brutto/netto)
   - Select dla typu umowy

5. **Widok szczegółów aplikacji**
   - Wyświetlanie wszystkich danych aplikacji
   - Status i aktualny etap
   - Link do oferty (jeśli istnieje)
   - Przypisane CV z możliwością pobrania
   - Lista notatek (NotesList)
   - Przycisk "Edytuj" otwierający formularz edycji

### Edge cases do obsłużenia:

- **Re-aplikacja:** Wywołanie `GET /api/applications/check-duplicate?company=X&position=Y` przed zapisem, komunikat: "Już aplikowałeś do tej firmy na to stanowisko (data: XX.XX.XXXX). Kontynuować?"
- **Duplikaty ofert:** Ostrzeżenie na podstawie company + position (case-insensitive)
- **Widełki vs pojedyncza stawka:** Checkbox "Widełki" pokazuje/ukrywa pole salaryMax

### Definicja "done":

- Formularz działa, dane trafiają do bazy przez API
- Lista odświeża się po dodaniu aplikacji
- Duplikat wyświetla ostrzeżenie (ale pozwala zapisać)
- Widełki wynagrodzeń wyświetlają się poprawnie (np. "8 000 - 12 000 PLN brutto, B2B")
- Widok szczegółów pokazuje wszystkie dane aplikacji
- Edycja aplikacji działa poprawnie

### Test:

```bash
# Uruchom frontend
npm run dev

# W przeglądarce:
1. Otwórz http://localhost:5173
2. Kliknij "+ Dodaj aplikację"
3. Wypełnij formularz: Google, Junior Java Developer, 8000-12000 PLN brutto B2B, LinkedIn
4. Kliknij "Dodaj aplikację" → aplikacja pojawia się w widoku
5. Dodaj ponownie: Google, Junior Java Developer → OSTRZEŻENIE: "Już aplikowałeś 18.01.2026"
6. Kliknij "Kontynuuj mimo duplikatu" → duplikat się zapisuje
7. Odśwież stronę (F5) → obie aplikacje nadal widoczne
8. Kliknij na kartę aplikacji → widok szczegółów
9. Kliknij "Edytuj" → zmień stawkę na 10000-15000 → Zapisz
10. Sprawdź czy stawka się zaktualizowała
```

---

## ETAP 3: Kanban Board z elastycznymi etapami

**Cel:** Tablica Kanban z 3 kolumnami, drag & drop z modali wyboru etapu i zakończenia procesu.

### Kroki:

1. **Zainstaluj bibliotekę drag & drop**
   - `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - Stwórz komponent `KanbanBoard.jsx`

2. **Zbuduj 3 kolumny Kanban**
   - **Wysłane (WYSLANE)** - nowe aplikacje
   - **W procesie (W_PROCESIE)** - z aktualnym etapem rekrutacji
   - **Zakończone (ZAKONCZONE)** - oferty (OFERTA) i odmowy (ODMOWA)
   - Każda kolumna = droppable container z listą kart aplikacji
   - Karta aplikacji = draggable element (firma, stanowisko, data aplikacji)

3. **Zbuduj komponent ApplicationCard**
   - Wyświetla: firma, stanowisko, data aplikacji
   - Dla W_PROCESIE: dropdown wyboru etapu (predefiniowane + własne)
   - Dla ODMOWA: wyświetla powód odmowy
   - Dla OFERTA: ikona ✓
   - Dla ODMOWA: ikona ✗

4. **Predefiniowane etapy rekrutacji**
   - Rozmowa z HR
   - Rozmowa techniczna
   - Rozmowa z managerem
   - Zadanie rekrutacyjne
   - Rozmowa finalna
   - + możliwość dodania własnego etapu

5. **Dodaj obsługę drag & drop**
   - Przeciągnięcie do "W procesie" → otwiera modal wyboru etapu (StageModal)
   - Przeciągnięcie do "Zakończone" → otwiera modal zakończenia (EndModal)
   - Przeciągnięcie do "Wysłane" → resetuje etapy i status
   - Wywołaj `PATCH /api/applications/{id}/stage` z odpowiednimi danymi

6. **Modal wyboru etapu (StageModal)**
   - Lista predefiniowanych etapów do wyboru
   - Input dla własnego etapu + przycisk "Dodaj"
   - Aktualny etap podświetlony

7. **Modal zakończenia (EndModal)**
   - Wybór: Oferta otrzymana / Odmowa
   - Dla odmowy: select powodu + opcjonalne szczegóły
   - Powody: Brak odpowiedzi, Odmowa mailowa, Odrzucenie po rozmowie, Inny powód

### Edge cases do obsłużenia:

- **Cofnięcie do poprzedniej kolumny:** Czyści dane etapu/odmowy
- **Zmiana etapu na karcie:** Dropdown bezpośrednio na karcie w kolumnie "W procesie"
- **Własne etapy:** Input pozwala na dodanie dowolnego etapu

### Definicja "done":

- 3 kolumny Kanban wyświetlają się na stronie
- Aplikacje rozkładają się po kolumnach wg statusu
- Drag & drop działa płynnie
- Modal etapu otwiera się przy przeciągnięciu do "W procesie"
- Modal zakończenia otwiera się przy przeciągnięciu do "Zakończone"
- Status i etap zmieniają się w bazie po wyborze
- Po odświeżeniu strony karty pozostają w nowych kolumnach

### Test:

```bash
# W przeglądarce:
1. Dodaj aplikację "Google, Junior Dev" → trafia do kolumny "Wysłane"
2. Przeciągnij kartę do kolumny "W procesie"
3. W modalu wybierz "Rozmowa z HR" → karta ma etap "Rozmowa z HR"
4. Kliknij dropdown na karcie → zmień na "Rozmowa techniczna"
5. Przeciągnij kartę do kolumny "Zakończone"
6. W modalu wybierz "Odmowa" → powód "Brak odpowiedzi"
7. Karta ma ikonę ✗ i pokazuje "Brak odpowiedzi"
8. Odśwież stronę (F5) → karta nadal w "Zakończone" z powodem odmowy
9. Przeciągnij kartę z powrotem do "Wysłane"
10. Sprawdź backend: curl http://localhost:8080/api/applications/1
   # status: "WYSLANE", currentStage: null, rejectionReason: null
```

---

## ETAP 4: Zarządzanie CV (3 typy)

**Cel:** Zarządzanie CV z 3 typami: plik PDF, link zewnętrzny, notatka. Przypisywanie CV do aplikacji.

### Kroki:

1. **Dodaj encję CV w backendzie**
   - Stwórz `CV.java` z polami:
     - id
     - type (enum: FILE, LINK, NOTE)
     - fileName (wewnętrzna nazwa pliku UUID)
     - originalFileName (oryginalna nazwa wyświetlana)
     - filePath (ścieżka dla typu FILE)
     - fileSize (rozmiar dla typu FILE)
     - externalUrl (URL dla typu LINK)
     - uploadedAt (@CreatedDate)
   - Dodaj tabelę `cvs` w bazie
   - Stwórz `CVRepository`

2. **Zbuduj serwis CVService**
   - Metoda `uploadFile(MultipartFile file)`: walidacja (tylko PDF, max 5MB), zapis do `./uploads/cv/`, generuj UUID filename
   - Metoda `createLinkOrNote(name, type, externalUrl)`: tworzy CV typu LINK lub NOTE
   - Metoda `loadFile(Long id)`: odczyt pliku z dysku (Resource)
   - Metoda `delete(Long id)`: usuwa CV i plik (jeśli FILE)
   - Metoda `update(Long id, name, externalUrl)`: aktualizuje nazwę i URL
   - Metoda `assignCVToApplication(appId, cvId)`: przypisuje CV do aplikacji
   - Metoda `removeCVFromApplication(appId)`: usuwa przypisanie

3. **Zbuduj REST endpoint do CV**
   - Endpoint: `POST /api/cv/upload` (przyjmuje MultipartFile, zwraca CV)
   - Endpoint: `POST /api/cv` (tworzy CV typu LINK lub NOTE)
   - Endpoint: `GET /api/cv` (lista wszystkich CV)
   - Endpoint: `GET /api/cv/{id}` (zwraca metadata CV)
   - Endpoint: `GET /api/cv/{id}/download` (zwraca plik PDF, Content-Disposition: attachment)
   - Endpoint: `PUT /api/cv/{id}` (aktualizuje nazwę i URL)
   - Endpoint: `DELETE /api/cv/{id}` (usuwa CV)

4. **Zbuduj komponent CVManager w frontend**
   - Widok główny: lista CV pogrupowana według typu (Pliki, Linki, Na komputerze)
   - Panel szczegółów wybranego CV
   - Modal dodawania CV z wyborem typu:
     - "Prześlij plik" → upload PDF
     - "Nie przesyłaj pliku" → link zewnętrzny lub tylko nazwa
   - Walidacja: tylko .pdf, max 5MB
   - Lista aplikacji przypisanych do CV
   - Możliwość przypisania CV do aplikacji (modal wyboru)
   - Możliwość usunięcia przypisania
   - Edycja nazwy i URL (dla typu LINK/NOTE)

5. **Grupowanie CV**
   - 📄 Przesłane pliki (FILE) - pokazuje rozmiar
   - 🔗 Linki zewnętrzne (LINK) - pokazuje domenę
   - 💻 Na moim komputerze (NOTE) - pokazuje "na komputerze"
   - Licznik użyć przy każdym CV

### Edge cases do obsłużenia:

- **Walidacja typu pliku:** Tylko PDF dozwolone
- **Walidacja rozmiaru:** Max 5MB
- **Jedno CV może być przypisane do wielu aplikacji**
- **Usunięcie CV:** Usuwa też z przypisanych aplikacji (relacja)
- **Link zewnętrzny:** Może być pusty dla typu NOTE

### Definicja "done":

- Upload PDF działa, plik zapisuje się na dysku serwera
- Można tworzyć CV typu LINK (z URL) i NOTE (tylko nazwa)
- Metadata CV zapisuje się w tabeli `cvs`
- CV można przypisać do aplikacji
- Pobieranie CV typu FILE działa (klik → download pliku)
- Otwieranie CV typu LINK działa (otwiera URL w nowej karcie)
- Walidacja blokuje pliki > 5MB i nie-PDF
- Grupowanie CV działa poprawnie
- Edycja i usuwanie CV działa

### Test:

```bash
# W przeglądarce:
1. Przejdź do zakładki "CV"
2. Kliknij "+ Dodaj CV"
3. Wybierz "Prześlij plik" → wybierz CV_Java.pdf (2MB) → sukces
4. CV pojawia się w grupie "Przesłane pliki"
5. Kliknij "+ Dodaj CV" → wybierz "Nie przesyłaj pliku"
6. Wybierz "W chmurze" → wpisz nazwę "CV_Frontend.pdf" → wklej link Google Drive → Zapisz
7. CV pojawia się w grupie "Linki zewnętrzne"
8. Kliknij "+ Dodaj CV" → "Nie przesyłaj pliku" → "Na moim komputerze" → nazwa "CV_Ogólne.pdf" → Zapisz
9. CV pojawia się w grupie "Na moim komputerze"
10. Wybierz CV_Java.pdf → kliknij "Przypisz" → wybierz aplikację "Google - Junior Dev"
11. Otwórz szczegóły aplikacji Google → widać: "CV: CV_Java.pdf" + przycisk "Pobierz"
12. Kliknij "Pobierz" → plik się pobiera

# Test walidacji:
1. Spróbuj przesłać plik README.txt → błąd: "Dozwolone są tylko pliki PDF"
2. Spróbuj przesłać plik Large_CV.pdf (10MB) → błąd: "Plik nie może przekraczać 5MB"

# Test backend:
curl -X POST http://localhost:8080/api/cv/upload \
  -F "file=@CV_Java.pdf"

curl http://localhost:8080/api/cv/1/download --output downloaded.pdf
```

---

## ETAP 5: Notatki z kategoriami

**Cel:** Dodawanie notatek tekstowych do aplikacji z podziałem na kategorie (Pytania, Feedback, Inne). Edycja i usuwanie notatek.

### Kroki:

1. **Dodaj encję Note w backendzie**
   - Stwórz `Note.java` z polami:
     - id
     - content (TEXT, @NotBlank)
     - category (enum: PYTANIA, FEEDBACK, INNE)
     - createdAt (@CreatedDate)
     - application (@ManyToOne, nullable = false)
   - Dodaj enum `NoteCategory` z wartościami: PYTANIA, FEEDBACK, INNE
   - Dodaj tabelę `notes` w bazie
   - Stwórz `NoteRepository`

2. **Zbuduj serwis NoteService**
   - Metoda `findByApplicationId(Long appId)`: zwraca notatki dla aplikacji (najnowsze pierwsze)
   - Metoda `create(Long appId, String content, NoteCategory category)`: tworzy notatkę
   - Metoda `update(Long noteId, String content, NoteCategory category)`: aktualizuje notatkę
   - Metoda `delete(Long noteId)`: usuwa notatkę
   - Metoda `deleteByApplicationId(Long appId)`: usuwa wszystkie notatki aplikacji (cascade)

3. **Zbuduj REST endpoint do notatek**
   - Endpoint: `GET /api/applications/{id}/notes` (zwraca listę notatek dla aplikacji)
   - Endpoint: `POST /api/applications/{id}/notes` (dodaje nową notatkę)
   - Endpoint: `PUT /api/notes/{id}` (aktualizuje notatkę)
   - Endpoint: `DELETE /api/notes/{id}` (usuwa notatkę)

4. **Zbuduj komponent NotesList w frontend**
   - Formularz dodawania notatki:
     - Przyciski wyboru kategorii (Pytania z rozmowy, Feedback, Inne)
     - Textarea do wpisania treści
     - Przycisk "Dodaj notatkę"
   - Lista notatek pod formularzem (najnowsza na górze):
     - Tag kategorii (kolorowany)
     - Treść notatki
     - Względny czas (np. "5 min temu", "wczoraj", "3 dni temu")
     - Przyciski "Edytuj" i "Usuń"
   - Tryb edycji notatki (inline)

5. **Kolorowanie kategorii**
   - PYTANIA: niebieski (#3498db)
   - FEEDBACK: zielony (#27ae60)
   - INNE: szary (#95a5a6)

6. **Względny czas**
   - < 1 min: "Przed chwilą"
   - < 60 min: "X min temu"
   - < 24h: "X godz. temu"
   - 1 dzień: "Wczoraj"
   - < 7 dni: "X dni temu"
   - >= 7 dni: "DD.MM.YYYY"

### Edge cases do obsłużenia:

- **Pusta notatka:** Walidacja @NotBlank blokuje puste notatki
- **Domyślna kategoria:** INNE (jeśli nie wybrano)
- **Usuwanie aplikacji:** Kaskadowe usuwanie notatek

### Definicja "done":

- Notatki zapisują się w bazie z timestampem i kategorią
- Lista notatek wyświetla się pod aplikacją
- Kategorie są kolorowane
- Względny czas wyświetla się poprawnie
- Edycja notatki działa (inline)
- Usuwanie notatki działa (z potwierdzeniem)
- Usunięcie aplikacji usuwa też notatki

### Test:

```bash
# W przeglądarce:
1. Otwórz szczegóły aplikacji "Google - Junior Dev"
2. W sekcji notatek wybierz kategorię "Pytania z rozmowy"
3. Wpisz: "Pytali o Spring Boot, Docker i Kubernetes"
4. Kliknij "Dodaj notatkę" → notatka pojawia się na liście
5. Zobacz tag "Pytania z rozmowy" (niebieski) i czas "Przed chwilą"
6. Dodaj kolejną notatkę kategorii "Feedback": "Pozytywny feedback, zaproszenie na rozmowę techniczną"
7. Kliknij "Edytuj" przy pierwszej notatce → zmień treść → "Zapisz"
8. Kliknij "Usuń" przy drugiej notatce → potwierdź → notatka znika
9. Odśwież stronę → pierwsza notatka nadal widoczna

# Test backend:
curl http://localhost:8080/api/applications/1/notes

curl -X POST http://localhost:8080/api/applications/1/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Kontakt: jan.kowalski@google.com","category":"INNE"}'
```

---

## ETAP 6: Widok tabelaryczny

**Cel:** Alternatywny widok listy aplikacji w formie tabeli z sortowaniem, filtrowaniem i masowym usuwaniem.

### Kroki:

1. **Zbuduj komponent ApplicationTable**
   - Tabela z kolumnami: Checkbox, Firma, Stanowisko, Stawka, Status, Data aplikacji
   - Sortowanie po: dacie, firmie, stanowisku
   - Filtrowanie po statusie (wszystkie, wysłane, w procesie, oferta, odmowa)
   - Wyszukiwanie tekstowe (firma, stanowisko)
   - Licznik dni od aplikacji

2. **Zaznaczanie i masowe usuwanie**
   - Checkbox przy każdym wierszu
   - Przycisk "Usuń wybrane" (pojawia się gdy coś zaznaczono)
   - Potwierdzenie usunięcia
   - Wywołanie DELETE /api/applications/{id} dla każdego zaznaczonego

3. **Kliknięcie na wiersz**
   - Otwiera widok szczegółów aplikacji

### Definicja "done":

- Tabela wyświetla wszystkie aplikacje
- Sortowanie działa (kliknięcie na nagłówek kolumny)
- Filtrowanie po statusie działa
- Wyszukiwanie działa
- Masowe usuwanie działa
- Kliknięcie na wiersz otwiera szczegóły

### Test:

```bash
# W przeglądarce:
1. Przejdź do zakładki "Lista"
2. Dodaj 5 aplikacji z różnymi statusami
3. Kliknij nagłówek "Data" → sortowanie malejące
4. Kliknij ponownie → sortowanie rosnące
5. Wybierz filtr "W procesie" → tylko aplikacje w procesie
6. Wpisz "Google" w wyszukiwarce → tylko aplikacje Google
7. Zaznacz 2 aplikacje checkboxami
8. Kliknij "Usuń wybrane" → potwierdź → aplikacje znikają
```

---

## ETAP 7: Gamifikacja (odznaki)

**Cel:** System odznak motywacyjnych za odrzucenia i ghosting. Widget wyświetlający postęp.

### Kroki:

1. **Zbuduj serwis StatisticsService w backendzie**
   - Metoda `getBadgeStats()` zwracająca:
     - totalRejections (liczba odmów)
     - totalGhosting (liczba odmów z powodem BRAK_ODPOWIEDZI)
     - totalOffers (liczba ofert)
     - rejectionBadge (aktualna odznaka za odrzucenia)
     - ghostingBadge (aktualna odznaka za ghosting)
     - sweetRevengeUnlocked (czy odblokowano "Sweet Revenge")

2. **Odznaki za odrzucenia** (progi: 5, 10, 25, 50, 100)
   - 🥊 Rozgrzewka (5): "Dopiero zaczynasz. Rynek pracy jeszcze nie wie, z kim zadziera."
   - 🍳 Patelnia (10): "Odrzucenia spływają po Tobie jak jajecznica po patelni."
   - 🦾 Niezniszczalny (25): "25 firm nie doceniło Twojego potencjału. To ich problem."
   - 👑 Legenda Linkedina (50): "Pół setki odmów i wciąż w grze. Szacunek."
   - 🎰 Statystyczna Pewność (100): "Przy takiej próbie, kolejna MUSI być ta właściwa."

3. **Odznaki za ghosting** (progi: 5, 15, 30, 50, 100)
   - 👻 Widmo (5): "5 firm nie odpowiedziało wcale. Sprawdź, czy mają internet."
   - 🧘 Cierpliwy Mnich (15): "Czekanie to też umiejętność. Właśnie ją opanowujesz."
   - 🔍 Detektyw (30): "30 spraw bez rozwiązania. Może to nie Ty, może to oni."
   - 🫥 Człowiek-Duch (50): "50 firm udaje, że nie istniejesz. Ale Ty wiesz lepiej."
   - 🤫 Król Ciszy (100): "100 firm milczy. Gratuluję wytrwałości!"

4. **Sweet Revenge**
   - Odblokowane gdy: totalRejections >= 10 AND totalOffers > 0
   - "Słodka zemsta - zdobyłeś ofertę po wielu odrzuceniach!"

5. **Zbuduj REST endpoint**
   - Endpoint: `GET /api/statistics/badges` (zwraca BadgeStatsResponse)

6. **Zbuduj komponent BadgeWidget w frontend**
   - Wyświetla aktualną odznakę za odrzucenia (jeśli jest)
   - Wyświetla aktualną odznakę za ghosting (jeśli jest)
   - Pokazuje postęp do następnej odznaki
   - Sweet Revenge jako specjalna odznaka
   - Rozwijany panel ze szczegółami

### Definicja "done":

- Statystyki obliczają się poprawnie
- Widget wyświetla odpowiednie odznaki
- Postęp do następnej odznaki jest widoczny
- Sweet Revenge odblokowuje się przy spełnieniu warunków

### Test:

```bash
# W przeglądarce:
1. Dodaj 5 aplikacji i oznacz je jako odmowa (dowolny powód)
2. Widget pokazuje odznakę "Rozgrzewka" 🥊
3. Dodaj jeszcze 5 odmów → Widget pokazuje "Patelnia" 🍳
4. Zmień 3 odmowy na powód "Brak odpowiedzi"
5. Widget pokazuje odznakę ghosting jeśli próg osiągnięty
6. Zmień jedną aplikację na "Oferta"
7. Jeśli masz 10+ odmów → pojawia się "Sweet Revenge"

# Test backend:
curl http://localhost:8080/api/statistics/badges
```

---

## TEST INTEGRACYJNY MVP

### Scenariusz sukcesu (happy path):

**Użytkownik: Junior Developer szukający pracy**

1. **Dodawanie aplikacji:**
   - Otwiera http://localhost:5173
   - Klika "+ Dodaj aplikację"
   - Wypełnia formularz: Google, Junior Java Developer, 10000-15000 PLN brutto B2B, LinkedIn
   - Wkleja treść ogłoszenia w textarea
   - Kliknie "Dodaj aplikację" → aplikacja pojawia się w kolumnie "Wysłane" na Kanban

2. **Upload CV:**
   - Przechodzi do zakładki "CV"
   - Klika "+ Dodaj CV" → "Prześlij plik"
   - Wybiera plik CV_Java_Spring.pdf
   - CV pojawia się na liście
   - Klika "Przypisz" → wybiera aplikację "Google - Junior Java Developer"
   - Widzi CV przypisane do aplikacji

3. **Śledzenie postępu:**
   - Po tygodniu: przeciąga kartę "Google" z "Wysłane" do "W procesie"
   - W modalu wybiera "Rozmowa z HR"
   - Otwiera szczegóły aplikacji
   - Dodaje notatkę kategorii "Pytania": "Pytali o Spring Boot, Docker, REST API"
   - Dodaje notatkę kategorii "Inne": "Rekruter: Anna Nowak, anna.nowak@google.com"

4. **Zmiana etapu:**
   - Na karcie klika dropdown → zmienia etap na "Rozmowa techniczna"
   - Dodaje kolejną notatkę: "Zadanie domowe: REST API w Spring Boot"

5. **Zakończenie procesu:**
   - Przeciąga kartę do kolumny "Zakończone"
   - W modalu wybiera "Oferta otrzymana"
   - Karta ma ikonę ✓
   - Widget odznak aktualizuje się (jeśli wcześniej były odmowy)

6. **Sprawdzenie duplikatów:**
   - Próbuje dodać ponownie: Google, Junior Java Developer
   - Dostaje ostrzeżenie: "Już aplikowałeś do tej firmy na to stanowisko (18.01.2026)"
   - Może kontynuować lub anulować

7. **Widok tabelaryczny:**
   - Przechodzi na widok "Lista"
   - Sortuje po dacie aplikacji
   - Filtruje tylko "Oferty"
   - Widzi wszystkie otrzymane oferty

### Scenariusz błędu:

**Błąd 1: Użytkownik próbuje dodać aplikację bez wymaganych pól**
- Akcja: Nie wypełnia pola "Firma", klika "Dodaj aplikację"
- Wynik: Pole jest podświetlone, formularz nie wysyła się (walidacja HTML5)
- Aplikacja NIE zapisuje się

**Błąd 2: Użytkownik próbuje uploadować plik .docx zamiast PDF**
- Akcja: Wybiera plik CV.docx, klika "Upload"
- Wynik: Alert: "Dozwolone są tylko pliki PDF"
- Plik NIE jest uploadowany

**Błąd 3: Użytkownik próbuje uploadować plik 10MB**
- Akcja: Wybiera plik Large_CV.pdf (10MB), klika "Upload"
- Wynik: Alert: "Plik nie może przekraczać 5MB"
- Plik NIE jest uploadowany

**Błąd 4: Backend nie działa (port 8080 zajęty)**
- Akcja: Użytkownik próbuje dodać aplikację
- Wynik: Console error, brak ładowania danych
- Lista aplikacji pokazuje "Ładowanie..." lub pusty stan

**Błąd 5: Użytkownik wpisuje ujemną stawkę**
- Akcja: Wpisuje "-5000" w pole salaryMin
- Wynik: Backend zwraca błąd walidacji: "Stawka musi być dodatnia"
- Aplikacja NIE zapisuje się

### Finalna weryfikacja MVP:

**Kryteria akceptacji:**
- ✅ Użytkownik może dodać 20 aplikacji z różnymi danymi
- ✅ Wszystkie aplikacje przetrwają odświeżenie strony (zapisane w bazie)
- ✅ Data aplikacji (appliedAt) jest auto-generowana - użytkownik nie musi jej podawać
- ✅ Przeciąganie kart Kanban zmienia status w bazie
- ✅ Modal etapu otwiera się przy przejściu do "W procesie"
- ✅ Modal zakończenia otwiera się przy przejściu do "Zakończone"
- ✅ Predefiniowane i własne etapy rekrutacji działają
- ✅ Upload CV działa (3 typy: plik, link, notatka)
- ✅ Przypisanie CV do aplikacji działa
- ✅ Można pobrać uploadowany plik PDF
- ✅ Notatki zapisują się z kategoriami i timestampem
- ✅ Edycja i usuwanie notatek działa
- ✅ Duplikaty są wykrywane i wyświetlają ostrzeżenie
- ✅ Widełki wynagrodzeń działają (PLN, EUR, USD, GBP, brutto/netto, B2B/UoP)
- ✅ Treść ogłoszenia zapisuje się w bazie (wygasłe linki)
- ✅ Widok tabelaryczny z sortowaniem i filtrowaniem działa
- ✅ Masowe usuwanie aplikacji działa
- ✅ CORS działa - frontend komunikuje się z backendem bez błędów
- ✅ Error handling zwraca czytelne błędy (walidacja, 404, 500)
- ✅ System odznak motywacyjnych działa

**Test end-to-end (5 minut):**

```bash
# Terminal 1: Backend
cd easyapply-backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd easyapply-frontend
npm run dev

# Przeglądarka: http://localhost:5173
1. Dodaj 3 aplikacje (Google/PLN brutto B2B, Meta/USD netto UoP, Amazon/EUR brutto B2B)
2. Przejdź do CV → upload 2 CV (CV_Java.pdf, CV_React.pdf)
3. Przypisz CV_Java do Google, CV_React do Meta
4. Przeciągnij Google z "Wysłane" do "W procesie" → wybierz "Rozmowa z HR"
5. Na karcie zmień etap na "Rozmowa techniczna"
6. Otwórz szczegóły Google → dodaj notatkę "Pytania": "Spring Boot, Docker"
7. Dodaj notatkę "Feedback": "Pozytywny, zaproszenie na kolejny etap"
8. Przeciągnij Google do "Zakończone" → wybierz "Oferta"
9. Przeciągnij Meta do "Zakończone" → wybierz "Odmowa" → "Brak odpowiedzi"
10. Sprawdź widget odznak
11. Przejdź do widoku "Lista" → sortuj po firmie → filtruj "Oferty"
12. Zaznacz Amazon → kliknij "Usuń wybrane"
13. Odśwież stronę (F5)
14. Sprawdź: Google w "Zakończone" z ✓, Meta z ✗ i "Brak odpowiedzi", Amazon usunięty

# Sukces: MVP działa!
```

---


## ARCHITEKTURA KOŃCOWA

### Backend (Spring Boot 3.4, Java 21)

```
easyapply-backend/
├── src/main/java/com/easyapply/
│   ├── controller/
│   │   ├── ApplicationController.java
│   │   ├── CVController.java
│   │   ├── NoteController.java
│   │   └── StatisticsController.java
│   ├── service/
│   │   ├── ApplicationService.java
│   │   ├── CVService.java
│   │   ├── NoteService.java
│   │   └── StatisticsService.java
│   ├── repository/
│   │   ├── ApplicationRepository.java
│   │   ├── CVRepository.java
│   │   ├── NoteRepository.java
│   │   └── StageHistoryRepository.java
│   ├── entity/
│   │   ├── Application.java
│   │   ├── ApplicationStatus.java (enum)
│   │   ├── CV.java
│   │   ├── CVType.java (enum)
│   │   ├── Note.java
│   │   ├── NoteCategory.java (enum)
│   │   ├── RejectionReason.java (enum)
│   │   ├── SalaryType.java (enum)
│   │   ├── SalarySource.java (enum)
│   │   ├── ContractType.java (enum)
│   │   └── StageHistory.java
│   ├── dto/
│   │   ├── ApplicationRequest.java
│   │   ├── ApplicationResponse.java
│   │   ├── NoteRequest.java
│   │   ├── NoteResponse.java
│   │   ├── StageUpdateRequest.java
│   │   ├── StatusUpdateRequest.java
│   │   ├── BadgeResponse.java
│   │   └── BadgeStatsResponse.java
│   ├── config/
│   │   └── CorsConfig.java
│   ├── exception/
│   │   └── GlobalExceptionHandler.java
│   └── EasyApplyApplication.java
└── uploads/cv/  (przechowywanie plików CV)
```

### Frontend (React 19, Vite)

```
easyapply-frontend/
├── src/
│   ├── App.jsx              (główny komponent, routing, state)
│   ├── KanbanBoard.jsx      (tablica Kanban z drag & drop)
│   ├── ApplicationCard.jsx  (karta aplikacji)
│   ├── ApplicationTable.jsx (widok tabelaryczny)
│   ├── CVManager.jsx        (zarządzanie CV)
│   ├── NotesList.jsx        (lista notatek)
│   ├── BadgeWidget.jsx      (widget odznak)
│   ├── services/
│   │   └── api.js           (komunikacja z API)
│   └── *.css                (style)
└── index.html
```

### Baza danych (PostgreSQL)

```sql
-- Tabele:
applications (id, company, position, link, salary_min, salary_max, currency,
              salary_type, contract_type, salary_source, source, status,
              job_description, agency, cv_id, current_stage, rejection_reason,
              rejection_details, applied_at)

cvs (id, type, file_name, original_file_name, file_path, file_size,
     external_url, uploaded_at)

notes (id, content, category, application_id, created_at)

stage_history (id, application_id, stage_name, completed, created_at, completed_at)
```
