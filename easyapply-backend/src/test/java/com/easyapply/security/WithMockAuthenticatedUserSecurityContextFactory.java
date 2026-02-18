package com.easyapply.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.util.Collections;
import java.util.UUID;

/**
 * Fabryka SecurityContext dla @WithMockAuthenticatedUser.
 *
 * Spring Security Test wywołuje createSecurityContext() przed każdym testem oznaczonym
 * @WithMockAuthenticatedUser. Tworzymy tu SecurityContext z Authentication, gdzie:
 *   - principal = AuthenticatedUser (nasz własny rekord z id/email/name)
 *   - credentials = null (brak hasła — to mock, nie prawdziwe logowanie)
 *   - authorities = pusta lista (brak ról — w naszej aplikacji nie używamy)
 *
 * Używamy UsernamePasswordAuthenticationToken jako nośnika Authentication, bo:
 *   - Jest standardowym, niemutowalnym kontenerem Authentication w Spring Security
 *   - Nie wymaga prawdziwego JWT ani OAuth2 — wystarczy na potrzeby testów
 *   - Spring's @AuthenticationPrincipal odczyta principal niezależnie od typu Authentication
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
