# EasyApply — Deployment od zera. Co to, jak to działa, co robić.

> Napisane dla kogoś kto nigdy nie robił deploymentu.
> Bez skrótów myślowych. Każde słowo wyjaśnione.

---

## CZĘŚĆ 1: Co to w ogóle jest deployment i jak działa aplikacja "w internecie"

### Aplikacja na twoim komputerze vs aplikacja w internecie

Teraz twoja aplikacja działa tak:

```
Twój komputer
├── uruchamiasz backend (Spring Boot)     → dostępny na localhost:8080
├── uruchamiasz frontend (React/Vite)     → dostępny na localhost:5173
└── PostgreSQL działa na twoim komputerze → dostępny na localhost:5432

Tylko TY możesz z niej korzystać.
Nikt inny nie ma dostępu do "localhost" twojego komputera.
```

Po deploymencie działa tak:

```
Serwer (komputer gdzieś indziej, włączony 24/7)
├── backend działa                        → dostępny przez internet
├── frontend działa                       → dostępny przez internet
└── PostgreSQL działa                     → TYLKO wewnętrznie (bezpieczeństwo)

Każdy z dowolnego miejsca na świecie może wpisać adres i używać aplikacji.
```

**Deployment = przeniesienie aplikacji z "twojego komputera" na "serwer".**

---

### Co to jest serwer?

Serwer to zwykły komputer. Różni się od twojego laptopa tym, że:
- Jest włączony **24 godziny na dobę, 7 dni w tygodniu**
- Ma stały adres w internecie (stałe IP)
- Nie ma monitora, myszy, klawiatury — zarządzasz nim zdalnie przez terminal (SSH)
- Zwykle stoi w centrum danych (lub w piwnicy szwagra 😄)

---

### Jak działa dostęp do aplikacji przez internet?

Wyobraź sobie taką podróż zapytania gdy ktoś wpisuje `easyapply.pl`:

```
1. Użytkownik wpisuje "easyapply.pl" w przeglądarce
        ↓
2. Przeglądarka pyta DNS: "jaki adres IP ma easyapply.pl?"
   DNS odpowiada: "157.90.11.22"
        ↓
3. Przeglądarka łączy się z adresem IP 157.90.11.22 (serwer)
        ↓
4. Na serwerze Caddy (program "strażnik") odbiera zapytanie
   - jeśli zapytanie dotyczy /api → przekazuje do backendu
   - jeśli zapytanie dotyczy czegoś innego → przekazuje do frontendu
        ↓
5. Frontend zwraca pliki HTML/CSS/JS (strona aplikacji)
   Backend zwraca dane (JSON) gdy aplikacja o nie pyta
        ↓
6. Przeglądarka renderuje stronę. Użytkownik widzi aplikację.
```

---

### Słownik pojęć — co znaczą te wszystkie słowa

**IP (adres IP)**
Unikalny "numer domu" w internecie. Przykład: `157.90.11.22`.
Każdy komputer podłączony do internetu ma adres IP.
Problem: adresy IP są trudne do zapamiętania, dlatego mamy domeny.

**Domena**
Czytelna nazwa zamiast adresu IP. `easyapply.pl` zamiast `157.90.11.22`.
Kupujesz domenę u rejestratora (np. nazwa.pl, OVH) za ~50 PLN/rok.

**DNS (Domain Name System)**
"Książka telefoniczna internetu". Tłumaczy nazwy domen na adresy IP.
Gdy kupujesz domenę, konfigurujesz DNS żeby wskazywał na twój serwer.

**VPS (Virtual Private Server)**
Wirtualny serwer w centrum danych. Firma (np. Hetzner, DigitalOcean) ma
fizyczne komputery, dzieli je na mniejsze wirtualne serwery i wynajmuje je.
Ty dostajesz "swój kawałek" za ~€4/miesiąc. Zawsze włączony, stałe IP.

