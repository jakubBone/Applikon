package com.easyapply.config;

import com.easyapply.security.AdminKeyFilter;
import com.easyapply.security.JwtAuthenticationConverter;
import com.easyapply.security.OAuth2AuthenticationSuccessHandler;
import com.easyapply.security.CustomOAuth2UserService;
import com.easyapply.security.ConsentRequiredFilter;
import com.easyapply.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Central Spring Security configuration.
 *
 * Responsible for:
 * 1. Generating the RSA key pair for signing JWTs (RS256)
 * 2. Configuring JwtEncoder and JwtDecoder (used by JwtService and the Security filter)
 * 3. Endpoint access rules (who can and cannot access)
 * 4. OAuth2 Login configuration (Google)
 * 5. OAuth2 Resource Server configuration (JWT validation on every request)
 * 6. CORS (Security must handle CORS before checking auth)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    private final CustomOAuth2UserService customOAuth2UserService;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final UserRepository userRepository;

    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            UserRepository userRepository) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
        this.userRepository = userRepository;
    }

    // =====================================================================
    // RSA KEY PAIR
    // Generated at application startup. In production this can be loaded
    // from an env variable (PEM), but for simplicity we generate in-memory.
    // Consequence: after a server restart old JWTs become invalid
    // (acceptable — the access token lives only 15 minutes anyway).
    // =====================================================================
    @Bean
    public RSAKey rsaKey() throws Exception {
        return new RSAKeyGenerator(2048)
                .keyID("easyapply-key")
                .generate();
    }

    /**
     * JWKSource is the "key vault" — Nimbus (the underlying JWT library)
     * asks it: "which key should I use to sign/verify this token?"
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    /**
     * JwtEncoder — creates (signs) JWT tokens.
     * Used by JwtService.generateAccessToken().
     */
    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    /**
     * JwtDecoder — verifies JWT tokens on every API request.
     * Spring Security automatically calls it for every request
     * with the "Authorization: Bearer <token>" header.
     */
    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws Exception {
        return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
    }

    /**
     * ConsentRequiredFilter — guard ensuring user has accepted privacy policy.
     */
    @Bean
    public ConsentRequiredFilter consentRequiredFilter(ObjectMapper objectMapper) {
        return new ConsentRequiredFilter(userRepository, objectMapper);
    }

    // =====================================================================
    // SECURITY FILTER CHAIN
    // Defines ALL security rules for the application.
    // Skipped in the "test" profile — TestSecurityConfig provides its own
    // chain with permitAll(). The other beans (RSAKey, JwtEncoder, JwtDecoder)
    // remain active in all profiles because JwtService depends on them.
    // =====================================================================
    @Bean
    @Profile("!test")
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtDecoder jwtDecoder,
            OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
            ConsentRequiredFilter consentRequiredFilter,
            AdminKeyFilter adminKeyFilter) throws Exception {
        return http
                // CSRF disabled — we use JWT (stateless), not session/form cookies
                .csrf(AbstractHttpConfigurer::disable)

                // HTTP security headers
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                )

                // CORS — Spring Security must know CORS rules before checking authentication
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless sessions — no HttpSession, JWT only
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Endpoint access rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/refresh").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // Admin endpoint — secured by AdminKeyFilter, not JWT
                        .requestMatchers("/api/admin/**").permitAll()
                        // Everything else requires JWT
                        .anyRequest().authenticated()
                )

                // OAuth2 Login — handles Google redirect
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                )

                // OAuth2 Resource Server — validates JWT on every /api/** request
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)))

                // Add ConsentRequiredFilter after JWT authentication
                .addFilterAfter(consentRequiredFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)

                // AdminKeyFilter runs before JWT auth — checks X-Admin-Key header
                .addFilterBefore(adminKeyFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    // =====================================================================
    // CORS CONFIGURATION
    // Spring Security must handle CORS at the filter level (before auth checks)
    // =====================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Admin-Key"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
