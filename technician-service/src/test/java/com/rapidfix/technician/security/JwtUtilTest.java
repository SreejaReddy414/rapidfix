package com.rapidfix.technician.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtUtil Tests")
class JwtUtilTest {

    // Must be ≥256 bits (32 chars) for HS256
    private static final String SECRET =
            "TestSecretKeyForJWTTokenMustBe256BitsLongEnoughForHS256Algorithm";

    private JwtUtil jwtUtil;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET);
        signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    // ─── helpers ──────────────────────────────────────────────

    /** Build a valid, non-expired token with any claims you pass in. */
    private String buildToken(String subject, Map<String, Object> extraClaims) {
        return buildToken(subject, extraClaims, System.currentTimeMillis() + 3_600_000L);
    }

    private String buildToken(String subject, Map<String, Object> extraClaims, long expiryMs) {
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(extraClaims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(expiryMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // ══════════════════════════════════════════════════════════
    // extractEmail
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractEmail()")
    class ExtractEmailTests {

        @Test
        @DisplayName("Returns subject as email")
        void extractEmail_returnsSubject() {
            String token = buildToken("sreeja@gmail.com", Map.of("role", "TECHNICIAN"));

            assertThat(jwtUtil.extractEmail(token)).isEqualTo("sreeja@gmail.com");
        }

        @Test
        @DisplayName("Works with different email addresses")
        void extractEmail_differentEmails() {
            String token = buildToken("admin@rapidfix.com", Map.of("role", "ADMIN"));

            assertThat(jwtUtil.extractEmail(token)).isEqualTo("admin@rapidfix.com");
        }
    }

    // ══════════════════════════════════════════════════════════
    // extractRole
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractRole()")
    class ExtractRoleTests {

        @Test
        @DisplayName("Returns role claim correctly")
        void extractRole_returnsRole() {
            String token = buildToken("user@test.com", Map.of("role", "USER"));

            assertThat(jwtUtil.extractRole(token)).isEqualTo("USER");
        }

        @ParameterizedTest(name = "role={0}")
        @ValueSource(strings = {"ADMIN", "TECHNICIAN", "USER"})
        @DisplayName("Handles all role types")
        void extractRole_allRoles(String role) {
            String token = buildToken("test@test.com", Map.of("role", role));

            assertThat(jwtUtil.extractRole(token)).isEqualTo(role);
        }

        @Test
        @DisplayName("Returns null when role claim is absent")
        void extractRole_missingClaim_returnsNull() {
            String token = buildToken("test@test.com", Map.of());  // no role claim

            assertThat(jwtUtil.extractRole(token)).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════
    // extractName
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractName()")
    class ExtractNameTests {

        @Test
        @DisplayName("Returns name claim correctly")
        void extractName_returnsName() {
            String token = buildToken("dilip@gmail.com",
                    Map.of("role", "TECHNICIAN", "name", "Dilip Kumar"));

            assertThat(jwtUtil.extractName(token)).isEqualTo("Dilip Kumar");
        }

        @Test
        @DisplayName("Returns null when name claim is absent")
        void extractName_missingClaim_returnsNull() {
            String token = buildToken("test@test.com", Map.of("role", "USER"));

            assertThat(jwtUtil.extractName(token)).isNull();
        }
    }

    // ══════════════════════════════════════════════════════════
    // extractUserId
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractUserId()")
    class ExtractUserIdTests {

        @Test
        @DisplayName("Returns userId as Long")
        void extractUserId_returnsLong() {
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "TECHNICIAN");
            claims.put("userId", 42);          // JWT stores numbers as Integer by default
            String token = buildToken("user@test.com", claims);

            assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
        }

        @Test
        @DisplayName("Returns null when userId claim is absent")
        void extractUserId_missingClaim_returnsNull() {
            String token = buildToken("test@test.com", Map.of("role", "USER"));

            assertThat(jwtUtil.extractUserId(token)).isNull();
        }

        @Test
        @DisplayName("Converts string userId to Long")
        void extractUserId_stringValue_convertsToLong() {
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "USER");
            claims.put("userId", "100");
            String token = buildToken("test@test.com", claims);

            assertThat(jwtUtil.extractUserId(token)).isEqualTo(100L);
        }
    }

    // ══════════════════════════════════════════════════════════
    // validateToken
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("validateToken()")
    class ValidateTokenTests {

        @Test
        @DisplayName("Returns true for a valid token")
        void validateToken_validToken_returnsTrue() {
            String token = buildToken("user@test.com", Map.of("role", "USER"));

            assertThat(jwtUtil.validateToken(token)).isTrue();
        }

        @Test
        @DisplayName("Returns false for an expired token")
        void validateToken_expiredToken_returnsFalse() {
            // Expiry in the past
            String token = buildToken("user@test.com", Map.of("role", "USER"),
                    System.currentTimeMillis() - 1000L);

            assertThat(jwtUtil.validateToken(token)).isFalse();
        }

        @Test
        @DisplayName("Returns false for a token signed with a different key")
        void validateToken_wrongSignature_returnsFalse() {
            SecretKey otherKey = Keys.hmacShaKeyFor(
                    "AnotherSecretKeyThatIsDifferentFromTheMainOneUsedInTests!!".getBytes(StandardCharsets.UTF_8));
            String token = Jwts.builder()
                    .setSubject("user@test.com")
                    .setExpiration(new Date(System.currentTimeMillis() + 3_600_000L))
                    .signWith(otherKey, SignatureAlgorithm.HS256)
                    .compact();

            assertThat(jwtUtil.validateToken(token)).isFalse();
        }

        @Test
        @DisplayName("Returns false for a malformed token string")
        void validateToken_malformedToken_returnsFalse() {
            assertThat(jwtUtil.validateToken("not.a.jwt")).isFalse();
        }

        @Test
        @DisplayName("Returns false for an empty string")
        void validateToken_emptyString_returnsFalse() {
            assertThat(jwtUtil.validateToken("")).isFalse();
        }

        @Test
        @DisplayName("Returns false for a randomly corrupted token")
        void validateToken_corruptedToken_returnsFalse() {
            String valid = buildToken("user@test.com", Map.of("role", "USER"));
            // Corrupt the signature part (last segment)
            String[] parts = valid.split("\\.");
            String corrupted = parts[0] + "." + parts[1] + ".invalidsignature";

            assertThat(jwtUtil.validateToken(corrupted)).isFalse();
        }
    }
}