package com.applikon.observability;

import com.applikon.security.AuthenticatedUser;
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
 * Adds the authenticated userId to the MDC (Mapped Diagnostic Context) for the duration of the request.
 *
 * MDC is an SLF4J/Logback mechanism that attaches contextual data (e.g. userId) to every log line
 * without passing it explicitly through every method call.
 * MDC values are printed automatically in each log line when the Logback pattern contains %X{userId}.
 *
 * Must run AFTER Spring Security so that SecurityContextHolder is already populated —
 * Spring Boot auto-registers @Component filters after the Spring Security chain by default.
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
            // ALWAYS clear MDC after the request completes.
            // Thread pools reuse threads — without clearing, the next request
            // on the same thread would see the previous user's userId.
            MDC.remove(MDC_KEY);
        }
    }
}
