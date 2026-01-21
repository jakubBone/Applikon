package com.easyapply.config;

import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.repository.ApplicationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataMigration implements CommandLineRunner {

    private final ApplicationRepository applicationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public DataMigration(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        dropStatusConstraint();
        migrateOldStatuses();
        migrateRejectionReasons();
        migrateCVTypes();
    }

    private void dropStatusConstraint() {
        try {
            // Usuń stary constraint który blokuje nowe statusy
            entityManager.createNativeQuery(
                "ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check"
            ).executeUpdate();
            System.out.println("=== Usunięto stary constraint applications_status_check ===");
        } catch (Exception e) {
            System.out.println("Constraint już nie istnieje lub błąd: " + e.getMessage());
        }
    }

    private void migrateOldStatuses() {
        // Sprawdź czy są jeszcze stare statusy do migracji
        Long oldStatusCount = (Long) entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM applications WHERE status IN ('ROZMOWA', 'ZADANIE', 'ODRZUCONE')"
        ).getSingleResult();

        if (oldStatusCount == 0) {
            System.out.println("=== Migracja statusów: brak starych statusów, pomijam ===");
            return;
        }

        // Użyj native query żeby ominąć walidację Hibernate
        int updated1 = entityManager.createNativeQuery(
            "UPDATE applications SET status = 'W_PROCESIE' WHERE status IN ('ROZMOWA', 'ZADANIE')"
        ).executeUpdate();

        int updated2 = entityManager.createNativeQuery(
            "UPDATE applications SET status = 'ODMOWA' WHERE status = 'ODRZUCONE'"
        ).executeUpdate();

        int total = updated1 + updated2;
        System.out.println("=== Zmigrowano " + total + " aplikacji do nowych statusów ===");
    }

    private void migrateRejectionReasons() {
        try {
            // Migruj stary powód odmowy STANDARDOWA_ODMOWA -> ODMOWA_MAILOWA
            int updated = entityManager.createNativeQuery(
                "UPDATE applications SET rejection_reason = 'ODMOWA_MAILOWA' WHERE rejection_reason = 'STANDARDOWA_ODMOWA'"
            ).executeUpdate();

            if (updated > 0) {
                System.out.println("=== Zmigrowano " + updated + " aplikacji z STANDARDOWA_ODMOWA na ODMOWA_MAILOWA ===");
            }
        } catch (Exception e) {
            System.out.println("Błąd migracji rejection_reason: " + e.getMessage());
        }
    }

    private void migrateCVTypes() {
        try {
            // Usuń constraint NOT NULL z kolumn fileName i filePath (potrzebne dla typów LINK i NOTE)
            entityManager.createNativeQuery(
                "ALTER TABLE cvs ALTER COLUMN file_name DROP NOT NULL"
            ).executeUpdate();
            entityManager.createNativeQuery(
                "ALTER TABLE cvs ALTER COLUMN file_path DROP NOT NULL"
            ).executeUpdate();
            System.out.println("=== Usunięto constraint NOT NULL z fileName i filePath ===");
        } catch (Exception e) {
            // Constraint już nie istnieje - OK
        }

        try {
            // Ustaw domyślny typ FILE dla istniejących CV bez typu
            int updated = entityManager.createNativeQuery(
                "UPDATE cvs SET type = 'FILE' WHERE type IS NULL"
            ).executeUpdate();

            if (updated > 0) {
                System.out.println("=== Zmigrowano " + updated + " CV - ustawiono typ FILE ===");
            }
        } catch (Exception e) {
            System.out.println("Błąd migracji CV types: " + e.getMessage());
        }
    }
}
