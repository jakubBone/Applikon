package com.applikon.controller;

import com.applikon.dto.NoteRequest;
import com.applikon.dto.NoteResponse;
import com.applikon.security.AuthenticatedUser;
import com.applikon.service.NoteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Notes", description = "Notes per application — Questions, Feedback, Other")
@RestController
@RequestMapping("/api")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/applications/{applicationId}/notes")
    public ResponseEntity<List<NoteResponse>> findByApplicationId(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long applicationId) {
        List<NoteResponse> notes = noteService.findByApplicationId(applicationId, user.id());
        return ResponseEntity.ok(notes);
    }

    @PostMapping("/applications/{applicationId}/notes")
    public ResponseEntity<NoteResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long applicationId,
            @Valid @RequestBody NoteRequest request) {
        NoteResponse response = noteService.create(applicationId, request, user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/notes/{id}")
    public ResponseEntity<NoteResponse> findById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        NoteResponse response = noteService.findById(id, user.id());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<NoteResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        NoteResponse response = noteService.update(id, request, user.id());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        noteService.delete(id, user.id());
        return ResponseEntity.noContent().build();
    }
}
