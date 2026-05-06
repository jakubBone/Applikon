package com.easyapply.service;

import com.easyapply.dto.NoteRequest;
import com.easyapply.dto.NoteResponse;
import com.easyapply.entity.Application;
import com.easyapply.entity.Note;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final ApplicationRepository applicationRepository;
    private final MessageSource messageSource;

    public NoteService(NoteRepository noteRepository, ApplicationRepository applicationRepository, MessageSource messageSource) {
        this.noteRepository = noteRepository;
        this.applicationRepository = applicationRepository;
        this.messageSource = messageSource;
    }

    @Transactional
    public NoteResponse create(Long applicationId, NoteRequest request, UUID userId) {
        Application application = getApplicationByIdAndUserId(applicationId, userId);

        Note note = new Note(request.content(), application, request.category());
        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> findByApplicationId(Long applicationId, UUID userId) {
        if (!applicationRepository.existsByIdAndUserId(applicationId, userId)) {
            throw new EntityNotFoundException(messageSource.getMessage("error.application.notFound", new Object[]{applicationId}, LocaleContextHolder.getLocale()));
        }
        return noteRepository.findByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc(applicationId, userId).stream()
                .map(NoteResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse findById(Long id, UUID userId) {
        Note note = noteRepository.findByIdAndApplicationUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.note.notFound", new Object[]{id}, LocaleContextHolder.getLocale())));
        return NoteResponse.fromEntity(note);
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request, UUID userId) {
        Note note = noteRepository.findByIdAndApplicationUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.note.notFound", new Object[]{id}, LocaleContextHolder.getLocale())));
        note.setContent(request.content());
        if (request.category() != null) {
            note.setCategory(request.category());
        }
        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }

    @Transactional
    public void delete(Long id, UUID userId) {
        if (!noteRepository.existsByIdAndApplicationUserId(id, userId)) {
            throw new EntityNotFoundException(messageSource.getMessage("error.note.notFound", new Object[]{id}, LocaleContextHolder.getLocale()));
        }
        noteRepository.deleteById(id);
    }

    @Transactional
    public void deleteByApplicationId(Long applicationId, UUID userId) {
        noteRepository.deleteByApplicationIdAndApplicationUserId(applicationId, userId);
    }

    private Application getApplicationByIdAndUserId(Long applicationId, UUID userId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.application.notFound", new Object[]{applicationId}, LocaleContextHolder.getLocale())));
    }
}