**VM (Virtual Machine = Maszyna Wirtualna)**
To samo co VPS, ale pojęcie bardziej ogólne. Wirtualny komputer działający
wewnątrz innego komputera. Szwagier może stworzyć VM na swoim serwerze
i będzie to jak osobny komputer dla ciebie.

**Linux**
System operacyjny (jak Windows, ale inny). Serwery używają Linuxa bo:
- jest darmowy
- działa bez przerwy miesiącami bez restartów
- jest bardziej stabilny i bezpieczny od Windowsa w kontekście serwerów
- deweloperzy na całym świecie tego używają

**SSH (Secure Shell)**
Sposób na zdalne połączenie z serwerem przez terminal.
Zamiast siedzieć fizycznie przy serwerze, otwierasz terminal na swoim
komputerze i piszesz komendy — jakbyś siedział przy tym serwerze.

```
Ty (Windows, terminal) ──SSH──▶ Serwer (Linux, bez monitora)
```

**Docker**
Program który "pakuje" aplikację wraz ze wszystkim czego potrzebuje
(Java, Node.js, biblioteki) do tzw. kontenera.

Kontener = paczka z aplikacją i jej środowiskiem.
Działanie: "na moim komputerze działa, na serwerze też zadziała" — bo
środowisko jest takie samo w obu miejscach.

Twoja aplikacja ma już pliki `Dockerfile` — instrukcję jak ją spakować.

**docker-compose**
Narzędzie które uruchamia KILKA kontenerów naraz według przepisu z pliku
`docker-compose.yml`. Twój plik mówi: "uruchom bazę danych + backend + frontend".
Jedna komenda (`docker compose up`) odpala całą aplikację.

**HTTPS / SSL / TLS / certyfikat**
Szyfrowanie połączenia między przeglądarką a serwerem.
- HTTP = nieszyfrowane (widoczne jak pocztówka)
- HTTPS = szyfrowane (widoczne jak list w kopercie)

"Zamknieta kłódka" w przeglądarce = HTTPS działa.
Bez HTTPS Google OAuth2 (logowanie przez Google) nie zadziała.
Certyfikat to plik który to szyfrowanie umożliwia.

**Let's Encrypt**
Darmowa organizacja wystawiająca certyfikaty HTTPS. Działa automatycznie.

**Caddy**
Program na serwerze który:
1. Automatycznie pobiera certyfikat HTTPS od Let's Encrypt
2. Kieruje ruch: `/api/*` → backend, reszta → frontend
3. Obsługuje port 443 (HTTPS) i 80 (HTTP) i przekierowuje HTTP→HTTPS

Alternatywa dla nginx (bardziej skomplikowany) — Caddy jest prostszy.

**Reverse proxy**
To właśnie robi Caddy — stoi "przed" aplikacją i decyduje gdzie kierować
zapytania. "Proxy" bo działa pośrednio. "Reverse" bo kieruje ruch DO
serwera, a nie OD serwera.

**Port**
Numer "drzwi" w komputerze. Każda usługa słucha na innym porcie.
- Port 80 = HTTP (strony bez szyfrowania)
- Port 443 = HTTPS (strony z szyfrowaniem)
- Port 8080 = twój backend Spring Boot
- Port 5432 = PostgreSQL baza danych

Gdy wpisujesz `easyapply.pl`, przeglądarka domyślnie łączy się na port 443.

**Port forwarding**
Ruter (router) chroni komputery w domu przed internetem. Domyślnie
żadne połączenie z zewnątrz nie może dostać się do środka.
Port forwarding = "reguła na ruterze": "zapytania na port 80 i 443
przekazuj do komputera 192.168.1.100 (serwer szwagra)".
Bez tego nikt z zewnątrz nie dostanie się do aplikacji.

**Firewall**
"Strażnik portów" na serwerze. Blokuje połączenia na porty których nie
powinno być dostępnych z zewnątrz (np. 5432 bazy danych).

