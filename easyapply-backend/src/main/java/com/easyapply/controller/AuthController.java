package com.easyapply.controller;

import com.easyapply.dto.UserExportResponse;
import com.easyapply.dto.UserResponse;
import com.easyapply.entity.User;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.security.JwtService;
import com.easyapply.service.UserExportService;
import com.easyapply.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpHeaders;
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
    private final UserExportService userExportService;

    public AuthController(UserService userService, JwtService jwtService,
                          MessageSource messageSource, UserExportService userExportService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.messageSource = messageSource;
        this.userExportService = userExportService;
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

    @GetMapping("/me/export")
    public ResponseEntity<UserExportResponse> exportMyData(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        UserExportResponse export = userExportService.buildExport(principal.id());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"easyapply-export.json\"")
                .body(export);
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
     * Accepts the privacy policy for the authenticated user.
     * Idempotent: if already accepted, does not overwrite the timestamp.
     */
    @PostMapping("/consent")
    public ResponseEntity<Void> acceptConsent(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        userService.acceptPrivacyPolicy(authenticatedUser.id());
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes the authenticated user's account and all related data.
     * This is a RODO right: complete account deletion (user, applications, CVs, notes, files).
     * Clears the refresh token cookie on the client side.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            HttpServletResponse response) {
        userService.deleteAccount(authenticatedUser.id());

        // Clear the cookie on the client side
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.noContent().build();
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
