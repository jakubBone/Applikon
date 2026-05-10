package com.applikon.security;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Test annotation — injects an AuthenticatedUser into the SecurityContext before each test.
 *
 * How @WithSecurityContext works in Spring Security Test:
 *   Before the test method runs, JUnit triggers WithSecurityContextTestExecutionListener.
 *   The listener calls WithMockAuthenticatedUserSecurityContextFactory, which builds a SecurityContext
 *   with our AuthenticatedUser as the principal. This allows controllers to read the correct object
 *   via @AuthenticationPrincipal AuthenticatedUser user.
 *
 * The fixed userId "11111111-..." must match the UUID of the user created in @BeforeEach
 * in tests that perform user-scoped operations (e.g. creating applications).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockAuthenticatedUserSecurityContextFactory.class)
public @interface WithMockAuthenticatedUser {
    String userId() default "11111111-1111-1111-1111-111111111111";
    String email()  default "test@example.com";
    String name()   default "Test User";
}