**VPN (Virtual Private Network)**
Zaszyfrowany tunel sieciowy. W kontekście twojego projektu raczej niepotrzebny.
Nie musisz się tym zajmować.

**OAuth2 / Google OAuth2**
Logowanie "przez Google" — zamiast tworzyć własny system haseł,
użytkownik loguje się kontem Google, a Google potwierdza jego tożsamość.
Twoja aplikacja już to ma zaimplementowane.

**JWT (JSON Web Token)**
Podpisany bilet. Po zalogowaniu backend daje użytkownikowi JWT — "bilet"
który udowadnia że jest zalogowany. Przeglądarka wysyła ten bilet przy
każdym zapytaniu. Backend sprawdza czy bilet jest autentyczny.

**Zmienna środowiskowa (environment variable)**
Konfiguracja przekazana do aplikacji z zewnątrz, nie wpisana na stałe
w kodzie. Przykład: hasło do bazy danych. Trzymasz je w pliku `.env`.

---

## CZĘŚĆ 2: Jak to wygląda dla twojego projektu konkretnie

### Co masz już gotowe (i nie musisz tworzyć od zera)

```
easyapply-backend/Dockerfile    ← instrukcja jak spakować backend do kontenera
easyapply-frontend/Dockerfile   ← instrukcja jak spakować frontend do kontenera
docker-compose.yml               ← przepis: "uruchom bazę + backend + frontend"
.env.example                     ← szablon zmiennych środowiskowych (haseł, URLi)
```

To jest ogromna zaleta. Zamiast konfigurować wszystko ręcznie,
uruchamiasz jedną komendę i cała aplikacja startuje.

### Co będzie działać na serwerze szwagra

```
Serwer szwagra (fizyczny komputer)
└── VM z Ubuntu Linux (wirtualna maszyna stworzona przez szwagra)
    ├── Caddy (strażnik ruchu, HTTPS)
    ├── Docker
    │   ├── Kontener: PostgreSQL (baza danych)
    │   ├── Kontener: Spring Boot backend
    │   └── Kontener: React frontend (nginx)
    └── Pliki aplikacji (kod + dane)
```

---

## CZĘŚĆ 3: Plan krok po kroku

### Kto co robi

**Szwagier robi (wymaga dostępu do serwera i sieci domowej):**
- Tworzy VM z Ubuntu Linux na swoim serwerze
- Konfiguruje port forwarding na ruterze (porty 80 i 443)
- Podaje ci adres IP lub nazwę dostępową do VM
- Opcjonalnie: konfiguruje stałe IP lub DuckDNS jeśli ma dynamiczne IP

**Ty robisz (przez SSH, zdalnie z własnego komputera):**
- Instalujesz Docker i Caddy na VM
- Kopiujesz kod aplikacji
- Konfigurujesz Google OAuth2 credentials
- Tworzysz plik `.env` z hasłami i URLami
- Uruchamiasz aplikację
- Testujesz czy wszystko działa

---

### KROK 0: Rozmowa ze szwagrem — co mu powiedzieć

Powiedz mu dosłownie to:

> "Hej, potrzebuję VM z Ubuntu Linux. Chciałbym żebyś:
> 1. Stworzył mi maszynę wirtualną Ubuntu 24.04, najlepiej z 2 GB RAM i 20 GB dysku
> 2. Skonfigurował port forwarding na ruterze — porty 80 i 443 mają iść do tej VM
> 3. Powiedział mi jakie IP ma ta VM i czy wasze domowe IP jest stałe czy zmienne
> 4. Dał mi dostęp przez SSH (ja wygeneruję klucz SSH i ci go podam)"

**Pytania które zadaj szwagrom:**
- "Czy twój dostawca internetu (ISP) pozwala na prowadzenie serwera? Czy blokuje porty 80/443?"
  (Niektórzy dostawcy to blokują w regulaminie lub technicznie)
