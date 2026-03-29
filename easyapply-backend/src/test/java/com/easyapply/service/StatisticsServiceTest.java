package com.easyapply.service;

import com.easyapply.dto.BadgeResponse;
import com.easyapply.dto.BadgeStatsResponse;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import com.easyapply.repository.ApplicationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatisticsService tests")
class StatisticsServiceTest {

    private static final UUID TEST_USER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    private void mockStats(int rejections, int ghostings, int offers) {
        when(applicationRepository.getApplicationStats(
                TEST_USER_ID,
                ApplicationStatus.ODMOWA,
                ApplicationStatus.OFERTA,
                RejectionReason.NO_RESPONSE
        )).thenReturn(new Object[]{rejections, ghostings, offers});
    }

    @Nested
    class BasicTests {

        @Test
        void returnsZerosWhenNoData() {
            mockStats(0, 0, 0);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_USER_ID);

            assertEquals(0, response.totalRejections());
            assertEquals(0, response.totalGhosting());
            assertEquals(0, response.totalOffers());
            assertFalse(response.sweetRevengeUnlocked());
            assertNull(response.rejectionBadge().name());
            assertNull(response.ghostingBadge().name());
        }

        @Test
        void unlocksSweetRevenge_when10RejectionsAndOffer() {
            mockStats(10, 3, 1);

            BadgeStatsResponse response = statisticsService.getBadgeStats(TEST_USER_ID);

            assertTrue(response.sweetRevengeUnlocked());
        }
    }

    @Nested
    class RejectionBadgeTests {

        @Test
        void rejectionBadge_isRekawicaAtFive() {
            mockStats(5, 0, 0);

            BadgeResponse badge = statisticsService.getBadgeStats(TEST_USER_ID).rejectionBadge();

            assertEquals("Rękawica", badge.name());
            assertEquals(5, badge.threshold());
            assertEquals(Integer.valueOf(10), badge.nextThreshold());
        }

        @Test
        void rejectionBadge_isStatystycznaPewnoscAt100() {
            mockStats(100, 0, 0);

            BadgeResponse badge = statisticsService.getBadgeStats(TEST_USER_ID).rejectionBadge();

            assertEquals("Statystyczna Pewność", badge.name());
            assertEquals(100, badge.threshold());
            assertNull(badge.nextThreshold());
            assertNull(badge.nextBadgeName());
        }
    }

    @Nested
    class GhostingBadgeTests {

        @Test
        void ghostingBadge_isWidmoAtFive() {
            mockStats(10, 5, 0);

            BadgeResponse badge = statisticsService.getBadgeStats(TEST_USER_ID).ghostingBadge();

            assertEquals("Widmo", badge.name());
            assertEquals(5, badge.threshold());
            assertEquals(Integer.valueOf(15), badge.nextThreshold());
        }

        @Test
        void ghostingBadge_isKrolCiszyAt100() {
            mockStats(120, 100, 0);

            BadgeResponse badge = statisticsService.getBadgeStats(TEST_USER_ID).ghostingBadge();

            assertEquals("Król Ciszy", badge.name());
            assertEquals(100, badge.threshold());
            assertNull(badge.nextThreshold());
        }
    }
}
