package com.easyapply.config;

import com.easyapply.security.JwtAuthenticationConverter;
import com.easyapply.security.OAuth2AuthenticationSuccessHandler;
import com.easyapply.security.CustomOAuth2UserService;
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
 * Centralna konfiguracja Spring Security.
 *
 * Odpowiada za:
 * 1. Generowanie pary kluczy RSA do podpisywania JWT (RS256)
 * 2. Konfigurację JwtEncoder i JwtDecoder (beany używane przez JwtService i filtr Security)
 * 3. Reguły dostępu do endpointów (kto może, kto nie może)
 * 4. Konfigurację OAuth2 Login (Google)
 * 5. Konfigurację OAuth2 Resource Server (walidacja JWT przy każdym żądaniu)
 * 6. CORS (zastępuje stary CorsConfig.java — Security musi wiedzieć o CORS przed sprawdzeniem auth)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    private final CustomOAuth2UserService customOAuth2UserService;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    // =====================================================================
    // RSA KEY PAIR
    // Generujemy przy starcie aplikacji. W środowisku produkcyjnym można
    // załadować z env (PEM), ale dla uproszczenia generujemy in-memory.
    // Konsekwencja: po restarcie serwera stare JWT przestają być ważne
    // (akceptowalne — access token i tak żyje 15 minut).
    // =====================================================================
    @Bean
    public RSAKey rsaKey() throws Exception {
        return new RSAKeyGenerator(2048)
                .keyID("easyapply-key")
                .generate();
    }

    /**
     * JWKSource to "skarbiec kluczy" — Nimbus (biblioteka JWT pod spodem)
     * pyta go: "jakim kluczem mam podpisać/zweryfikować token?"
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    /**
     * JwtEncoder — tworzy (podpisuje) tokeny JWT.
     * Używany przez JwtService.generateAccessToken().
     */
    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    /**
     * JwtDecoder — weryfikuje tokeny JWT przy każdym żądaniu API.
     * Spring Security automatycznie wywołuje go dla każdego requestu
     * z headerem "Authorization: Bearer <token>".
     */
    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws Exception {
        return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
    }

    // =====================================================================
    // SECURITY FILTER CHAIN
    // Tutaj definiujemy WSZYSTKIE reguły bezpieczeństwa aplikacji.
    // Pomijamy ten bean w profilu "test" — TestSecurityConfig dostarcza własny
    // łańcuch z permitAll(). Pozostałe beany (RSAKey, JwtEncoder, JwtDecoder)
    // pozostają aktywne we wszystkich profilach, bo JwtService ich wymaga.
    // =====================================================================
    @Bean
    @Profile("!test")
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtDecoder jwtDecoder,
            OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) throws Exception {
        return http
                // CSRF wyłączone — używamy JWT (bezstanowe), nie sesji/cookies z formularzy
                .csrf(AbstractHttpConfigurer::disable)

                // CORS — Spring Security musi znać reguły CORS zanim sprawdzi autentykację
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Bezstanowe sesje — żadnych HttpSession, tylko JWT
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Reguły dostępu do endpointów
                .authorizeHttpRequests(auth -> auth
                        // Endpointy publiczne
                        .requestMatchers("/api/auth/refresh").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // Wszystko inne wymaga JWT
                        .anyRequest().authenticated()
                )

                // OAuth2 Login — obsługa przekierowania Google
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                )

                // OAuth2 Resource Server — walidacja JWT przy każdym żądaniu /api/**
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)))

                .build();
    }

    // =====================================================================
    // CORS CONFIGURATION
    // Zastępuje stary CorsConfig.java. Spring Security musi obsługiwać CORS
    // na poziomie filtrów (przed sprawdzeniem auth), nie na poziomie MVC.
    // =====================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
