package com.easyapply.security;

import com.easyapply.service.UserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Serwis ładujący dane użytkownika po udanym logowaniu przez Google.
 *
 * Przepływ:
 * 1. Użytkownik przeklikał okno Google i zaakceptował uprawnienia
 * 2. Google wysłał kod autoryzacyjny do Spring Security
 * 3. Spring wymienił kod na access token Google i pobrał profil użytkownika
 * 4. Spring wywołuje loadUser() — tu wchodzimy
 * 5. Robimy "upsert": tworzymy nowego usera lub aktualizujemy istniejącego
 * 6. Zwracamy OAuth2User (Spring potrzebuje go do dalszego przetwarzania)
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    public CustomOAuth2UserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Pobierz profil użytkownika od Google (id, email, name, picture)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Wyciągnij potrzebne dane z profilu Google
        String googleId = oAuth2User.getAttribute("sub");   // unikalny ID w Google
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Upsert: znajdź lub stwórz usera w naszej bazie
        userService.findOrCreateUser(googleId, email, name);

        return oAuth2User;
    }
}
