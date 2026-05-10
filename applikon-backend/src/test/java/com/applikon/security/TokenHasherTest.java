package com.applikon.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TokenHasher tests")
class TokenHasherTest {

    private static final String SECRET = "test-hmac-secret";

    @Test
    @DisplayName("hash() returns a 64-character hex string (HmacSHA256)")
    void hash_returnsHexString() {
        String result = TokenHasher.hash("some-token", SECRET);
        assertEquals(64, result.length());
        assertTrue(result.matches("[0-9a-f]+"));
    }

    @Test
    @DisplayName("hash() is deterministic — same input, same output")
    void hash_isDeterministic() {
        String token = "550e8400-e29b-41d4-a716-446655440000";
        assertEquals(TokenHasher.hash(token, SECRET), TokenHasher.hash(token, SECRET));
    }

    @Test
    @DisplayName("hash() produces different values for different inputs")
    void hash_differentiatesInputs() {
        assertNotEquals(TokenHasher.hash("token-a", SECRET), TokenHasher.hash("token-b", SECRET));
    }

    @Test
    @DisplayName("hash() produces different values for different secrets")
    void hash_differentiatesSecrets() {
        assertNotEquals(TokenHasher.hash("token", "secret-a"), TokenHasher.hash("token", "secret-b"));
    }
}
