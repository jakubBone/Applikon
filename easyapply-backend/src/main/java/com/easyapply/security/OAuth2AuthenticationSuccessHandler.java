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
 * Handler wywoływany po udanym zalogowaniu przez Google.
 *
 * Odpowiada za:
 * 1. Pobranie User z bazy (na podstawie google_id)
 * 2. Wygenerowanie access token (JWT, 15 min)
 * 3. Wygenerowanie refresh token (opaque UUID)
 * 4. Zapisanie refresh token w bazie (przy userze)
 * 5. Ustawienie refresh token w httpOnly cookie
 * 6. Przekierowanie frontendu do /auth/callback?token=<JWT>
 *
 * Dlaczego redirect z tokenem w URL?
 * OAuth2 to przepływ oparty na przekierowaniach (redirect-based).
 * Spring nie może "zwrócić" JSON do frontendu po OAuth2 — musi przekierować.
 * Frontend odbiera token z URL, usuwa go z paska adresu i trzyma w pamięci.
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

        // Generuj tokeny
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();

        // Zapisz refresh token w bazie
        LocalDateTime expiry = LocalDateTime.now().plusDays(refreshTokenExpiryDays);
        userService.saveRefreshToken(user, refreshToken, expiry);

        // Ustaw refresh token jako httpOnly cookie
        Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
        refreshCookie.setHttpOnly(true);    // JavaScript nie może go odczytać
        refreshCookie.setSecure(true);      // Tylko HTTPS
        refreshCookie.setPath("/api/auth"); // Cookie wysyłane tylko do /api/auth
        refreshCookie.setMaxAge(refreshTokenExpiryDays * 24 * 60 * 60);
        response.addCookie(refreshCookie);

        log.info("User {} logged in via Google", user.getEmail());

        // Przekieruj frontend z access tokenem w URL
        String redirectUrl = frontendUrl + "/auth/callback?token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
