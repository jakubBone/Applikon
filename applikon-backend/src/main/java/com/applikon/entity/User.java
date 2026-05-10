package com.applikon.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "google_id", nullable = false, unique = true)
    private String googleId;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "refresh_token_expiry")
    private LocalDateTime refreshTokenExpiry;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "privacy_policy_accepted_at")
    private LocalDateTime privacyPolicyAcceptedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    protected User() {}

    public User(String email, String name, String googleId) {
        this.email = email;
        this.name = name;
        this.googleId = googleId;
    }

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void acceptPrivacyPolicy() {
        if (this.privacyPolicyAcceptedAt == null) {
            this.privacyPolicyAcceptedAt = LocalDateTime.now();
        }
    }

    public void updateProfile(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public void setRefreshToken(String refreshToken, LocalDateTime expiry) {
        this.refreshToken = refreshToken;
        this.refreshTokenExpiry = expiry;
    }

    public void clearRefreshToken() {
        this.refreshToken = null;
        this.refreshTokenExpiry = null;
    }

    public boolean isRefreshTokenValid(String tokenHash) {
        return refreshToken != null
                && refreshToken.equals(tokenHash)
                && refreshTokenExpiry != null
                && refreshTokenExpiry.isAfter(LocalDateTime.now());
    }
}
