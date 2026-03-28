package com.easyapply.service;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StageUpdateRequest;
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

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final NoteService noteService;
    private final StageHistoryRepository stageHistoryRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            NoteService noteService,
            StageHistoryRepository stageHistoryRepository,
            UserRepository userRepository,
            MessageSource messageSource) {
        this.applicationRepository = applicationRepository;
        this.noteService = noteService;
        this.stageHistoryRepository = stageHistoryRepository;
        this.userRepository = userRepository;
        this.messageSource = messageSource;
    }

    @Transactional
    public ApplicationResponse create(ApplicationRequest request, UUID userId) {
        log.info("Creating application for user={}, company={}", userId, request.company());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.user.notFound", null, LocaleContextHolder.getLocale())));

        Application application = new Application();
        application.setUser(user);
        application.setCompany(request.company());
        application.setPosition(request.position());
        application.setLink(request.link());
        application.setSalaryMin(request.salaryMin());
        application.setSalaryMax(request.salaryMax());
        application.setCurrency(request.currency());
        application.setSalaryType(request.salaryType());
        application.setContractType(request.contractType());
        application.setSalarySource(request.salarySource());
        application.setSource(request.source());
        application.setJobDescription(request.jobDescription());
        application.setAgency(request.agency());
        application.setStatus(ApplicationStatus.WYSLANE);

        Application saved = applicationRepository.save(application);
        stageHistoryRepository.save(new StageHistory(saved, "Wysłane"));

        return ApplicationResponse.fromEntity(
                applicationRepository.findByIdAndUserId(saved.getId(), userId).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> findAllByUserId(UUID userId) {
        return applicationRepository.findByUserIdWithStageHistory(userId).stream()
                .map(ApplicationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApplicationResponse findById(Long id, UUID userId) {
        return ApplicationResponse.fromEntity(getApplicationByIdAndUserId(id, userId));
    }

    @Transactional
    public ApplicationResponse updateStatus(Long id, ApplicationStatus status, UUID userId) {
        Application application = getApplicationByIdAndUserId(id, userId);
        application.setStatus(status);
        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    @Transactional
    public ApplicationResponse updateStage(Long id, StageUpdateRequest request, UUID userId) {
        Application application = getApplicationByIdAndUserId(id, userId);

        ApplicationStatus oldStatus = application.getStatus();
        ApplicationStatus newStatus = request.status();

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
            if (request.currentStage() != null) {
                application.setCurrentStage(request.currentStage());
            }
        }

        if (newStatus == ApplicationStatus.OFERTA) {
            application.setCurrentStage(null);
            application.setRejectionReason(null);
            application.setRejectionDetails(null);
        }

        if (newStatus == ApplicationStatus.ODMOWA) {
            application.setCurrentStage(null);
            application.setRejectionReason(request.rejectionReason());
            application.setRejectionDetails(request.rejectionDetails());
        }

        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    @Transactional
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
    public ApplicationResponse addStage(Long id, String stageName, UUID userId) {
        Application application = getApplicationByIdAndUserId(id, userId);

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
    public void delete(Long id, UUID userId) {
        Application application = getApplicationByIdAndUserId(id, userId);
        log.info("Deleting application id={} for user={}", id, userId);
        noteService.deleteByApplicationId(id, userId);
        applicationRepository.delete(application);
    }

    @Transactional
    public ApplicationResponse update(Long id, ApplicationRequest request, UUID userId) {
        Application application = getApplicationByIdAndUserId(id, userId);

        application.setCompany(request.company());
        application.setPosition(request.position());
        application.setLink(request.link());
        application.setSalaryMin(request.salaryMin());
        application.setSalaryMax(request.salaryMax());
        application.setCurrency(request.currency());
        application.setSalaryType(request.salaryType());
        application.setContractType(request.contractType());
        application.setSalarySource(request.salarySource());
        application.setSource(request.source());
        application.setJobDescription(request.jobDescription());
        application.setAgency(request.agency());

        return ApplicationResponse.fromEntity(applicationRepository.save(application));
    }

    private Application getApplicationByIdAndUserId(Long id, UUID userId) {
        return applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.application.notFound", new Object[]{id}, LocaleContextHolder.getLocale())));
    }
}
