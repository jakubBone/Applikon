package com.easyapply.security;

import com.easyapply.entity.User;
import com.nimbusds.jose.jwk.RSAKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Serwis odpowiedzialny za generowanie i walidację tokenów JWT.
 *
 * Używamy RS256 (asymetryczny):
 * - klucz prywatny (RSAKey) → podpisuje tokeny (tylko backend zna)
 * - klucz publiczny → weryfikuje tokeny (można udostępnić np. fronendowi)
 *
 * JwtEncoder  = Spring-owy encoder (produkuje tokeny)
 * JwtDecoder  = Spring-owy decoder (weryfikuje tokeny) — skonfigurowany w SecurityConfig
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${app.jwt.access-token-expiry-minutes:15}")
    private long accessTokenExpiryMinutes;

    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    /**
     * Generuje access token dla zalogowanego użytkownika.
     *
     * Payload (claims) tokenu:
     * - sub  = UUID użytkownika (subject — kto to jest)
     * - email, name = dane profilowe
     * - iss  = issuer (kto wystawił token)
     * - iat  = issued at (kiedy wystawiono)
     * - exp  = expiry (kiedy wygasa)
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("easyapply")
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .issuedAt(now)
                .expiresAt(now.plus(accessTokenExpiryMinutes, ChronoUnit.MINUTES))
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    /**
     * Generuje refresh token — losowe UUID.
     * Sam token jest nieprzezroczysty (opaque), nie zawiera danych.
     * Przechowywany w httpOnly cookie po stronie klienta.
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }
}
