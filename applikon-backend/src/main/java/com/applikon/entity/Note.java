package com.applikon.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
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

    public void setCategory(NoteCategory category) {
        this.category = category != null ? category : NoteCategory.OTHER;
    }
}
