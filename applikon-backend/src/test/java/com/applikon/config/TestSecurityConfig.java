package com.applikon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Test security configuration — active only for the "test" profile.
 *
 * Problem to solve:
 *   The main SecurityConfig requires JWT for EVERY request (.anyRequest().authenticated()).
 *   Controller tests do not generate real JWT tokens — they would all receive 401.
 *
 * Solution:
 *   Register a second SecurityFilterChain with @Order(1) (higher priority than the default 100).
 *   Spring Security selects the FIRST matching filter chain — this one with Order(1) matches
 *   all requests and permits them. The main chain (Order 100) is not used in tests.
 *
 * Note: User authentication in controllers (@AuthenticationPrincipal) is handled separately
 *   by the @WithMockAuthenticatedUser annotation, which injects an AuthenticatedUser object
 *   into the SecurityContext before each test.
 */
@Configuration
@Profile("test")
public class TestSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
