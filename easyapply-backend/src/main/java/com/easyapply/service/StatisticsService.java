package com.easyapply.service;

import com.easyapply.dto.BadgeResponse;
import com.easyapply.dto.BadgeStatsResponse;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import com.easyapply.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class StatisticsService {

    private final ApplicationRepository applicationRepository;

    private static final List<ApplicationStatus> REJECTION_STATUSES = Arrays.asList(
            ApplicationStatus.ODMOWA,
            ApplicationStatus.ODRZUCONE
    );

    private static final List<ApplicationStatus> OFFER_STATUSES = Arrays.asList(
            ApplicationStatus.OFERTA
    );

    // Rejection badges
    private static final int[] REJECTION_THRESHOLDS = {5, 10, 25, 50, 100};
    private static final String[] REJECTION_NAMES = {"Rozgrzewka", "Patelnia", "Niezniszczalny", "Legenda Linkedina", "Statystyczna Pewność"};
    private static final String[] REJECTION_ICONS = {"🥊", "🍳", "🦾", "👑", "🎰"};
    private static final String[] REJECTION_DESCRIPTIONS = {
            "Dopiero zaczynasz. Rynek pracy jeszcze nie wie, z kim zadziera.",
            "Odrzucenia spływają po Tobie jak jajecznica po patelni.",
            "25 firm nie doceniło Twojego potencjału. To ich problem.",
            "Pół setki odmów i wciąż w grze. Szacunek.",
            "Przy takiej próbie, kolejna MUSI być ta właściwa."
    };

    // Ghosting badges
    private static final int[] GHOSTING_THRESHOLDS = {5, 15, 30, 50, 100};
    private static final String[] GHOSTING_NAMES = {"Widmo", "Cierpliwy Mnich", "Detektyw", "Człowiek-Duch", "Król Ciszy"};
    private static final String[] GHOSTING_ICONS = {"👻", "🧘", "🔍", "🫥", "🤫"};
    private static final String[] GHOSTING_DESCRIPTIONS = {
            "5 firm nie odpowiedziało wcale. Sprawdź, czy mają internet.",
            "Czekanie to też umiejętność. Właśnie ją opanowujesz.",
            "30 spraw bez rozwiązania. Może to nie Ty, może to oni.",
            "50 firm udaje, że nie istniejesz. Ale Ty wiesz lepiej.",
            "100 firm milczy. Gratuluję wytrwałości!"
    };

    public StatisticsService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public BadgeStatsResponse getBadgeStats(String sessionId) {
        long rejectionCount = applicationRepository.countBySessionIdAndStatusIn(sessionId, REJECTION_STATUSES);
        long ghostingCount = applicationRepository.countBySessionIdAndStatusInAndRejectionReason(
                sessionId, REJECTION_STATUSES, RejectionReason.BRAK_ODPOWIEDZI);
        long offerCount = applicationRepository.countBySessionIdAndStatusIn(sessionId, OFFER_STATUSES);

        BadgeStatsResponse response = new BadgeStatsResponse();
        response.setTotalRejections((int) rejectionCount);
        response.setTotalGhosting((int) ghostingCount);
        response.setTotalOffers((int) offerCount);

        response.setRejectionBadge(calculateBadge(
                (int) rejectionCount,
                REJECTION_THRESHOLDS,
                REJECTION_NAMES,
                REJECTION_ICONS,
                REJECTION_DESCRIPTIONS
        ));

        response.setGhostingBadge(calculateBadge(
                (int) ghostingCount,
                GHOSTING_THRESHOLDS,
                GHOSTING_NAMES,
                GHOSTING_ICONS,
                GHOSTING_DESCRIPTIONS
        ));

        // Sweet Revenge: oferta po 10+ odrzuceniach
        response.setSweetRevengeUnlocked(rejectionCount >= 10 && offerCount > 0);

        return response;
    }

    private BadgeResponse calculateBadge(int count, int[] thresholds, String[] names, String[] icons, String[] descriptions) {
        BadgeResponse badge = new BadgeResponse();
        badge.setCurrentCount(count);

        int achievedIndex = -1;
        for (int i = thresholds.length - 1; i >= 0; i--) {
            if (count >= thresholds[i]) {
                achievedIndex = i;
                break;
            }
        }

        if (achievedIndex >= 0) {
            badge.setName(names[achievedIndex]);
            badge.setIcon(icons[achievedIndex]);
            badge.setDescription(descriptions[achievedIndex]);
            badge.setThreshold(thresholds[achievedIndex]);

            if (achievedIndex < thresholds.length - 1) {
                badge.setNextThreshold(thresholds[achievedIndex + 1]);
                badge.setNextBadgeName(names[achievedIndex + 1]);
            }
        } else {
            // Jeszcze nie osiągnięto pierwszego progu
            badge.setName(null);
            badge.setIcon(null);
            badge.setDescription(null);
            badge.setThreshold(0);
            badge.setNextThreshold(thresholds[0]);
            badge.setNextBadgeName(names[0]);
        }

        return badge;
    }
}
