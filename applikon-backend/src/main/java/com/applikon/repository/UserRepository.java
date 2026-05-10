package com.applikon.repository;

import com.applikon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByRefreshToken(String refreshToken);

    @Query("SELECT u FROM User u WHERE u.lastLoginAt < :threshold OR (u.lastLoginAt IS NULL AND u.createdAt < :threshold)")
    List<User> findInactiveUsers(@Param("threshold") LocalDateTime threshold);
}
