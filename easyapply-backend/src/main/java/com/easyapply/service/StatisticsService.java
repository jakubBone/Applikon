package com.easyapply.service;

import com.easyapply.dto.ApplicationStats;
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

    private record BadgeDefinition(String name, String icon, String description, int threshold) {}

    private static final BadgeDefinition[] REJECTION_BADGES = {
            new BadgeDefinition("Rękawica",           "🥊", "Zakładasz rękawice. Rynek pracy jeszcze nie wie, z kim zadziera.",    5),
            new BadgeDefinition("Patelnia",            "🍳", "Odrzucenia spływają po Tobie jak jajecznica po patelni.",             10),
            new BadgeDefinition("Niezniszczalny",      "🦾", "25 firm nie doceniło Twojego potencjału. To ich problem.",            25),
            new BadgeDefinition("Legenda Linkedina",   "👑", "Pół setki odmów i wciąż w grze. Szacunek.",                          50),
            new BadgeDefinition("Statystyczna Pewność","🎰", "Przy takiej próbie, kolejna MUSI być ta właściwa.",                  100),
    };

    private static final BadgeDefinition[] GHOSTING_BADGES = {
            new BadgeDefinition("Widmo",          "👻", "Firma się nie odezwała. Sprawdź, czy mają internet.",                         5),
            new BadgeDefinition("Cierpliwy Mnich","🧘", "15 firm milczy jak zaklęte. Medytacja przed laptopem to Twoja codzienność.", 15),
            new BadgeDefinition("Detektyw",       "🔍", "30 aplikacji w próżni. Może ich serwer pocztowy zjadł pies?",               30),
            new BadgeDefinition("Człowiek-Duch",  "🫥", "50 firm udaje, że nie istniejesz. Zaczynasz wątpić w swoją realność.",      50),
            new BadgeDefinition("Król Ciszy",     "🤫", "Mistrz ciszy. 100 firm milczy, a Ty wciąż wysyłasz. Legenda.",             100),
    };

    public StatisticsService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public BadgeStatsResponse getBadgeStats(UUID userId) {
        ApplicationStats stats = applicationRepository.getApplicationStats(
                userId, ApplicationStatus.REJECTED, ApplicationStatus.OFFER, RejectionReason.NO_RESPONSE);

        int rejectionCount = stats != null ? stats.rejections() : 0;
        int ghostingCount  = stats != null ? stats.ghosting()   : 0;
        int offerCount     = stats != null ? stats.offers()     : 0;

        log.debug("Badge stats for user={}: rejections={}, ghosting={}, offers={}", userId, rejectionCount, ghostingCount, offerCount);

        return new BadgeStatsResponse(
                calculateBadge(rejectionCount, REJECTION_BADGES),
                calculateBadge(ghostingCount,  GHOSTING_BADGES),
                rejectionCount >= 10 && offerCount > 0,
                rejectionCount,
                ghostingCount,
                offerCount
        );
    }

    private BadgeResponse calculateBadge(int count, BadgeDefinition[] badges) {
        for (int i = badges.length - 1; i >= 0; i--) {
            if (count >= badges[i].threshold()) {
                Integer nextThreshold  = i < badges.length - 1 ? badges[i + 1].threshold() : null;
                String  nextBadgeName  = i < badges.length - 1 ? badges[i + 1].name()      : null;
                return new BadgeResponse(badges[i].name(), badges[i].icon(), badges[i].description(),
                        badges[i].threshold(), count, nextThreshold, nextBadgeName);
            }
        }
        return new BadgeResponse(null, null, null, 0, count, badges[0].threshold(), badges[0].name());
    }
}