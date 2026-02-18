package com.easyapply.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Testowa konfiguracja bezpieczeństwa — aktywna wyłącznie dla profilu "test".
 *
 * Problem do rozwiązania:
 *   Główny SecurityConfig wymaga JWT dla KAŻDEGO żądania (.anyRequest().authenticated()).
 *   Testy kontrolerów nie generują prawdziwych tokenów JWT — dostawałyby 401.
 *
 * Rozwiązanie:
 *   Rejestrujemy drugi SecurityFilterChain z @Order(1) (wyższy priorytet niż domyślny 100).
 *   Spring Security wybiera PIERWSZY pasujący łańcuch filtrów — ten z Order(1) dopasowuje
 *   wszystkie żądania i je przepuszcza. Główny łańcuch (Order 100) nie jest w testach używany.
 *
 * Uwaga: Autentykacja użytkownika w kontrolerach (@AuthenticationPrincipal) jest obsługiwana
 *   osobno przez adnotację @WithMockAuthenticatedUser, która wstrzykuje obiekt AuthenticatedUser
 *   do SecurityContext przed każdym testem.
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
