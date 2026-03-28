package com.easyapply.controller;

import com.easyapply.dto.UserResponse;
import com.easyapply.entity.User;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.security.JwtService;
import com.easyapply.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

/**
 * Authentication endpoints.
 *
 * /api/auth/me      — returns the currently authenticated user's profile (requires JWT)
 * /api/auth/refresh — issues a new access token based on the refresh token cookie
 * /api/auth/logout  — invalidates the refresh token
 *
 * The login endpoint (/oauth2/authorization/google) is handled automatically by Spring Security.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final MessageSource messageSource;

    public AuthController(UserService userService, JwtService jwtService, MessageSource messageSource) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.messageSource = messageSource;
    }

    /**
     * Returns the authenticated user's profile.
     * @AuthenticationPrincipal injects the AuthenticatedUser built by JwtAuthenticationConverter.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        User user = userService.getById(authenticatedUser.id());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    /**
     * Issues a new access token based on the refresh token sent in an httpOnly cookie.
     *
     * Why a cookie and not the request body?
     * An httpOnly cookie is not accessible to JavaScript (protection against XSS).
     * The browser sends it automatically with every request to /api/auth.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error",
                    messageSource.getMessage("error.token.missing", null, LocaleContextHolder.getLocale())));
        }

        try {
            User user = userService.findByValidRefreshToken(refreshToken);
            String newAccessToken = jwtService.generateAccessToken(user);
            return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error",
                    messageSource.getMessage("error.token.invalid", null, LocaleContextHolder.getLocale())));
        }
    }

    /**
     * Logs out the user: clears the refresh token in the database and removes the cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            HttpServletResponse response) {

        User user = userService.getById(authenticatedUser.id());
        userService.clearRefreshToken(user);

        // Clear the cookie on the client side (max-age=0)
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.noContent().build();
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
