package com.easyapply.security;

import com.easyapply.entity.User;
import com.easyapply.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Handler invoked after a successful Google login.
 *
 * Responsibilities:
 * 1. Load the User from the database (by google_id)
 * 2. Generate an access token (JWT, 15 min)
 * 3. Generate a refresh token (opaque UUID)
 * 4. Persist the refresh token in the database (attached to the user)
 * 5. Set the refresh token as an httpOnly cookie
 * 6. Redirect the frontend to /auth/callback#token=<JWT>
 *
 * Why redirect with the token in the URL?
 * OAuth2 is a redirect-based flow. Spring cannot "return" JSON to the frontend
 * after OAuth2 — it must redirect. The frontend reads the token from the URL,
 * removes it from the address bar, and keeps it in memory.
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private int refreshTokenExpiryDays;

    private final UserService userService;
    private final JwtService jwtService;

    public OAuth2AuthenticationSuccessHandler(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User user = userService.findOrCreateUser(googleId, email, name);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Persist the refresh token
        LocalDateTime expiry = LocalDateTime.now().plusDays(refreshTokenExpiryDays);
        userService.saveRefreshToken(user, refreshToken, expiry);

        // Set refresh token as an httpOnly cookie
        Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
        refreshCookie.setHttpOnly(true);    // not accessible to JavaScript (XSS protection)
        refreshCookie.setSecure(true);      // HTTPS only
        refreshCookie.setPath("/api/auth"); // sent only to /api/auth
        refreshCookie.setAttribute("SameSite", "Strict"); // CSRF protection: only from easyapply.com
        refreshCookie.setMaxAge(refreshTokenExpiryDays * 24 * 60 * 60);
        response.addCookie(refreshCookie);

        log.info("User {} logged in via Google", user.getId());

        // Token in fragment — not sent to the server in subsequent requests (stays client-side only)
        String redirectUrl = frontendUrl + "/auth/callback#token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
