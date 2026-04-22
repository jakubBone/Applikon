# EasyApply — Deployment Guide

> Dla kogo: początkujący developer, pierwsza produkcja, max 50 użytkowników.
> Data: 2026-04-08. Opisuje stan v1 (as-built).

---

## 1. Co mamy — co to oznacza dla deploymentu

Zanim wybierzemy gdzie deployować, warto wiedzieć co mamy:

| Co | Wpływ na deployment |
|----|---------------------|
| Spring Boot backend (Java 21) | Ciężki — zajmuje ~300–500 MB RAM, wolno startuje (~60s) |
| React frontend (statyczne pliki, nginx) | Lekki — zajmuje ~10 MB RAM |
| PostgreSQL | Potrzebuje trwałego dysku (dane nie mogą zginąć po restarcie) |
| Pliki CV (upload na dysk) | Potrzebuje trwałego wolumenu — to jest krytyczne |
| Google OAuth2 | **Wymaga HTTPS** — Google nie zaakceptuje HTTP w produkcji |
| Dockerfiles gotowe (backend + frontend) | Ogromna zaleta — mamy już gotowy przepis na uruchomienie |
| `docker-compose.yml` gotowy | Można uruchomić całość jedną komendą |

**Kluczowy wniosek:** Aplikacja jest już w 90% gotowa do deploymentu. Mamy Docker, mamy docker-compose, mamy `.env.example`. Pozostało tylko wybrać gdzie to uruchomić i skonfigurować zmienne środowiskowe.

---

## 2. Opcje deploymentu — porównanie

### Opcja A: VPS (Hetzner/DigitalOcean) — **REKOMENDOWANA**

| Kryterium | Wartość |
|-----------|---------|
| Koszt | ~€3.99/miesiąc (Hetzner CAX11) lub $6/miesiąc (DigitalOcean) |
| Trudność | Średnia (ale dokument niżej prowadzi krok po kroku) |
| Kontrola | Pełna |
| Persistent volumes | Tak (pliki CV są bezpieczne) |
| HTTPS | Ręcznie (Caddy — 1 plik konfiguracji, samo odnawianie certyfikatu) |
| Pasuje do docker-compose | **Tak, idealnie** |

**Dlaczego polecam:** Twój `docker-compose.yml` jest gotowy. Na VPS dosłownie kopiujesz pliki i odpalasz `docker compose up -d`. Żadnych przekształceń, żadnych nowych narzędzi.

---

### Opcja B: Railway

| Kryterium | Wartość |
|-----------|---------|
| Koszt | Free tier (ograniczone) lub $5/miesiąc |
| Trudność | Łatwa (UI klikanie) |
| Persistent volumes | Tak (dla Postgres), dla plików CV — **uwaga, patrz niżej** |
| HTTPS | Automatyczne |
| Pasuje do docker-compose | Częściowo (każdy serwis osobno) |

**Ostrzeżenie:** Railway free tier ma limity CPU/RAM i śpi po braku aktywności. Dla aplikacji Spring Boot (~500 MB RAM) darmowy tier może być za mały.

---

### Opcja C: Render

| Kryterium | Wartość |
|-----------|---------|
| Koszt | Free (ale usypia po 15 min braku aktywności!) |
| Trudność | Łatwa |
| Persistent volumes | Płatne ($) — bez tego pliki CV zginą po restarcie |
| HTTPS | Automatyczne |

**Ostrzeżenie:** Bez płatnych dysków Render nie nadaje się dla tej aplikacji — pliki CV użytkowników zginęłyby przy każdym restarcie. To poważny problem.

---

### Opcja D: Fly.io

| Kryterium | Wartość |
|-----------|---------|
| Koszt | Free tier + Postgres ~$5/miesiąc |
| Trudność | Trudna (nowe narzędzie CLI `flyctl`, `fly.toml`) |
| Persistent volumes | Tak |
| HTTPS | Automatyczne |

Dobra opcja, ale wymaga przepisania konfiguracji — nie pasuje bezpośrednio do docker-compose.

