package com.applikon.security;

import java.util.UUID;

/**
 * Represents the authenticated user within a request context.
 *
 * After validating the JWT, Spring Security injects this object
 * directly into controller methods via @AuthenticationPrincipal:
 *
 *   public ResponseEntity<?> getApplications(@AuthenticationPrincipal AuthenticatedUser user) {
 *       // user.id() = user's UUID from the database
 *   }
 *
 * Built from JWT claims by JwtAuthenticationConverter.
 */
public record AuthenticatedUser(UUID id, String email, String name) {}
