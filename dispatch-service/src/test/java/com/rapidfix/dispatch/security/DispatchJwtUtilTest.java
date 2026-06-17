package com.rapidfix.dispatch.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Dispatch JwtUtil Tests")
class DispatchJwtUtilTest {

    private static final String SECRET =
            "dispatch-test-secret-key-minimum-32-chars-long!!";

    private JwtUtil jwtUtil;
    private String validToken;

    @BeforeEach
    void setUp() {
        jwtUtil    = new JwtUtil(SECRET);
        validToken = buildToken("john@test.com", "TECHNICIAN", "John", 5L, 60_000);
    }

    // ── helpers ───────────────────────────────────────────────

    private String buildToken(String email, String role, String name, Long userId, long ttlMs) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject(email)
                .addClaims(Map.of("role", role, "name", name, "userId", userId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ttlMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ── extractEmail ──────────────────────────────────────────

    @Test
    @DisplayName("extractEmail returns subject")
    void extractEmail_success() {
        assertThat(jwtUtil.extractEmail(validToken)).isEqualTo("john@test.com");
    }

    // ── extractRole ───────────────────────────────────────────

    @Test
    @DisplayName("extractRole returns role claim")
    void extractRole_success() {
        assertThat(jwtUtil.extractRole(validToken)).isEqualTo("TECHNICIAN");
    }

    @Test
    @DisplayName("extractRole returns USER role correctly")
    void extractRole_user() {
        String token = buildToken("alice@test.com", "USER", "Alice", 1L, 60_000);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("USER");
    }

    // ── extractName ───────────────────────────────────────────

    @Test
    @DisplayName("extractName returns name claim")
    void extractName_success() {
        assertThat(jwtUtil.extractName(validToken)).isEqualTo("John");
    }

    // ── extractUserId ─────────────────────────────────────────

    @Test
    @DisplayName("extractUserId returns userId claim as Long")
    void extractUserId_success() {
        assertThat(jwtUtil.extractUserId(validToken)).isEqualTo(5L);
    }

    @Test
    @DisplayName("extractUserId returns null when claim missing")
    void extractUserId_missingClaim_returnsNull() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("john@test.com")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        assertThat(jwtUtil.extractUserId(token)).isNull();
    }

    // ── validateToken ─────────────────────────────────────────

    @Test
    @DisplayName("validateToken returns true for valid token")
    void validateToken_valid() {
        assertThat(jwtUtil.validateToken(validToken)).isTrue();
    }

    @Test
    @DisplayName("validateToken returns false for tampered token")
    void validateToken_tampered() {
        String tampered = validToken.substring(0, validToken.length() - 5) + "XXXXX";
        assertThat(jwtUtil.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for random string")
    void validateToken_randomString() {
        assertThat(jwtUtil.validateToken("not.a.jwt")).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for empty string")
    void validateToken_emptyString() {
        assertThat(jwtUtil.validateToken("")).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for expired token")
    void validateToken_expired() throws InterruptedException {
        String expired = buildToken("john@test.com", "TECHNICIAN", "John", 5L, -1000);
        assertThat(jwtUtil.validateToken(expired)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for token signed with different secret")

    void validateToken_differentSecret() {
        String otherSecret =
                "completely-different-secret-key-minimum-32-chars!";

        SecretKey key = Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8));

        String otherToken = Jwts.builder()
                .setSubject("john@test.com")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertThat(jwtUtil.validateToken(otherToken)).isFalse();
    }
}