package com.easyapply.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
@EntityListeners(AuditingEntityListener.class)
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "{validation.note.required}")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(255) DEFAULT 'OTHER'")
    private NoteCategory category = NoteCategory.OTHER;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Note() {}

    public Note(String content, Application application) {
        this.content = content;
        this.application = application;
        this.category = NoteCategory.OTHER;
    }

    public Note(String content, Application application, NoteCategory category) {
        this.content = content;
        this.application = application;
        this.category = category != null ? category : NoteCategory.OTHER;
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

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public NoteCategory getCategory() {
        return category;
    }

    public void setCategory(NoteCategory category) {
        this.category = category != null ? category : NoteCategory.OTHER;
    }
}
