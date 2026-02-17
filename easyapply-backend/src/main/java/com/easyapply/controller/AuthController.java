package com.easyapply.controller;

import com.easyapply.dto.UserResponse;
import com.easyapply.entity.User;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.security.JwtService;
import com.easyapply.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;

/**
 * Endpointy autentykacji.
 *
 * /api/auth/me      — zwraca dane zalogowanego użytkownika (wymaga JWT)
 * /api/auth/refresh — wydaje nowy access token na podstawie refresh token cookie
 * /api/auth/logout  — unieważnia refresh token
 *
 * Endpoint logowania (/oauth2/authorization/google) obsługuje Spring Security automatycznie —
 * nie potrzebujemy go tu implementować.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    /**
     * Zwraca profil zalogowanego użytkownika.
     * @AuthenticationPrincipal wstrzykuje AuthenticatedUser zbudowany przez JwtAuthenticationConverter
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        User user = userService.getById(authenticatedUser.id());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    /**
     * Wydaje nowy access token na podstawie refresh token przesłanego w httpOnly cookie.
     *
     * Dlaczego cookie, a nie body?
     * Cookie httpOnly nie jest dostępne dla JavaScript (ochrona przed XSS).
     * Przeglądarka wysyła je automatycznie przy każdym żądaniu do /api/auth.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Brak refresh token"));
        }

        // Znajdź użytkownika po refresh token i sprawdź ważność
        // Szukamy przez UserRepository — musimy dodać metodę findByRefreshToken
        // Na razie używamy uproszczonego podejścia przez UserService
        try {
            User user = userService.findByValidRefreshToken(refreshToken);
            String newAccessToken = jwtService.generateAccessToken(user);
            return ResponseEntity.ok(Map.of("token", newAccessToken));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Nieprawidłowy lub wygasły refresh token"));
        }
    }

    /**
     * Wylogowuje użytkownika: czyści refresh token w bazie i usuwa cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            HttpServletResponse response) {

        User user = userService.getById(authenticatedUser.id());
        userService.clearRefreshToken(user);

        // Usuń cookie po stronie klienta (max-age=0)
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.noContent().build();
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
