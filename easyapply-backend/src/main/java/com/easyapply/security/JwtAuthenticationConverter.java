package com.easyapply.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;

/**
 * Konwerter JWT → obiekt Authentication (Spring Security).
 *
 * Spring Security po zwalidowaniu JWT wywołuje ten konwerter,
 * żeby zamienić token w obiekt Authentication trzymany w SecurityContext.
 *
 * Wyciągamy userId (sub), email i name z claims tokenu i budujemy
 * AuthenticatedUser, który trafia do @AuthenticationPrincipal w kontrolerach.
 *
 * Jak to działa technicznie:
 * JwtAuthenticationToken.getPrincipal() zwraca domyślnie sam obiekt Jwt.
 * Nadpisujemy to przez podklasę z własnym getPrincipal().
 */
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        AuthenticatedUser authenticatedUser = new AuthenticatedUser(userId, email, name);

        // Zwracamy specjalny token, którego getPrincipal() = AuthenticatedUser
        return new AuthenticatedUserToken(jwt, authenticatedUser);
    }

    /**
     * Wewnętrzna podklasa JwtAuthenticationToken z AuthenticatedUser jako principal.
     * Dzięki temu @AuthenticationPrincipal AuthenticatedUser user "po prostu działa".
     */
    static class AuthenticatedUserToken extends JwtAuthenticationToken {

        private final AuthenticatedUser authenticatedUser;

        AuthenticatedUserToken(Jwt jwt, AuthenticatedUser authenticatedUser) {
            super(jwt, Collections.emptyList());
            this.authenticatedUser = authenticatedUser;
        }

        @Override
        public Object getPrincipal() {
            return authenticatedUser;
        }
    }
}