- "Czy masz stałe IP? Czy zmienne?"
  (Stałe = zawsze ten sam numer. Zmienne = może się zmienić po restarcie routera)
- "Jaka jest prędkość uploadu? Minimum 10 Mb/s jest OK."

---

### KROK 1: Wygeneruj klucz SSH na swoim komputerze

SSH to sposób na zdalne połączenie z serwerem. Używa pary kluczy:
- Klucz prywatny — zostaje na twoim komputerze (NIGDY nikomu nie dawaj)
- Klucz publiczny — dajesz go szwagierowi / wrzucasz na serwer

Otwórz terminal (PowerShell lub Git Bash) i wpisz:
```bash
ssh-keygen -t ed25519 -C "twoj-email@gmail.com"
```

Naciśnij Enter 3 razy (akceptujesz domyślną ścieżkę i brak hasła).

Klucz publiczny znajdziesz tutaj:
```
C:\Users\TwojeImię\.ssh\id_ed25519.pub
```

Otwórz ten plik notatnikiem — zobaczysz długi ciąg tekstu zaczynający się od
`ssh-ed25519 AAAA...`. Wyślij go szwagierowi.

On doda go do VM żebyś mógł się połączyć.

---

### KROK 2: Połącz się z VM przez SSH

Gdy szwagier skonfiguruje VM i poda ci jej IP (np. `192.168.1.100` w sieci domowej
lub publiczne IP), otwórz terminal i wpisz:

```bash
ssh root@192.168.1.100
```

Jeśli widzisz coś w stylu:
```
Welcome to Ubuntu 24.04 LTS
root@ubuntu:~#
```

Jesteś na serwerze. Teraz możesz nim zarządzać.

---

### KROK 3: Zainstaluj Docker na VM

(Wszystkie poniższe komendy wpisujesz będąc zalogowanym na VM przez SSH)

```bash
curl -fsSL https://get.docker.com | sh
```

Ta jedna komenda pobiera i instaluje Docker. Poczekaj aż się skończy.

Sprawdź czy działa:
```bash
docker --version
```
Powinno pokazać wersję, np. `Docker version 27.x.x`

---

### KROK 4: Zainstaluj Caddy na VM

Caddy to program który zajmie się HTTPS i kierowaniem ruchu.

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

---

### KROK 5: Skonfiguruj domenę lub DuckDNS

**Opcja A: Masz stałe IP i kupiłeś domenę**

W panelu swojego rejestratora domen dodaj rekord:
```
Typ:    A
Nazwa:  @
Wartość: (publiczne IP z domu szwagra)
```

**Opcja B: Masz zmienne IP (częstsze) — użyj DuckDNS (darmowe)**

1. Wejdź na duckdns.org i zaloguj się przez Google
2. Wpisz nazwę subdomeny, np. `easyapply` → dostaniesz `easyapply.duckdns.org`
3. Skopiuj swój token (długi ciąg znaków)

Na VM zainstaluj skrypt który aktualizuje adres automatycznie:
```bash
mkdir -p ~/duckdns
cat > ~/duckdns/duck.sh << 'EOF'
echo url="https://www.duckdns.org/update?domains=easyapply&token=TWOJ-TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
chmod +x ~/duckdns/duck.sh
# Uruchom co 5 minut automatycznie:
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
```

Zastąp `easyapply` swoją nazwą i `TWOJ-TOKEN` tokenem z DuckDNS.

---

### KROK 6: Skonfiguruj Google OAuth2 dla produkcji

Twoja aplikacja loguje przez Google. Google musi wiedzieć z jakiego adresu
będą przychodziły zapytania — inaczej zablokuje logowanie.

1. Idź na https://console.cloud.google.com
2. Wybierz projekt EasyApply (lub stwórz nowy)
3. Z menu: "APIs & Services" → "Credentials"
4. Kliknij na swoje "OAuth 2.0 Client ID"
5. W sekcji "Authorized redirect URIs" dodaj:
   ```
   https://easyapply.duckdns.org/login/oauth2/code/google
   ```
   (zastąp domeną którą masz)
