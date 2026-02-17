package com.easyapply.security;

import java.util.UUID;

/**
 * Obiekt reprezentujący zalogowanego użytkownika w kontekście żądania.
 *
 * Spring Security po zwalidowaniu JWT wstrzykuje ten obiekt
 * bezpośrednio do metod kontrolerów via @AuthenticationPrincipal:
 *
 *   public ResponseEntity<?> getApplications(@AuthenticationPrincipal AuthenticatedUser user) {
 *       // user.id() = UUID użytkownika z bazy
 *   }
 *
 * Zbudowany z claims tokenu JWT przez JwtAuthenticationConverter.
 */
public record AuthenticatedUser(UUID id, String email, String name) {}
