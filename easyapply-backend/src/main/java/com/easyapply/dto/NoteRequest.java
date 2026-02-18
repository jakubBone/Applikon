package com.easyapply.dto;

import com.easyapply.entity.NoteCategory;
import jakarta.validation.constraints.NotBlank;

public record NoteRequest(
        @NotBlank(message = "Treść notatki nie może być pusta") String content,
        NoteCategory category) {}
