package com.easyapply.security;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Adnotacja testowa — wstrzykuje AuthenticatedUser do SecurityContext przed każdym testem.
 *
 * Jak działa @WithSecurityContext w Spring Security Test:
 *   Przed wykonaniem metody testowej JUnit uruchamia WithSecurityContextTestExecutionListener.
 *   Listener wywołuje WithMockAuthenticatedUserSecurityContextFactory, która buduje SecurityContext
 *   z naszym AuthenticatedUser jako principal. Dzięki temu kontrolery odczytają właściwy obiekt
 *   z @AuthenticationPrincipal AuthenticatedUser user.
 *
 * Stały userId "11111111-..." musi pasować do UUID użytkownika tworzonego w @BeforeEach
 * testów, które wykonują operacje scopowane do użytkownika (np. tworzenie aplikacji).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockAuthenticatedUserSecurityContextFactory.class)
public @interface WithMockAuthenticatedUser {
    String userId() default "11111111-1111-1111-1111-111111111111";
    String email()  default "test@example.com";
    String name()   default "Test User";
}