6. Zapisz i skopiuj sobie "Client ID" i "Client Secret"

---

### KROK 7: Skopiuj kod aplikacji na VM

Na VM:
```bash
mkdir -p /opt/easyapply
cd /opt/easyapply
```

Masz dwie opcje:

**Opcja A: Repo na GitHubie (najłatwiej)**
```bash
git clone https://github.com/TwojeKonto/EasyApply.git .
```

**Opcja B: Skopiuj z komputera przez SCP**
(Uruchom to na swoim komputerze Windows, nie na serwerze)
```bash
scp -r "C:\Pulpitowe pliki\Z2J\projects\Easy\." root@IP_SERWERA:/opt/easyapply/
```

---

### KROK 8: Utwórz plik .env z konfiguracją produkcyjną

Na VM, w katalogu `/opt/easyapply`:
```bash
cp .env.example .env
nano .env
```

`nano` to prosty edytor tekstu w terminalu. Poruszasz się strzałkami,
edytujesz jak zwykły tekst, zapisujesz: `Ctrl+X`, potem `Y`, potem Enter.

Wypełnij tak (dostosuj wartości):
```
POSTGRES_DB=easyapply_db
POSTGRES_USER=easyapply_user
POSTGRES_PASSWORD=TutajWpisLosoweHaslo123!@#

SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://easyapply.duckdns.org

VITE_API_URL=https://easyapply.duckdns.org/api

GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-twój-secret

FRONTEND_URL=https://easyapply.duckdns.org
```

---

### KROK 9: Skonfiguruj Caddy

```bash
nano /etc/caddy/Caddyfile
```

Wpisz (zamień `easyapply.duckdns.org` na swoją domenę):
```
easyapply.duckdns.org {

    handle /api/* {
        reverse_proxy localhost:8080
    }

    handle /oauth2/* {
        reverse_proxy localhost:8080
    }

    handle /login/oauth2/* {
        reverse_proxy localhost:8080
    }

    handle /actuator/* {
        reverse_proxy localhost:8080
    }

    handle {
        reverse_proxy localhost:80
    }
}
```

Przeładuj Caddy:
```bash
systemctl reload caddy
```

---

### KROK 10: Napraw 2 problemy w docker-compose.yml

Zanim uruchomisz, dwie rzeczy trzeba poprawić.

**Poprawka 1:** Usuń wystawienie portu bazy danych na zewnątrz (bezpieczeństwo).

Otwórz plik:
```bash
nano /opt/easyapply/docker-compose.yml
```

