package com.easyapply.service;

import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.StageHistoryRepository;
import com.easyapply.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final StageHistoryRepository stageHistoryRepository;
    private final MessageSource messageSource;

    public UserService(
            UserRepository userRepository,
            ApplicationRepository applicationRepository,
            StageHistoryRepository stageHistoryRepository,
            MessageSource messageSource) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.stageHistoryRepository = stageHistoryRepository;
        this.messageSource = messageSource;
    }

    /**
     * Upsert użytkownika na podstawie google_id.
     *
     * Logika:
     * - Szukamy usera po google_id
     * - Jeśli istnieje: aktualizujemy email i name (mógł zmienić w Google)
     * - Jeśli nie istnieje: tworzymy nowego i dodajemy mu demo aplikację
     */
    @Transactional
    public User findOrCreateUser(String googleId, String email, String name) {
        return userRepository.findByGoogleId(googleId)
                .map(existingUser -> {
                    existingUser.updateProfile(name, email);
                    log.debug("User {} logged in (existing)", email);
                    return existingUser;
                })
                .orElseGet(() -> {
                    User newUser = new User(email, name, googleId);
                    User saved = userRepository.save(newUser);
                    log.info("New user registered: {}", email);
                    createDemoApplication(saved);
                    return saved;
                });
    }

    @Transactional(readOnly = true)
    public User getByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));
    }

    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));
    }

    @Transactional
    public void saveRefreshToken(User user, String refreshToken, LocalDateTime expiry) {
        user.setRefreshToken(refreshToken, expiry);
        userRepository.save(user);
    }

    @Transactional
    public void clearRefreshToken(User user) {
        user.clearRefreshToken();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User findByValidRefreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.token.invalid", null, LocaleContextHolder.getLocale())));

        if (!user.isRefreshTokenValid(refreshToken)) {
            throw new IllegalStateException(messageSource.getMessage("error.token.expired", null, LocaleContextHolder.getLocale()));
        }

        return user;
    }

    // =========================================================================
    // DEMO APPLICATION
    // Tworzona automatycznie dla każdego nowego użytkownika.
    // Logika przeniesiona z frontendu (ensureDemoApplication w api.js) na backend.
    // =========================================================================
    private void createDemoApplication(User user) {
        Application demo = new Application();
        demo.setUser(user);
        demo.setCompany("Google");
        demo.setPosition("Junior Software Engineer");
        demo.setSalaryMin(7000);
        demo.setSalaryMax(8000);
        demo.setCurrency("PLN");
        demo.setSalaryType(SalaryType.NETTO);
        demo.setContractType(ContractType.UOP);
        demo.setSource("JustJoinIT");
        demo.setLink("https://justjoin.it/");
        demo.setStatus(ApplicationStatus.WYSLANE);
        demo.setJobDescription("""
                🚀 Junior Software Developer (Java)

                Szukamy pasjonata programowania, który dołączy do naszego zespołu!

                Wymagania:
                • Znajomość Java 11+
                • Podstawy Spring Boot
                • Git, SQL
                • Chęć do nauki

                Oferujemy:
                • Pracę zdalną lub hybrydową
                • Mentoring senior developerów
                • Budżet na szkolenia
                • Sprzęt według potrzeb

                To jest przykładowa aplikacja — możesz ją usunąć lub zmodyfikować!
                """);

        Application saved = applicationRepository.save(demo);

        StageHistory initialStage = new StageHistory(saved, "Wysłane");
        stageHistoryRepository.save(initialStage);

        log.info("Demo application created for new user {}", user.getEmail());
    }
}
