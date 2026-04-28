package com.easyapply.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TokenHasher tests")
class TokenHasherTest {

    @Test
    @DisplayName("hash() returns a 64-character hex string (SHA-256)")
    void hash_returnsHexString() {
        String result = TokenHasher.hash("some-token");
        assertEquals(64, result.length());
        assertTrue(result.matches("[0-9a-f]+"));
    }

    @Test
    @DisplayName("hash() is deterministic — same input, same output")
    void hash_isDeterministic() {
        String token = "550e8400-e29b-41d4-a716-446655440000";
        assertEquals(TokenHasher.hash(token), TokenHasher.hash(token));
    }

    @Test
    @DisplayName("hash() produces different values for different inputs")
    void hash_differentiatesInputs() {
        assertNotEquals(TokenHasher.hash("token-a"), TokenHasher.hash("token-b"));
    }
}
