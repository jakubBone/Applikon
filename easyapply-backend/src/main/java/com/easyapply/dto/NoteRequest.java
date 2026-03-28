package com.easyapply.dto;

import com.easyapply.entity.NoteCategory;
import jakarta.validation.constraints.NotBlank;

public record NoteRequest(
        @NotBlank(message = "{validation.note.required}") String content,
        NoteCategory category) {}
