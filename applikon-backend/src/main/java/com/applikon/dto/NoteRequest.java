package com.applikon.dto;

import com.applikon.entity.NoteCategory;
import jakarta.validation.constraints.NotBlank;

public record NoteRequest(
        @NotBlank(message = "{validation.note.required}") String content,
        NoteCategory category) {}
