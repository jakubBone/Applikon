package com.easyapply.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtr HTTP dodający userId do MDC (Mapped Diagnostic Context) na czas trwania requestu.
 *
 * MDC to mechanizm SLF4J/Logback, który pozwala dołączyć do każdego logu
 * dane kontekstowe (np. userId) bez jawnego przekazywania ich do każdej metody.
 * Wartości z MDC są automatycznie drukowane w każdej linii logu jeśli pattern
 * Logbacka zawiera %X{userId}.
 *
 * Filtr działa po Spring Security (SecurityContextHolder jest już wypełniony),
 * więc może bezpiecznie odczytać dane zalogowanego użytkownika.
 */
@Component
public class MdcUserFilter extends OncePerRequestFilter {

    private static final String MDC_KEY = "userId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
                MDC.put(MDC_KEY, user.id().toString());
            }
            filterChain.doFilter(request, response);
        } finally {
            // ZAWSZE czyść MDC po zakończeniu requestu.
            // Pule wątków (thread pool) reużywają wątki — bez czyszczenia
            // następny request na tym samym wątku zobaczyłby userId poprzedniego użytkownika.
            MDC.remove(MDC_KEY);
        }
    }
}
