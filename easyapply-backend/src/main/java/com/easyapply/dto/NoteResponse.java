package com.easyapply.dto;

import com.easyapply.entity.Note;
import com.easyapply.entity.NoteCategory;

import java.time.LocalDateTime;

public record NoteResponse(
        Long id,
        String content,
        NoteCategory category,
        Long applicationId,
        LocalDateTime createdAt) {

    public static NoteResponse fromEntity(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getContent(),
                note.getCategory(),
                note.getApplication().getId(),
                note.getCreatedAt()
        );
    }
}
