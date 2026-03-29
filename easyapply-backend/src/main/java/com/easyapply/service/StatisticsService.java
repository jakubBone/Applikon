package com.easyapply.service;

import com.easyapply.dto.BadgeResponse;
import com.easyapply.dto.BadgeStatsResponse;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import com.easyapply.repository.ApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class StatisticsService {

    private static final Logger log = LoggerFactory.getLogger(StatisticsService.class);

    private final ApplicationRepository applicationRepository;

    private static final int[] REJECTION_THRESHOLDS = {5, 10, 25, 50, 100};
    private static final String[] REJECTION_NAMES = {"Rękawica", "Patelnia", "Niezniszczalny", "Legenda Linkedina", "Statystyczna Pewność"};
    private static final String[] REJECTION_ICONS = {"🥊", "🍳", "🦾", "👑", "🎰"};
    private static final String[] REJECTION_DESCRIPTIONS = {
            "Zakładasz rękawice. Rynek pracy jeszcze nie wie, z kim zadziera.",
            "Odrzucenia spływają po Tobie jak jajecznica po patelni.",
            "25 firm nie doceniło Twojego potencjału. To ich problem.",
            "Pół setki odmów i wciąż w grze. Szacunek.",
            "Przy takiej próbie, kolejna MUSI być ta właściwa."
    };

    private static final int[] GHOSTING_THRESHOLDS = {5, 15, 30, 50, 100};
    private static final String[] GHOSTING_NAMES = {"Widmo", "Cierpliwy Mnich", "Detektyw", "Człowiek-Duch", "Król Ciszy"};
    private static final String[] GHOSTING_ICONS = {"👻", "🧘", "🔍", "🫥", "🤫"};
    private static final String[] GHOSTING_DESCRIPTIONS = {
            "Firma się nie odezwała. Sprawdź, czy mają internet.",
            "15 firm milczy jak zaklęte. Medytacja przed laptopem to Twoja codzienność.",
            "30 aplikacji w próżni. Może ich serwer pocztowy zjadł pies?",
            "50 firm udaje, że nie istniejesz. Zaczynasz wątpić w swoją realność.",
            "Mistrz ciszy. 100 firm milczy, a Ty wciąż wysyłasz. Legenda."
    };

    public StatisticsService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public BadgeStatsResponse getBadgeStats(UUID userId) {
        Object[] stats = normalizeStats(applicationRepository.getApplicationStats(
                userId, ApplicationStatus.REJECTED, ApplicationStatus.OFFER, RejectionReason.NO_RESPONSE));
        
        int rejectionCount = getStatValue(stats, 0);
        int ghostingCount = getStatValue(stats, 1);
        int offerCount = getStatValue(stats, 2);

        log.debug("Badge stats for user={}: rejections={}, ghosting={}, offers={}", userId, rejectionCount, ghostingCount, offerCount);

        return new BadgeStatsResponse(
                calculateBadge(rejectionCount, REJECTION_THRESHOLDS, REJECTION_NAMES, REJECTION_ICONS, REJECTION_DESCRIPTIONS),
                calculateBadge(ghostingCount, GHOSTING_THRESHOLDS, GHOSTING_NAMES, GHOSTING_ICONS, GHOSTING_DESCRIPTIONS),
                rejectionCount >= 10 && offerCount > 0,
                rejectionCount,
                ghostingCount,
                offerCount
        );
    }

    /**
     * Depending on JPA provider/version, aggregate tuple can come as:
     * 1) Object[] of numbers, or
     * 2) one-element array containing nested Object[].
     */
    private Object[] normalizeStats(Object[] stats) {
        if (stats == null) {
            return new Object[0];
        }
        if (stats.length == 1 && stats[0] instanceof Object[] nested) {
            return nested;
        }
        return stats;
    }

    private int getStatValue(Object[] stats, int index) {
        if (stats.length <= index || stats[index] == null) {
            return 0;
        }
        return ((Number) stats[index]).intValue();
    }

    private BadgeResponse calculateBadge(int count, int[] thresholds, String[] names, String[] icons, String[] descriptions) {
        for (int i = thresholds.length - 1; i >= 0; i--) {
            if (count >= thresholds[i]) {
                Integer nextThreshold = i < thresholds.length - 1 ? thresholds[i + 1] : null;
                String nextBadgeName = i < thresholds.length - 1 ? names[i + 1] : null;
                return new BadgeResponse(names[i], icons[i], descriptions[i], thresholds[i], count, nextThreshold, nextBadgeName);
            }
        }
        return new BadgeResponse(null, null, null, 0, count, thresholds[0], names[0]);
    }
}
