package com.easyapply.service;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StageUpdateRequest;
import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import com.easyapply.entity.StageHistory;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.StageHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final NoteService noteService;
    private final StageHistoryRepository stageHistoryRepository;

    public ApplicationService(ApplicationRepository applicationRepository, NoteService noteService, StageHistoryRepository stageHistoryRepository) {
        this.applicationRepository = applicationRepository;
        this.noteService = noteService;
        this.stageHistoryRepository = stageHistoryRepository;
    }

    @Transactional
    public ApplicationResponse create(ApplicationRequest request, String sessionId) {
        Application application = new Application();
        application.setSessionId(sessionId);
        application.setCompany(request.getCompany());
        application.setPosition(request.getPosition());
        application.setLink(request.getLink());
        application.setSalaryMin(request.getSalaryMin());
        application.setSalaryMax(request.getSalaryMax());
        application.setCurrency(request.getCurrency());
        application.setSalaryType(request.getSalaryType());
        application.setContractType(request.getContractType());
        application.setSalarySource(request.getSalarySource());
        application.setSource(request.getSource());
        application.setJobDescription(request.getJobDescription());
        application.setAgency(request.getAgency());
        application.setStatus(ApplicationStatus.WYSLANE);

        Application saved = applicationRepository.save(application);

        // Dodaj początkowy wpis w historii etapów
        StageHistory initialStage = new StageHistory(saved, "Wysłane");
        initialStage.setCompleted(false);
        stageHistoryRepository.save(initialStage);

        return ApplicationResponse.fromEntity(applicationRepository.findById(saved.getId()).orElseThrow());
    }

    public List<ApplicationResponse> findAllBySessionId(String sessionId) {
        return applicationRepository.findBySessionId(sessionId).stream()
                .map(ApplicationResponse::fromEntity)
                .toList();
    }

    public ApplicationResponse findById(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));
        return ApplicationResponse.fromEntity(application);
    }

    @Transactional
    public ApplicationResponse updateStatus(Long id, ApplicationStatus status) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));
        application.setStatus(status);
        Application saved = applicationRepository.save(application);
        return ApplicationResponse.fromEntity(saved);
    }

    @Transactional
    public ApplicationResponse updateStage(Long id, StageUpdateRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

        ApplicationStatus oldStatus = application.getStatus();
        ApplicationStatus newStatus = request.getStatus();

        // Aktualizuj status
        application.setStatus(newStatus);

        // Obsługa przejścia do WYSLANE (cofnięcie - czyść wszystko)
        if (newStatus == ApplicationStatus.WYSLANE) {
            application.setCurrentStage(null);
            application.setRejectionReason(null);
            application.setRejectionDetails(null);
            // Usuń historię etapów
            stageHistoryRepository.deleteByApplicationId(application.getId());
        }

        // Obsługa przejścia do W_PROCESIE
        if (newStatus == ApplicationStatus.W_PROCESIE) {
            // Jeśli cofamy z ZAKONCZONE - czyść dane zakończenia
            if (oldStatus == ApplicationStatus.OFERTA || oldStatus == ApplicationStatus.ODMOWA) {
                application.setRejectionReason(null);
                application.setRejectionDetails(null);
            }

            // Ustaw nowy etap (jeśli podano)
            if (request.getCurrentStage() != null) {
                application.setCurrentStage(request.getCurrentStage());
            }
        }

        // Obsługa przejścia do OFERTA
        if (newStatus == ApplicationStatus.OFERTA) {
            application.setCurrentStage(null);
            application.setRejectionReason(null);
            application.setRejectionDetails(null);
        }

        // Obsługa przejścia do ODMOWA
        if (newStatus == ApplicationStatus.ODMOWA) {
            application.setCurrentStage(null);
            application.setRejectionReason(request.getRejectionReason());
            application.setRejectionDetails(request.getRejectionDetails());
        }

        Application saved = applicationRepository.save(application);
        return ApplicationResponse.fromEntity(saved);
    }

    private void markCurrentStageCompleted(Application application) {
        if (application.getCurrentStage() != null) {
            List<StageHistory> history = stageHistoryRepository.findByApplicationIdOrderByCreatedAtAsc(application.getId());
            history.stream()
                    .filter(h -> h.getStageName().equals(application.getCurrentStage()) && !h.isCompleted())
                    .findFirst()
                    .ifPresent(h -> {
                        h.markCompleted();
                        stageHistoryRepository.save(h);
                    });
        }
    }

    private void markStageCompletedByName(Application application, String stageName) {
        List<StageHistory> history = stageHistoryRepository.findByApplicationIdOrderByCreatedAtAsc(application.getId());
        history.stream()
                .filter(h -> h.getStageName().equals(stageName) && !h.isCompleted())
                .findFirst()
                .ifPresent(h -> {
                    h.markCompleted();
                    stageHistoryRepository.save(h);
                });
    }

    @Transactional
    public ApplicationResponse addStage(Long id, String stageName) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

        // Zamknij poprzedni etap
        markCurrentStageCompleted(application);

        // Ustaw nowy etap jako aktualny
        application.setCurrentStage(stageName);
        application.setStatus(ApplicationStatus.W_PROCESIE);

        // Dodaj do historii
        StageHistory newStage = new StageHistory(application, stageName);
        stageHistoryRepository.save(newStage);

        Application saved = applicationRepository.save(application);
        return ApplicationResponse.fromEntity(saved);
    }

    public List<ApplicationResponse> findDuplicates(String sessionId, String company, String position) {
        return applicationRepository.findBySessionIdAndCompanyIgnoreCaseAndPositionIgnoreCase(sessionId, company, position).stream()
                .map(ApplicationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!applicationRepository.existsById(id)) {
            throw new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona");
        }
        // Najpierw usuń powiązane notatki
        noteService.deleteByApplicationId(id);
        applicationRepository.deleteById(id);
    }

    @Transactional
    public ApplicationResponse update(Long id, ApplicationRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

        // Aktualizuj pola
        application.setCompany(request.getCompany());
        application.setPosition(request.getPosition());
        application.setLink(request.getLink());
        application.setSalaryMin(request.getSalaryMin());
        application.setSalaryMax(request.getSalaryMax());
        application.setCurrency(request.getCurrency());
        application.setSalaryType(request.getSalaryType());
        application.setContractType(request.getContractType());
        application.setSalarySource(request.getSalarySource());
        application.setSource(request.getSource());
        application.setJobDescription(request.getJobDescription());
        application.setAgency(request.getAgency());

        Application saved = applicationRepository.save(application);
        return ApplicationResponse.fromEntity(saved);
    }
}
