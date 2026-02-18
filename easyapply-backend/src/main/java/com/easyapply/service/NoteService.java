package com.easyapply.service;

import com.easyapply.dto.NoteRequest;
import com.easyapply.dto.NoteResponse;
import com.easyapply.entity.Application;
import com.easyapply.entity.Note;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoteService {

    private static final Logger log = LoggerFactory.getLogger(NoteService.class);

    private final NoteRepository noteRepository;
    private final ApplicationRepository applicationRepository;

    public NoteService(NoteRepository noteRepository, ApplicationRepository applicationRepository) {
        this.noteRepository = noteRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional
    public NoteResponse create(Long applicationId, NoteRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + applicationId + " nie została znaleziona"));

        Note note = new Note(request.content(), application, request.category());
        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> findByApplicationId(Long applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new EntityNotFoundException("Aplikacja o ID " + applicationId + " nie została znaleziona");
        }
        return noteRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).stream()
                .map(NoteResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse findById(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notatka o ID " + id + " nie została znaleziona"));
        return NoteResponse.fromEntity(note);
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notatka o ID " + id + " nie została znaleziona"));
        note.setContent(request.content());
        if (request.category() != null) {
            note.setCategory(request.category());
        }
        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!noteRepository.existsById(id)) {
            throw new EntityNotFoundException("Notatka o ID " + id + " nie została znaleziona");
        }
        noteRepository.deleteById(id);
    }

    @Transactional
    public void deleteByApplicationId(Long applicationId) {
        noteRepository.deleteByApplicationId(applicationId);
    }

    @Transactional
    public NoteResponse createSalaryChangeNote(Long applicationId, Integer oldSalary, String oldCurrency, Integer newSalary, String newCurrency) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + applicationId + " nie została znaleziona"));

        String content = String.format("Stawka zmieniona: %d %s -> %d %s",
                oldSalary != null ? oldSalary : 0,
                oldCurrency != null ? oldCurrency : "PLN",
                newSalary != null ? newSalary : 0,
                newCurrency != null ? newCurrency : "PLN");

        log.info("Creating salary change note for applicationId={}", applicationId);
        Note note = new Note(content, application);
        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }
}
