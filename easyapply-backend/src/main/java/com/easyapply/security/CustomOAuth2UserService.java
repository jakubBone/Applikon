package com.easyapply.security;

import com.easyapply.service.UserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Loads user data after a successful Google login.
 *
 * Flow:
 * 1. User completed the Google consent screen
 * 2. Google sent an authorization code to Spring Security
 * 3. Spring exchanged the code for a Google access token and fetched the user profile
 * 4. Spring calls loadUser() — this is where we enter
 * 5. We perform an upsert: create a new user or update the existing one
 * 6. Return the OAuth2User (Spring needs it for further processing)
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    public CustomOAuth2UserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Fetch user profile from Google (id, email, name, picture)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Extract required fields from the Google profile
        String googleId = oAuth2User.getAttribute("sub");   // unique Google ID
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Upsert: find or create the user in our database
        userService.findOrCreateUser(googleId, email, name);

        return oAuth2User;
    }
}
