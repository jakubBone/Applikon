package com.easyapply.dto;

import com.easyapply.entity.User;

import java.util.UUID;

public record UserResponse(UUID id, String email, String name, String privacyPolicyAcceptedAt) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPrivacyPolicyAcceptedAt() != null
                        ? user.getPrivacyPolicyAcceptedAt().toString()
                        : null
        );
    }
}
