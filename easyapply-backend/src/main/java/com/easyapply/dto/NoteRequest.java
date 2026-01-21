package com.easyapply.dto;

import com.easyapply.entity.NoteCategory;
import jakarta.validation.constraints.NotBlank;

public class NoteRequest {

    @NotBlank(message = "Treść notatki nie może być pusta")
    private String content;

    private NoteCategory category;

    // Getters and Setters
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
}