Znajdź w sekcji `db:` (baza danych) te dwie linie i usuń je lub zakomentuj (#):
```yaml
    ports:
      - "5432:5432"    ← usuń te dwie linie
```

**Poprawka 2:** Backend ma hardcoded profil `dev`. Zmień:
```yaml
      SPRING_PROFILES_ACTIVE: dev
```
na:
```yaml
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
```

---

### KROK 11: Uruchom aplikację

```bash
cd /opt/easyapply
docker compose up -d --build
```

Co się dzieje:
- `--build` = zbuduj kontenery (pobierze Javę, Node.js, skompiluje kod)
- `-d` = uruchom w tle (daemon), terminal będzie wolny

To potrwa **5-10 minut** przy pierwszym uruchomieniu (pobieranie, kompilacja).

Sprawdź postęp:
```bash
docker compose logs -f backend
```

`-f` = follow (śledź na bieżąco). Wyjdź z logów: `Ctrl+C`

Gdy zobaczysz coś w stylu:
```
Started EasyApplyApplication in 45.3 seconds
```

Backend jest gotowy.

---

### KROK 12: Sprawdź czy wszystko działa

```bash
docker compose ps
```

Powinno pokazać 3 kontenery ze statusem `healthy` lub `running`:
```
NAME                  STATUS          PORTS
easyapply-db          healthy         5432/tcp
easyapply-backend     healthy         0.0.0.0:8080->8080/tcp
easyapply-frontend    running         0.0.0.0:80->80/tcp
```

Sprawdź health check backendu:
```bash
curl http://localhost:8080/actuator/health
```

Powinno zwrócić: `{"status":"UP"}`

Teraz otwórz przeglądarkę i wejdź na swoją domenę:
```
https://easyapply.duckdns.org
```

---

### KROK 13: Przetestuj

- [ ] Strona ładuje się (widać kłódkę HTTPS)
- [ ] Przycisk "Login with Google" działa
- [ ] Po zalogowaniu widać aplikację
- [ ] Można dodać aplikację o pracę
- [ ] Można uploadować CV
- [ ] Logout działa
- [ ] Po zamknięciu i otwarciu przeglądarki — sesja działa

---

## CZĘŚĆ 4: Bezpieczeństwo — na co uważać

### Zagrożenia i jak są obsłużone

| Zagrożenie | Co to znaczy | Czy masz to obsłużone? |
|-----------|--------------|------------------------|
| Ktoś przechwyci ruch | Widzi co robisz w aplikacji | ✅ HTTPS szyfruje wszystko |
| Ktoś zaloguje się bez hasła | Wejdzie na konto innego użytkownika | ✅ OAuth2 + JWT |
| Ktoś dobierze się do bazy danych | Odczyta wszystkie dane | ✅ Port 5432 nie jest wystawiony (po poprawce z KROKU 10) |
| Ktoś odgadnie hasło do bazy | Dostęp przez port 5432 | ✅ Port zamknięty |
| Ktoś włamie się przez SSH | Dostęp do serwera | Częściowo — czytaj niżej |
| Ktoś zrobi brute force na SSH | Próbuje milion haseł | Patrz niżej |

### Dodatkowe zabezpieczenie SSH (ważne!)

Domyślnie SSH jest dostępne dla całego internetu. Hakerzy automatycznie
skanują internet w poszukiwaniu otwartych portów SSH i próbują się włamać.

Zrób to od razu po zalogowaniu na VM:

**1. Wyłącz logowanie przez hasło (zostaw tylko klucze SSH):**
```bash
nano /etc/ssh/sshd_config
```

Znajdź i zmień (lub dodaj):
```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

Zapisz (Ctrl+X, Y, Enter) i zrestartuj SSH:
```bash
systemctl restart sshd
```

Od teraz tylko osoba z kluczem prywatnym (ty) może się zalogować.

**2. Firewall — zostaw otwarte tylko porty których potrzebujesz:**
```bash
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

`ufw` = Uncomplicated Firewall. Blokuje wszystko oprócz tego co dopuściłeś.

---

### Co NIGDY nie powinieneś robić

- Nie commituj pliku `.env` do gita (hasła w repozytorium = katastrofa)
- Nie używaj słabych haseł do bazy danych (użyj generatora: `openssl rand -base64 32`)
- Nie otwieraj portu 5432 (baza danych) na zewnątrz
- Nie dawaj nikomu swojego klucza prywatnego SSH (`id_ed25519`)

---

## CZĘŚĆ 5: Jak zarządzać aplikacją po deploymencie

### Codzienne operacje

**Sprawdź czy aplikacja działa:**
```bash
docker compose ps
```

**Zobacz logi na żywo:**
```bash
docker compose logs -f backend   # logi backendu
docker compose logs -f db        # logi bazy danych
```

**Zatrzymaj aplikację:**
```bash
docker compose stop
```

**Uruchom ponownie:**
```bash
docker compose start
```

**Restartuj jeden serwis (np. po błędzie backendu):**
```bash
docker compose restart backend
```

### Aktualizacja kodu po wprowadzeniu zmian

Gdy napiszesz nową funkcję i chcesz ją wdrożyć:
```bash
cd /opt/easyapply
git pull                    # pobierz najnowszy kod z gita
docker compose build        # przebuduj kontenery
docker compose up -d        # uruchom zaktualizowaną wersję
```

### Backup danych (rób regularnie!)

Dane użytkowników są w bazie PostgreSQL wewnątrz Dockera.
Rób backup raz na tydzień:

```bash
docker exec easyapply-db pg_dump -U easyapply_user easyapply_db > backup_$(date +%Y%m%d).sql
```

Tworzy plik `backup_20260408.sql`. Skopiuj go na swój komputer:
```bash
# Z twojego komputera (nie z serwera):
scp root@IP_SERWERA:/opt/easyapply/backup_20260408.sql C:\Users\TwojeImię\Desktop\
```

### Co zrobić gdy coś przestanie działać

**Aplikacja niedostępna?**
```bash
docker compose ps                    # czy kontenery działają?
docker compose logs --tail=50 backend  # ostatnie 50 linii logów błędów
```

**Backend nie startuje?**
Zwykle problem z konfiguracją. Sprawdź logi — błąd jest zwykle wyraźnie opisany.

**Baza danych nie odpowiada?**
```bash
docker compose restart db
docker compose restart backend   # po bazie zrestartuj też backend
```

**Cała VM nie odpowiada?**
Zapytaj szwagra czy serwer działa. Może wymagać restartu VM.

---

## CZĘŚĆ 6: Co się dzieje automatycznie (nie musisz się martwić)

- **HTTPS certyfikat** — Caddy odnawia go automatycznie co 3 miesiące
- **Restart po awarii prądu** — Docker ma `restart: unless-stopped` (nie ma tego w twoim pliku — dodaj)
- **Flyway migracje** — przy każdym starcie backendu, baza danych jest automatycznie aktualizowana

### Dodaj automatyczny restart (ważne!)

Otwórz `docker-compose.yml` i dodaj `restart: unless-stopped` do każdego serwisu:

```yaml
services:
  db:
    restart: unless-stopped   ← dodaj tę linię
    ...
  backend:
    restart: unless-stopped   ← dodaj tę linię
    ...
  frontend:
    restart: unless-stopped   ← dodaj tę linię
    ...
```

Dzięki temu kontenery automatycznie wstaną po restarcie serwera.

---

## PODSUMOWANIE — lista wszystkiego

### Ty i szwagier razem (jedno spotkanie ~30 min)
- [ ] Szwagier tworzy VM Ubuntu 24.04 (2 GB RAM, 20 GB dysk)
- [ ] Ty generujesz klucz SSH i dajesz mu klucz publiczny
- [ ] Szwagier dodaje klucz SSH do VM
- [ ] Szwagier konfiguruje port forwarding (porty 80 i 443 → VM)
- [ ] Szwagier mówi ci: IP VM, IP publiczne domu, czy IP jest stałe
- [ ] Razem sprawdzacie czy ISP nie blokuje portów 80/443

### Ty sam (przez SSH z domu, ~2 godziny)
- [ ] Instalujesz Docker
- [ ] Instalujesz Caddy
- [ ] Konfigurujesz domenę lub DuckDNS
- [ ] Konfigurujesz Google OAuth2
- [ ] Kopiujesz kod na serwer
- [ ] Tworzysz `.env` z hasłami
- [ ] Konfigurujesz Caddy
- [ ] Naprawiasz 2 rzeczy w `docker-compose.yml`
- [ ] Dodajesz `restart: unless-stopped` do `docker-compose.yml`
- [ ] Konfigurujesz firewall (ufw)
- [ ] Wyłączasz logowanie SSH przez hasło
- [ ] Uruchamiasz `docker compose up -d --build`
- [ ] Testujesz aplikację

### Regularnie (co tydzień, 5 minut)
- [ ] Robisz backup bazy danych i kopiujesz na swój komputer
