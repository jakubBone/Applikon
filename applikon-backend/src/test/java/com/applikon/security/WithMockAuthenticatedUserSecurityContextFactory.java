package com.applikon.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.util.Collections;
import java.util.UUID;

/**
 * SecurityContext factory for @WithMockAuthenticatedUser.
 *
 * Spring Security Test calls createSecurityContext() before each test annotated with
 * @WithMockAuthenticatedUser. Here we build a SecurityContext with an Authentication where:
 *   - principal   = AuthenticatedUser (our custom record with id/email/name)
 *   - credentials = null (no password — this is a mock, not a real login)
 *   - authorities = empty list (no roles — not used in this application)
 *
 * We use UsernamePasswordAuthenticationToken as the Authentication carrier because:
 *   - It is a standard, immutable Authentication container in Spring Security
 *   - It requires no real JWT or OAuth2 — sufficient for testing purposes
 *   - Spring's @AuthenticationPrincipal reads the principal regardless of the Authentication type
 */
public class WithMockAuthenticatedUserSecurityContextFactory
        implements WithSecurityContextFactory<WithMockAuthenticatedUser> {

    @Override
    public SecurityContext createSecurityContext(WithMockAuthenticatedUser annotation) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        AuthenticatedUser principal = new AuthenticatedUser(
                UUID.fromString(annotation.userId()),
                annotation.email(),
                annotation.name()
        );

        Authentication auth = new UsernamePasswordAuthenticationToken(
                principal, null, Collections.emptyList());

        context.setAuthentication(auth);
        return context;
    }
}
