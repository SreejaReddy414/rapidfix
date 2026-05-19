package com.rapidfix.user.security;

import org.junit.jupiter.api.*;
import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtUtil Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String SECRET =
            "RapidFixSuperSecretKeyForJWTTokenMustBe256BitsLongEnough!!";
    private static final long EXPIRATION_MS = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, EXPIRATION_MS);
    }

    // ══════════════════════════════════════════════════════════
    // GENERATE TOKEN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("generateToken()")
    class GenerateTokenTests {

        @Test
        @DisplayName("Should generate a non-null token")
        void generateToken_notNull() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("Should generate token with 3 parts separated by dots (JWT format)")
        void generateToken_jwtFormat() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(token.split("\\.")).hasSize(3);
        }

        @Test
        @DisplayName("Should generate different tokens for different users")
        void generateToken_differentUsers_differentTokens() {
            String token1 = jwtUtil.generateToken("user1@gmail.com", "USER", 1L, "User1");
            String token2 = jwtUtil.generateToken("user2@gmail.com", "USER", 2L, "User2");
            assertThat(token1).isNotEqualTo(token2);
        }
    }

    // ══════════════════════════════════════════════════════════
    // EXTRACT CLAIMS TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("extractEmail() / extractRole()")
    class ExtractClaimsTests {

        @Test
        @DisplayName("Should extract correct email from token")
        void extractEmail_success() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(jwtUtil.extractEmail(token)).isEqualTo("sreeja@gmail.com");
        }

        @Test
        @DisplayName("Should extract correct role from token")
        void extractRole_success() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "TECHNICIAN", 1L, "Sreeja");
            assertThat(jwtUtil.extractRole(token)).isEqualTo("TECHNICIAN");
        }

        @Test
        @DisplayName("Should extract USER role correctly")
        void extractRole_user() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(jwtUtil.extractRole(token)).isEqualTo("USER");
        }
    }

    // ══════════════════════════════════════════════════════════
    // VALIDATE TOKEN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("validateToken()")
    class ValidateTokenTests {

        @Test
        @DisplayName("Should return true for a valid token")
        void validateToken_valid() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(jwtUtil.validateToken(token)).isTrue();
        }

        @Test
        @DisplayName("Should return false for a tampered token")
        void validateToken_tampered() {
            String token = jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            String tampered = token.substring(0, token.length() - 5) + "XXXXX";
            assertThat(jwtUtil.validateToken(tampered)).isFalse();
        }

        @Test
        @DisplayName("Should return false for a random string")
        void validateToken_randomString() {
            assertThat(jwtUtil.validateToken("not.a.token")).isFalse();
        }

        @Test
        @DisplayName("Should return false for an empty string")
        void validateToken_emptyString() {
            assertThat(jwtUtil.validateToken("")).isFalse();
        }

        @Test
        @DisplayName("Should return false for an expired token")
        void validateToken_expired() {
            JwtUtil shortLivedJwt = new JwtUtil(SECRET, 1L); // 1ms expiry
            String token = shortLivedJwt.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");

            try { Thread.sleep(10); } catch (InterruptedException ignored) {}

            assertThat(shortLivedJwt.validateToken(token)).isFalse();
        }

        @Test
        @DisplayName("Should return false for token signed with different secret")
        void validateToken_differentSecret() {
            JwtUtil otherJwt = new JwtUtil(
                    "DifferentSecretKeyForJWTTokenMustBe256BitsLongEnoughXX!!", EXPIRATION_MS);
            String token = otherJwt.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja");
            assertThat(jwtUtil.validateToken(token)).isFalse();
        }
    }
}