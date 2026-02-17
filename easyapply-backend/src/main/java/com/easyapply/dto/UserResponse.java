package com.easyapply.dto;

import com.easyapply.entity.User;

import java.util.UUID;

public record UserResponse(UUID id, String email, String name) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName());
    }
}
