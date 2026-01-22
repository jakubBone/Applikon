package com.easyapply.controller;

import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class StatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NoteRepository noteRepository;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        applicationRepository.deleteAll();
    }

    // ==================== ETAP 7: Gamifikacja Tests ====================

    @Test
    @Order(1)
    @DisplayName("GET /api/statistics/badges - zwraca statystyki odznak (brak danych)")
    void getBadges_NoData_ReturnsZeros() throws Exception {
        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(0))
                .andExpect(jsonPath("$.totalGhosting").value(0))
                .andExpect(jsonPath("$.totalOffers").value(0))
                .andExpect(jsonPath("$.sweetRevengeUnlocked").value(false))
                .andExpect(jsonPath("$.rejectionBadge.name").isEmpty())
                .andExpect(jsonPath("$.ghostingBadge.name").isEmpty());
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/statistics/badges - odznaka Rękawica przy 5 odmowach")
    void getBadges_5Rejections_ReturnsRękawica() throws Exception {
        // Tworzymy 5 odmow
        for (int i = 0; i < 5; i++) {
            createRejectedApplication("Company" + i, RejectionReason.ODMOWA_MAILOWA);
        }

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(5))
                .andExpect(jsonPath("$.rejectionBadge.name").value("Rękawica"))
                .andExpect(jsonPath("$.rejectionBadge.icon").exists())
                .andExpect(jsonPath("$.rejectionBadge.threshold").value(5))
                .andExpect(jsonPath("$.rejectionBadge.nextThreshold").value(10))
                .andExpect(jsonPath("$.rejectionBadge.nextBadgeName").value("Patelnia"));
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/statistics/badges - odznaka Patelnia przy 10 odmowach")
    void getBadges_10Rejections_ReturnsPatelnia() throws Exception {
        for (int i = 0; i < 10; i++) {
            createRejectedApplication("Company" + i, RejectionReason.ODMOWA_MAILOWA);
        }

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(10))
                .andExpect(jsonPath("$.rejectionBadge.name").value("Patelnia"))
                .andExpect(jsonPath("$.rejectionBadge.threshold").value(10))
                .andExpect(jsonPath("$.rejectionBadge.nextThreshold").value(25));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/statistics/badges - odznaka Widmo przy 5 ghostingach")
    void getBadges_5Ghostings_ReturnsWidmo() throws Exception {
        for (int i = 0; i < 5; i++) {
            createRejectedApplication("Company" + i, RejectionReason.BRAK_ODPOWIEDZI);
        }

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGhosting").value(5))
                .andExpect(jsonPath("$.ghostingBadge.name").value("Widmo"))
                .andExpect(jsonPath("$.ghostingBadge.threshold").value(5))
                .andExpect(jsonPath("$.ghostingBadge.nextThreshold").value(15))
                .andExpect(jsonPath("$.ghostingBadge.nextBadgeName").value("Cierpliwy Mnich"));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/statistics/badges - Sweet Revenge przy 10+ odmowach i 1 ofercie")
    void getBadges_10RejectionsAnd1Offer_UnlocksSweetRevenge() throws Exception {
        // 10 odmow
        for (int i = 0; i < 10; i++) {
            createRejectedApplication("Company" + i, RejectionReason.ODMOWA_MAILOWA);
        }
        // 1 oferta
        createOfferApplication("SuccessCompany");

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(10))
                .andExpect(jsonPath("$.totalOffers").value(1))
                .andExpect(jsonPath("$.sweetRevengeUnlocked").value(true));
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/statistics/badges - Sweet Revenge NIE odblokowane przy 5 odmowach i ofercie")
    void getBadges_5RejectionsAnd1Offer_SweetRevengeNotUnlocked() throws Exception {
        // 5 odmow (za malo)
        for (int i = 0; i < 5; i++) {
            createRejectedApplication("Company" + i, RejectionReason.ODMOWA_MAILOWA);
        }
        // 1 oferta
        createOfferApplication("SuccessCompany");

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(5))
                .andExpect(jsonPath("$.totalOffers").value(1))
                .andExpect(jsonPath("$.sweetRevengeUnlocked").value(false));
    }

    @Test
    @Order(7)
    @DisplayName("GET /api/statistics/badges - rozne typy odmow liczone oddzielnie")
    void getBadges_MixedRejectionTypes_CountedCorrectly() throws Exception {
        // 3 ghostingi
        for (int i = 0; i < 3; i++) {
            createRejectedApplication("Ghost" + i, RejectionReason.BRAK_ODPOWIEDZI);
        }
        // 2 odmowy mailowe
        for (int i = 0; i < 2; i++) {
            createRejectedApplication("Mail" + i, RejectionReason.ODMOWA_MAILOWA);
        }

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(5)) // 3 + 2
                .andExpect(jsonPath("$.totalGhosting").value(3));   // tylko BRAK_ODPOWIEDZI
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/statistics/badges - postep do nastepnej odznaki")
    void getBadges_ShowsProgressToNextBadge() throws Exception {
        // 7 odmow (po Rozgrzewce, przed Patelnia)
        for (int i = 0; i < 7; i++) {
            createRejectedApplication("Company" + i, RejectionReason.ODMOWA_MAILOWA);
        }

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionBadge.name").value("Rękawica"))
                .andExpect(jsonPath("$.rejectionBadge.currentCount").value(7))
                .andExpect(jsonPath("$.rejectionBadge.nextThreshold").value(10))
                .andExpect(jsonPath("$.rejectionBadge.nextBadgeName").value("Patelnia"));
    }

    @Test
    @Order(9)
    @DisplayName("GET /api/statistics/badges - liczy tylko ODMOWA (nie WYSLANE/W_PROCESIE)")
    void getBadges_OnlyCountsRejectedStatus() throws Exception {
        // 2 odmowy
        createRejectedApplication("Rejected1", RejectionReason.ODMOWA_MAILOWA);
        createRejectedApplication("Rejected2", RejectionReason.ODMOWA_MAILOWA);

        // 3 aplikacje w innych statusach (nie powinny byc liczone)
        createTestApplication("Sent", ApplicationStatus.WYSLANE);
        createTestApplication("InProcess", ApplicationStatus.W_PROCESIE);
        createOfferApplication("Offer");

        mockMvc.perform(get("/api/statistics/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRejections").value(2))
                .andExpect(jsonPath("$.totalOffers").value(1));
    }

    // ==================== Helper methods ====================

    private Application createRejectedApplication(String company, RejectionReason reason) {
        Application app = new Application();
        app.setCompany(company);
        app.setPosition("Developer");
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(ApplicationStatus.ODMOWA);
        app.setRejectionReason(reason);
        app.setAppliedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    private Application createOfferApplication(String company) {
        Application app = new Application();
        app.setCompany(company);
        app.setPosition("Developer");
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(ApplicationStatus.OFERTA);
        app.setAppliedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    private Application createTestApplication(String company, ApplicationStatus status) {
        Application app = new Application();
        app.setCompany(company);
        app.setPosition("Developer");
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(status);
        app.setAppliedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }
}
