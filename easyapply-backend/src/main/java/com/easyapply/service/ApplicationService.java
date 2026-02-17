package com.easyapply.service;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StageUpdateRequest;
import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.StageHistoryRepository;
import com.easyapply.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final NoteService noteService;
    private final StageHistoryRepository stageHistoryRepository;
    private final UserRepository userRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            NoteService noteService,
            StageHistoryRepository stageHistoryRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.noteService = noteService;
        this.stageHistoryRepository = stageHistoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ApplicationResponse create(ApplicationRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        Application application = new Application();
        application.setUser(user);
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

        StageHistory initialStage = new StageHistory(saved, "Wysłane");
        stageHistoryRepository.save(initialStage);

        return ApplicationResponse.fromEntity(applicationRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> findAllByUserId(UUID userId) {
        return applicationRepository.findByUserId(userId).stream()
                .map(ApplicationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
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
        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    @Transactional
    public ApplicationResponse updateStage(Long id, StageUpdateRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

        ApplicationStatus oldStatus = application.getStatus();
        ApplicationStatus newStatus = request.getStatus();

        application.setStatus(newStatus);

        if (newStatus == ApplicationStatus.WYSLANE) {
            application.setCurrentStage(null);
            application.setRejectionReason(null);
            application.setRejectionDetails(null);
            stageHistoryRepository.deleteByApplicationId(application.getId());
        }

        if (newStatus == ApplicationStatus.W_PROCESIE) {
            if (oldStatus == ApplicationStatus.OFERTA || oldStatus == ApplicationStatus.ODMOWA) {
                application.setRejectionReason(null);
                application.setRejectionDetails(null);
            }
            if (request.getCurrentStage() != null) {
                application.setCurrentStage(request.getCurrentStage());
            }
        }

        if (newStatus == ApplicationStatus.OFERTA) {
            application.setCurrentStage(null);
            application.setRejectionReason(null);
            application.setRejectionDetails(null);
        }

        if (newStatus == ApplicationStatus.ODMOWA) {
            application.setCurrentStage(null);
            application.setRejectionReason(request.getRejectionReason());
            application.setRejectionDetails(request.getRejectionDetails());
        }

        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    private void markCurrentStageCompleted(Application application) {
        if (application.getCurrentStage() != null) {
            stageHistoryRepository.findByApplicationIdOrderByCreatedAtAsc(application.getId()).stream()
                    .filter(h -> h.getStageName().equals(application.getCurrentStage()) && !h.isCompleted())
                    .findFirst()
                    .ifPresent(h -> {
                        h.markCompleted();
                        stageHistoryRepository.save(h);
                    });
        }
    }

    @Transactional
    public ApplicationResponse addStage(Long id, String stageName) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

        markCurrentStageCompleted(application);
        application.setCurrentStage(stageName);
        application.setStatus(ApplicationStatus.W_PROCESIE);

        stageHistoryRepository.save(new StageHistory(application, stageName));

        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> findDuplicates(UUID userId, String company, String position) {
        return applicationRepository
                .findByUserIdAndCompanyIgnoreCaseAndPositionIgnoreCase(userId, company, position).stream()
                .map(ApplicationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!applicationRepository.existsById(id)) {
            throw new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona");
        }
        noteService.deleteByApplicationId(id);
        applicationRepository.deleteById(id);
    }

    @Transactional
    public ApplicationResponse update(Long id, ApplicationRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + id + " nie została znaleziona"));

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

        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }
}
