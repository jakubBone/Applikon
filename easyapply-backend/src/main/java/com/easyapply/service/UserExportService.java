package com.easyapply.service;

import com.easyapply.dto.UserExportResponse;
import com.easyapply.dto.UserExportResponse.*;
import com.easyapply.entity.Application;
import com.easyapply.entity.CV;
import com.easyapply.entity.Note;
import com.easyapply.entity.User;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
import com.easyapply.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserExportService {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final NoteRepository noteRepository;

    public UserExportService(UserRepository userRepository,
                             ApplicationRepository applicationRepository,
                             NoteRepository noteRepository) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.noteRepository = noteRepository;
    }

    public UserExportResponse buildExport(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(EntityNotFoundException::new);

        List<Application> applications = applicationRepository.findByUserId(userId);

        List<ApplicationExport> appExports = applications.stream()
                .map(app -> {
                    List<Note> notes = noteRepository.findByApplicationIdOrderByCreatedAtDesc(app.getId());
                    return mapApplication(app, notes);
                })
                .toList();

        return new UserExportResponse(mapProfile(user), appExports);
    }

    private ProfileExport mapProfile(User user) {
        return new ProfileExport(
                user.getEmail(),
                user.getName(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                user.getPrivacyPolicyAcceptedAt() != null ? user.getPrivacyPolicyAcceptedAt().toString() : null
        );
    }

    private ApplicationExport mapApplication(Application app, List<Note> notes) {
        CvExport cvExport = null;
        if (app.getCv() != null) {
            CV cv = app.getCv();
            cvExport = new CvExport(
                    cv.getOriginalFileName(),
                    cv.getType() != null ? cv.getType().name() : null,
                    cv.getExternalUrl()
            );
        }

        List<NoteExport> noteExports = notes.stream()
                .map(n -> new NoteExport(
                        n.getContent(),
                        n.getCategory() != null ? n.getCategory().name() : null,
                        n.getCreatedAt() != null ? n.getCreatedAt().toString() : null
                ))
                .toList();

        return new ApplicationExport(
                app.getId(),
                app.getCompany(),
                app.getPosition(),
                app.getLink(),
                app.getSalaryMin(),
                app.getSalaryMax(),
                app.getCurrency(),
                app.getSalaryType() != null ? app.getSalaryType().name() : null,
                app.getContractType() != null ? app.getContractType().name() : null,
                app.getSalarySource() != null ? app.getSalarySource().name() : null,
                app.getSource(),
                app.getStatus() != null ? app.getStatus().name() : null,
                app.getJobDescription(),
                app.getAgency(),
                app.getCurrentStage(),
                app.getRejectionReason() != null ? app.getRejectionReason().name() : null,
                app.getRejectionDetails(),
                app.getAppliedAt() != null ? app.getAppliedAt().toString() : null,
                cvExport,
                noteExports
        );
    }
}
