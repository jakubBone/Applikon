# Plan implementacji logout — EasyApply Backend

## Proces pracy (obowiązujący dla każdego etapu)

1. **Implementacja** — Claude robi zmiany w kodzie
2. **Weryfikacja automatyczna** — `mvn test`, musi być zielony
3. **Weryfikacja manualna** — użytkownik testuje endpoint ręcznie (opcjonalnie)
4. **Aktualizacja planów** — Claude aktualizuje checkboxy w tym pliku
5. **Sugestia commita** — Claude proponuje wiadomość commita (format: `type(backend): opis`)
6. **Commit** — użytkownik sam robi `git add` + `git commit`
7. **Pytanie o kontynuację** — Claude pyta czy idziemy dalej do następnego etapu

---

## Status realizacji

### Etap 0 — Weryfikacja stanu (brak implementacji wymagana)

- [x] `controller/AuthController.java` — endpoint `POST /api/auth/logout` istnieje
- [x] Endpoint: usuwa `refreshToken` z DB przez `userService.clearRefreshToken(user)`
- [x] Endpoint: ustawia cookie `refresh_token` z `maxAge=0` (kasuje po stronie klienta)
- [x] Endpoint: wymaga aktywnego JWT (`@AuthenticationPrincipal AuthenticatedUser`)
- [x] `mvn test` zielony

> Backend jest kompletny. Żadne zmiany w kodzie produkcyjnym nie są wymagane.

---

## Architektura endpointu

```
POST /api/auth/logout
Authorization: Bearer <access_token>
→ 204 No Content

Efekty uboczne:
  1. User.refreshToken = null  (w DB)
  2. Cookie refresh_token      (usunięty przez maxAge=0)
```

**Dlaczego JWT nie jest unieważniany?**
Access token jest stateless — nie da się go unieważnić bez blacklisty tokenów.
Wylogowanie usuwa refresh token, przez co użytkownik nie może odnowić sesji po wygaśnięciu access tokena.
Frontend usuwa access token z localStorage natychmiast po wywołaniu logout.

---

## Poza zakresem

- Blacklisting access tokenów — nadmiarowe dla tej aplikacji
- Wylogowanie ze wszystkich urządzeń — osobny feature

---

*Ostatnia aktualizacja: 2026-04-07*
