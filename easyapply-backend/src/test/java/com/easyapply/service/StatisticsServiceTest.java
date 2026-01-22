package com.easyapply.service;

import com.easyapply.dto.BadgeResponse;
import com.easyapply.dto.BadgeStatsResponse;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import com.easyapply.repository.ApplicationRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatisticsService Unit Tests - Badge Calculation Logic")
class StatisticsServiceTest {

    private static final String TEST_SESSION_ID = "test-session-123";

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    private static final List<ApplicationStatus> REJECTION_STATUSES = List.of(
            ApplicationStatus.ODMOWA,
            ApplicationStatus.ODRZUCONE
    );

    private static final List<ApplicationStatus> OFFER_STATUSES = List.of(
            ApplicationStatus.OFERTA
    );

    // ==================== BADGE CALCULATION Tests ====================

    @Nested
    @DisplayName("Rejection Badges")
    class RejectionBadgeTests {

        @Test
        @DisplayName("0 odmów - brak odznaki, następna: Rękawica przy 5")
        void noBadge_ZeroRejections() {
            mockCounts(0, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertNull(response.getRejectionBadge().getName());
            assertNull(response.getRejectionBadge().getIcon());
            assertEquals(0, response.getRejectionBadge().getThreshold());
            assertEquals(5, response.getRejectionBadge().getNextThreshold());
            assertEquals("Rękawica", response.getRejectionBadge().getNextBadgeName());
        }

        @ParameterizedTest
        @CsvSource({
                "5, Rękawica, 🥊, 5, 10, Patelnia",
                "7, Rękawica, 🥊, 5, 10, Patelnia",
                "9, Rękawica, 🥊, 5, 10, Patelnia"
        })
        @DisplayName("5-9 odmów = Rękawica")
        void rozgrzewka_5to9Rejections(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(count, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
            assertEquals(threshold, badge.getThreshold());
            assertEquals(nextThreshold, badge.getNextThreshold());
            assertEquals(nextName, badge.getNextBadgeName());
            assertEquals(count, badge.getCurrentCount());
        }

        @ParameterizedTest
        @CsvSource({
                "10, Patelnia, 🍳, 10, 25, Niezniszczalny",
                "15, Patelnia, 🍳, 10, 25, Niezniszczalny",
                "24, Patelnia, 🍳, 10, 25, Niezniszczalny"
        })
        @DisplayName("10-24 odmów = Patelnia")
        void patelnia_10to24Rejections(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(count, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
            assertEquals(threshold, badge.getThreshold());
            assertEquals(nextThreshold, badge.getNextThreshold());
            assertEquals(nextName, badge.getNextBadgeName());
        }

        @ParameterizedTest
        @CsvSource({
                "25, Niezniszczalny, 🦾, 25, 50, Legenda Linkedina",
                "49, Niezniszczalny, 🦾, 25, 50, Legenda Linkedina"
        })
        @DisplayName("25-49 odmów = Niezniszczalny")
        void niezniszczalny_25to49Rejections(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(count, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
            assertEquals(threshold, badge.getThreshold());
            assertEquals(nextThreshold, badge.getNextThreshold());
            assertEquals(nextName, badge.getNextBadgeName());
        }

        @ParameterizedTest
        @CsvSource({
                "50, Legenda Linkedina, 👑, 50, 100, Statystyczna Pewność",
                "99, Legenda Linkedina, 👑, 50, 100, Statystyczna Pewność"
        })
        @DisplayName("50-99 odmów = Legenda Linkedina")
        void legendaLinkedina_50to99Rejections(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(count, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
            assertEquals(threshold, badge.getThreshold());
            assertEquals(nextThreshold, badge.getNextThreshold());
            assertEquals(nextName, badge.getNextBadgeName());
        }

        @Test
        @DisplayName("100+ odmów = Statystyczna Pewność (max odznaka)")
        void statystycznaPewnosc_100PlusRejections() {
            mockCounts(100, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals("Statystyczna Pewność", badge.getName());
            assertEquals("🎰", badge.getIcon());
            assertEquals(100, badge.getThreshold());
            assertNull(badge.getNextThreshold());
            assertNull(badge.getNextBadgeName());
        }

        @Test
        @DisplayName("Progres do następnej odznaki jest poprawnie obliczany")
        void progressCalculation_Correct() {
            mockCounts(7, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getRejectionBadge();

            assertEquals(7, badge.getCurrentCount());
            assertEquals(5, badge.getThreshold());
            assertEquals(10, badge.getNextThreshold());
            // Progres: 7 z 10, czyli 2 do następnej
        }
    }

    // ==================== GHOSTING BADGES Tests ====================

    @Nested
    @DisplayName("Ghosting Badges")
    class GhostingBadgeTests {

        @Test
        @DisplayName("0 ghostingów - brak odznaki")
        void noBadge_ZeroGhostings() {
            mockCounts(0, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertNull(response.getGhostingBadge().getName());
            assertEquals(5, response.getGhostingBadge().getNextThreshold());
            assertEquals("Widmo", response.getGhostingBadge().getNextBadgeName());
        }

        @ParameterizedTest
        @CsvSource({
                "5, Widmo, 👻, 5, 15, Cierpliwy Mnich",
                "10, Widmo, 👻, 5, 15, Cierpliwy Mnich",
                "14, Widmo, 👻, 5, 15, Cierpliwy Mnich"
        })
        @DisplayName("5-14 ghostingów = Widmo")
        void widmo_5to14Ghostings(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(0, count, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getGhostingBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
            assertEquals(threshold, badge.getThreshold());
            assertEquals(nextThreshold, badge.getNextThreshold());
            assertEquals(nextName, badge.getNextBadgeName());
        }

        @ParameterizedTest
        @CsvSource({
                "15, Cierpliwy Mnich, 🧘, 15, 30, Detektyw",
                "29, Cierpliwy Mnich, 🧘, 15, 30, Detektyw"
        })
        @DisplayName("15-29 ghostingów = Cierpliwy Mnich")
        void cierpliwyMnich_15to29Ghostings(int count, String name, String icon, int threshold, int nextThreshold, String nextName) {
            mockCounts(0, count, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getGhostingBadge();

            assertEquals(name, badge.getName());
            assertEquals(icon, badge.getIcon());
        }

        @Test
        @DisplayName("100+ ghostingów = Król Ciszy (max odznaka)")
        void krolCiszy_100PlusGhostings() {
            mockCounts(0, 100, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);
            BadgeResponse badge = response.getGhostingBadge();

            assertEquals("Król Ciszy", badge.getName());
            assertEquals("🤫", badge.getIcon());
            assertEquals(100, badge.getThreshold());
            assertNull(badge.getNextThreshold());
        }
    }

    // ==================== SWEET REVENGE Tests ====================

    @Nested
    @DisplayName("Sweet Revenge Achievement")
    class SweetRevengeTests {

        @Test
        @DisplayName("odblokowane przy 10+ odmowach i 1+ ofercie")
        void sweetRevenge_Unlocked_10RejectionsAnd1Offer() {
            mockCounts(10, 0, 1);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertTrue(response.isSweetRevengeUnlocked());
        }

        @Test
        @DisplayName("odblokowane przy 50 odmowach i 3 ofertach")
        void sweetRevenge_Unlocked_50RejectionsAnd3Offers() {
            mockCounts(50, 0, 3);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertTrue(response.isSweetRevengeUnlocked());
        }

        @Test
        @DisplayName("NIE odblokowane przy 9 odmowach i 1 ofercie")
        void sweetRevenge_NotUnlocked_9RejectionsAnd1Offer() {
            mockCounts(9, 0, 1);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertFalse(response.isSweetRevengeUnlocked());
        }

        @Test
        @DisplayName("NIE odblokowane przy 15 odmowach i 0 ofertach")
        void sweetRevenge_NotUnlocked_15RejectionsAnd0Offers() {
            mockCounts(15, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertFalse(response.isSweetRevengeUnlocked());
        }

        @Test
        @DisplayName("NIE odblokowane przy 0 odmowach i 5 ofertach")
        void sweetRevenge_NotUnlocked_0RejectionsAnd5Offers() {
            mockCounts(0, 0, 5);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertFalse(response.isSweetRevengeUnlocked());
        }
    }

    // ==================== TOTAL COUNTS Tests ====================

    @Nested
    @DisplayName("Total Counts")
    class TotalCountsTests {

        @Test
        @DisplayName("zlicza prawidłowo wszystkie typy")
        void countsAreCorrect() {
            mockCounts(25, 10, 3);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertEquals(25, response.getTotalRejections());
            assertEquals(10, response.getTotalGhosting());
            assertEquals(3, response.getTotalOffers());
        }

        @Test
        @DisplayName("ghostingi są podzbiorem odmów")
        void ghostingsAreSubsetOfRejections() {
            // 15 odmów, w tym 8 to ghostingi
            mockCounts(15, 8, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertEquals(15, response.getTotalRejections());
            assertEquals(8, response.getTotalGhosting());
            // Odznaka odmów bazuje na 15
            assertEquals("Patelnia", response.getRejectionBadge().getName());
            // Odznaka ghostingów bazuje na 8
            assertEquals("Widmo", response.getGhostingBadge().getName());
        }
    }

    // ==================== EDGE CASES Tests ====================

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCasesTests {

        @Test
        @DisplayName("dokładnie na progu odznaki")
        void exactlyOnThreshold() {
            mockCounts(25, 15, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertEquals("Niezniszczalny", response.getRejectionBadge().getName());
            assertEquals(25, response.getRejectionBadge().getThreshold());

            assertEquals("Cierpliwy Mnich", response.getGhostingBadge().getName());
            assertEquals(15, response.getGhostingBadge().getThreshold());
        }

        @Test
        @DisplayName("jeden poniżej progu")
        void oneBelowThreshold() {
            mockCounts(4, 4, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertNull(response.getRejectionBadge().getName());
            assertEquals(5, response.getRejectionBadge().getNextThreshold());

            assertNull(response.getGhostingBadge().getName());
            assertEquals(5, response.getGhostingBadge().getNextThreshold());
        }

        @Test
        @DisplayName("bardzo duże liczby")
        void veryLargeNumbers() {
            mockCounts(1000, 500, 10);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_SESSION_ID);

            assertEquals("Statystyczna Pewność", response.getRejectionBadge().getName());
            assertEquals(1000, response.getRejectionBadge().getCurrentCount());

            assertEquals("Król Ciszy", response.getGhostingBadge().getName());
            assertEquals(500, response.getGhostingBadge().getCurrentCount());

            assertTrue(response.isSweetRevengeUnlocked());
        }
    }

    // ==================== Helper Methods ====================

    private void mockCounts(long rejections, long ghostings, long offers) {
        when(applicationRepository.countBySessionIdAndStatusIn(TEST_SESSION_ID, REJECTION_STATUSES))
                .thenReturn(rejections);
        when(applicationRepository.countBySessionIdAndStatusInAndRejectionReason(TEST_SESSION_ID, REJECTION_STATUSES, RejectionReason.BRAK_ODPOWIEDZI))
                .thenReturn(ghostings);
        when(applicationRepository.countBySessionIdAndStatusIn(TEST_SESSION_ID, OFFER_STATUSES))
                .thenReturn(offers);
    }
}
