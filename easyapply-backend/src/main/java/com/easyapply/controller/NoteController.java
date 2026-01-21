package com.easyapply.controller;

import com.easyapply.dto.NoteRequest;
import com.easyapply.dto.NoteResponse;
import com.easyapply.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/applications/{applicationId}/notes")
    public ResponseEntity<List<NoteResponse>> findByApplicationId(@PathVariable Long applicationId) {
        List<NoteResponse> notes = noteService.findByApplicationId(applicationId);
        return ResponseEntity.ok(notes);
    }

    @PostMapping("/applications/{applicationId}/notes")
    public ResponseEntity<NoteResponse> create(
            @PathVariable Long applicationId,
            @Valid @RequestBody NoteRequest request) {
        NoteResponse response = noteService.create(applicationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/notes/{id}")
    public ResponseEntity<NoteResponse> findById(@PathVariable Long id) {
        NoteResponse response = noteService.findById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<NoteResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        NoteResponse response = noteService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
