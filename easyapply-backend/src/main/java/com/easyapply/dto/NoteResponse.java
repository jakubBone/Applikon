package com.easyapply.dto;

import com.easyapply.entity.Note;
import com.easyapply.entity.NoteCategory;

import java.time.LocalDateTime;

public class NoteResponse {

    private Long id;
    private String content;
    private NoteCategory category;
    private Long applicationId;
    private LocalDateTime createdAt;

    public NoteResponse() {}

    public static NoteResponse fromEntity(Note note) {
        NoteResponse response = new NoteResponse();
        response.setId(note.getId());
        response.setContent(note.getContent());
        response.setCategory(note.getCategory());
        response.setApplicationId(note.getApplication().getId());
        response.setCreatedAt(note.getCreatedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public NoteCategory getCategory() {
        return category;
    }

    public void setCategory(NoteCategory category) {
        this.category = category;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