---

## 3. Rekomendacja i dlaczego

**Wybór: VPS na Hetzner + Caddy jako reverse proxy**

Powody:
1. Twój `docker-compose.yml` działa bez żadnych zmian
2. Pliki CV użytkowników są bezpieczne (persistent volume na dysku VPS)
3. Caddy automatycznie wystawia i odnawia certyfikat HTTPS (Let's Encrypt) — 1 plik konfiguracji
4. Koszt ~€4/miesiąc — tańsze niż kawa
5. Uczysz się czegoś naprawdę użytecznego (Linux + Docker na serwerze)
6. Pełna kontrola — możesz w przyszłości dodać inne projekty

---

## 4. Plan deploymentu krok po kroku (VPS + Caddy)

### Krok 0: Przygotowanie — czego potrzebujesz zanim zaczniesz

- [ ] Konto na Hetzner Cloud (hetzner.com) — karta płatnicza
- [ ] Domenę (np. easyapply.pl) — lub darmową subdomenę (freenom.com / DuckDNS)
- [ ] Konto Google Cloud Console (do OAuth2 credentials)
- [ ] Git zainstalowany lokalnie (masz)
- [ ] SSH zainstalowany lokalnie (Windows 10 ma wbudowany)

**Czas:** ~30 minut setup, potem ~1 godzina deployment

---

### Krok 1: Stwórz serwer na Hetzner

1. Zaloguj się na [console.hetzner.cloud](https://console.hetzner.cloud)
2. Stwórz nowy serwer:
   - **Lokalizacja:** Helsinki lub Falkenstein (bliżej = szybciej dla PL)
   - **Image:** Ubuntu 24.04
   - **Typ:** CX22 (2 CPU, 4 GB RAM) — **minimum dla Spring Boot** (~€3.79/mies)
   - **SSH Key:** Dodaj swój klucz SSH (patrz niżej jak wygenerować)
3. Zapisz IP serwera (np. `157.90.xxx.xxx`)

**Jak wygenerować klucz SSH (Windows):**
```bash
ssh-keygen -t ed25519 -C "your-email@gmail.com"
# Klucz publiczny jest w: C:\Users\TwojeImie\.ssh\id_ed25519.pub
# Wklej jego zawartość w Hetzner przy tworzeniu serwera
```

---

### Krok 2: Skieruj domenę na serwer

W panelu swojego dostawcy domeny dodaj rekord DNS:

```
Typ: A
Nazwa: @  (lub np. app)
Wartość: 157.90.xxx.xxx  (IP twojego serwera)
TTL: 3600
```

Jeśli chcesz subdomenę dla API:
```
Typ: A
Nazwa: api
Wartość: 157.90.xxx.xxx
```

**Uwaga:** DNS propaguje się do 24h, ale zwykle działa po kilku minutach.

---

### Krok 3: Zainstaluj Docker i Caddy na serwerze

Połącz się z serwerem:
```bash
ssh root@157.90.xxx.xxx
```

Zainstaluj Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

Zainstaluj Caddy:
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

---

### Krok 4: Skonfiguruj Google OAuth2 dla produkcji

1. Idź do [console.cloud.google.com](https://console.cloud.google.com)
2. Otwórz projekt (lub stwórz nowy)
3. APIs & Services → Credentials → OAuth 2.0 Client IDs
4. Dodaj do **Authorized redirect URIs**:
   ```
   https://your-domain.com/login/oauth2/code/google
   ```
   (To musi być HTTPS — Google nie przyjmie HTTP)
5. Skopiuj `Client ID` i `Client Secret`

---

### Krok 5: Skopiuj projekt na serwer

Na serwerze:
```bash
mkdir -p /opt/easyapply
cd /opt/easyapply
git clone https://github.com/TwojeKonto/EasyApply.git .
```

Lub jeśli repo jest prywatne, skopiuj pliki przez `scp`:
```bash
# Z lokalnego komputera:
scp -r /path/to/local/project root@SERVER_IP:/opt/easyapply
```

---

### Krok 6: Stwórz plik `.env` z produkcyjnymi wartościami

Na serwerze, w katalogu `/opt/easyapply`:
```bash
cp .env.example .env
nano .env
```

Wypełnij:
```env
# Baza danych
POSTGRES_DB=easyapply_db
POSTGRES_USER=easyapply_user
POSTGRES_PASSWORD=your_strong_random_password   # CHANGE to a random value

# Backend
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Frontend — URL do API (baked in przy buildzie!)
VITE_API_URL=https://your-domain.com/api

# Google OAuth2
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# Frontend URL (do redirectu po OAuth2)
FRONTEND_URL=https://your-domain.com
```

**Ważne:** Plik `.env` zawiera hasła — nigdy nie commituj go do gita!

---

### Krok 7: Skonfiguruj Caddy (HTTPS + reverse proxy)

Stwórz plik `/etc/caddy/Caddyfile`:
```
nano /etc/caddy/Caddyfile
```

Zawartość:
```caddyfile
your-domain.com {
    # Przekaż cały ruch do frontendu (port 80)
    reverse_proxy localhost:80

    # Ale /api/* idzie do backendu (port 8080)
    handle /api/* {
        reverse_proxy localhost:8080
    }

    # OAuth2 callback też idzie do backendu
    handle /oauth2/* {
        reverse_proxy localhost:8080
    }

    handle /login/oauth2/* {
        reverse_proxy localhost:8080
    }

    handle /actuator/* {
        reverse_proxy localhost:8080
    }
}
```

Uruchom/przeładuj Caddy:
```bash
systemctl reload caddy
```

Caddy automatycznie wystawia certyfikat HTTPS od Let's Encrypt. Zero konfiguracji SSL z Twojej strony.

---

### Krok 8: Uruchom aplikację

```bash
cd /opt/easyapply
docker compose up -d --build
```

Sprawdź czy działa:
```bash
docker compose ps           # wszystkie kontenery powinny być "healthy"
docker compose logs backend # logi backendu
```

Po ~60 sekundach (Spring Boot potrzebuje czasu na start) otwórz:
```
https://your-domain.com
```

---

### Krok 9: Zweryfikuj że wszystko działa

- [ ] Strona otwiera się przez HTTPS (kłódka w przeglądarce)
- [ ] Przycisk "Login with Google" działa
- [ ] Po zalogowaniu widać Kanban board
- [ ] Można dodać aplikację
- [ ] Można uploadować CV
- [ ] Logout działa

---

## 5. Pułapki i zagrożenia — czego uważać

### Pułapka 1: VITE_API_URL jest baked-in przy buildzie

React/Vite buduje statyczne pliki HTML/JS. Wartość `VITE_API_URL` jest **wkompilowana** w te pliki w momencie budowania — nie można jej zmienić bez przebudowania.

**Konsekwencja:** Jeśli zbudujesz z `VITE_API_URL=http://localhost:8080/api` to w produkcji frontend będzie próbował łączyć się z localhost — i nic nie zadziała.

**Rozwiązanie:** Upewnij się, że w `.env` przed `docker compose build` masz poprawny URL produkcyjny.

---

### Pułapka 2: Google OAuth2 wymaga HTTPS

Google nie pozwoli na OAuth2 callback przez HTTP. Musisz mieć domenę z HTTPS zanim skonfigurujesz OAuth2 credentials.

**Rozwiązanie:** Caddy z punktu 7 załatwia to automatycznie.

---

### Pułapka 3: Pliki CV zginą przy `docker compose down -v`

Flaga `-v` usuwa wolumeny (w tym `uploads_data` z plikami CV użytkowników).

**Zasada:** Nigdy nie używaj `docker compose down -v` w produkcji. Używaj tylko `docker compose down` (bez `-v`).

---

### Pułapka 4: Hasło do bazy danych w `.env` — nie commituj do gita

Plik `.env` zawiera hasła. Sprawdź że jest w `.gitignore`:
```bash
grep "\.env" .gitignore
```

Powinno zwrócić `.env` (ale nie `.env.example`).

---

### Pułapka 5: Backup bazy danych

Dane aplikacji są w wolumenie `postgres_data`. Docker Compose nie robi backupów automatycznie.

**Minimum:** Raz na tydzień zrób backup ręcznie:
```bash
docker exec easyapply-db pg_dump -U easyapply_user easyapply_db > backup_$(date +%Y%m%d).sql
```

---

### Pułapka 6: Port 5432 wystawiony publicznie

Obecny `docker-compose.yml` ma:
```yaml
ports:
  - "5432:5432"   # baza danych dostępna z internetu!
```

To jest zagrożenie bezpieczeństwa — baza danych nie powinna być dostępna z zewnątrz.

**Napraw przed deploymentem** — usuń tę linię z sekcji `db`:
```yaml
# Usuń lub zakomentuj te 2 linie:
ports:
  - "5432:5432"
```

Backend łączy się z bazą przez wewnętrzną sieć Docker (`easyapply-network`), więc nie potrzebuje tego portu.

---

### Pułapka 7: `SPRING_PROFILES_ACTIVE` w docker-compose.yml jest hardcoded

W pliku `docker-compose.yml` backend ma:
```yaml
environment:
  SPRING_PROFILES_ACTIVE: dev   # hardcoded na "dev" !
```

Ta wartość nadpisuje zmienną z `.env`. Zmień na:
```yaml
SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
```

---

## 6. Jak robić aktualizacje po deploymencie

Gdy zmienisz kod i chcesz zaktualizować produkcję:

```bash
cd /opt/easyapply
git pull                          # pobierz zmiany
docker compose build              # przebuduj obrazy
docker compose up -d              # uruchom (zero downtime dla DB)
```

Spring Boot ma start period 60s — przez chwilę strona może być niedostępna.

---

## 7. Monitoring — jak sprawdzić czy aplikacja działa

Sprawdź status kontenerów:
```bash
docker compose ps
```

Sprawdź logi na żywo:
```bash
docker compose logs -f backend    # logi backendu
docker compose logs -f frontend   # logi nginx
```

Health check backendu (publiczny endpoint):
```
https://your-domain.com/actuator/health
```
Powinno zwrócić: `{"status":"UP"}`

---

## 8. Podsumowanie — lista kontrolna przed deploymentem

### Wymagane zmiany w kodzie
- [ ] `docker-compose.yml`: usunąć `ports: 5432:5432` z serwisu `db`
- [ ] `docker-compose.yml`: zmienić `SPRING_PROFILES_ACTIVE: dev` na `${SPRING_PROFILES_ACTIVE:-prod}`

### Wymagane przygotowania
- [ ] Konto Hetzner + serwer CX22 (Ubuntu 24.04)
- [ ] Domena skierowana na IP serwera (rekord A w DNS)
- [ ] Google OAuth2 credentials z redirect URI na HTTPS domenę
- [ ] Plik `.env` z produkcyjnymi wartościami (nigdy nie commitować!)

### Kolejność działań
1. Serwer → DNS → Google OAuth2 credentials
2. Docker + Caddy na serwerze
3. Sklonuj repo, stwórz `.env`
4. `docker compose up -d --build`
5. Sprawdź `https://your-domain.com/actuator/health`
6. Przetestuj logowanie Google

---

## 9. Koszty szacowane

| Pozycja | Koszt |
|---------|-------|
| Hetzner CX22 VPS | ~€3.79/miesiąc |
| Domena .pl | ~50 PLN/rok (~4 PLN/miesiąc) |
| HTTPS (Let's Encrypt via Caddy) | Darmowe |
| **Razem** | ~€4-5/miesiąc (~20 PLN) |

Dla 50 użytkowników CX22 (4 GB RAM) jest wystarczający. Spring Boot potrzebuje ~500 MB, PostgreSQL ~200 MB, zostaje ~3 GB zapasu.
