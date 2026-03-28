package com.easyapply.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;

/**
 * Converts a validated JWT into a Spring Security Authentication object.
 *
 * After validating the JWT, Spring Security calls this converter to transform
 * the token into an Authentication object stored in the SecurityContext.
 *
 * We extract userId (sub), email, and name from the token claims and build
 * an AuthenticatedUser, which is then available via @AuthenticationPrincipal in controllers.
 *
 * Technical detail:
 * JwtAuthenticationToken.getPrincipal() returns the raw Jwt object by default.
 * We override this by using a subclass with a custom getPrincipal().
 */
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        AuthenticatedUser authenticatedUser = new AuthenticatedUser(userId, email, name);

        // Returns a token whose getPrincipal() = AuthenticatedUser
        return new AuthenticatedUserToken(jwt, authenticatedUser);
    }

    /**
     * Inner subclass of JwtAuthenticationToken with AuthenticatedUser as the principal.
     * This makes @AuthenticationPrincipal AuthenticatedUser work out of the box.
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
