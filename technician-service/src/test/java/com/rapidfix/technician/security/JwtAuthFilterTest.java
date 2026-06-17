package com.rapidfix.technician.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthFilter Tests")
class JwtAuthFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    private JwtAuthFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthFilter(jwtUtil);
        SecurityContextHolder.clearContext();   // always start from a clean slate
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();   // don't leak auth between tests
    }

    // ══════════════════════════════════════════════════════════
    // Valid token — authentication IS set
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Valid Bearer token")
    class ValidTokenTests {

        @Test
        @DisplayName("Should set Authentication in SecurityContext for a valid token")
        void validToken_setsAuthentication() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
            when(jwtUtil.validateToken("valid-token")).thenReturn(true);
            when(jwtUtil.extractEmail("valid-token")).thenReturn("sreeja@gmail.com");
            when(jwtUtil.extractRole("valid-token")).thenReturn("TECHNICIAN");

            filter.doFilterInternal(request, response, filterChain);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth).isNotNull();
            assertThat(auth.getPrincipal()).isEqualTo("sreeja@gmail.com");
            assertThat(auth.getAuthorities())
                    .extracting("authority")
                    .containsExactly("ROLE_TECHNICIAN");
        }

        @Test
        @DisplayName("Should always call chain.doFilter regardless of token validity")
        void validToken_chainIsAlwaysCalled() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
            when(jwtUtil.validateToken("valid-token")).thenReturn(true);
            when(jwtUtil.extractEmail("valid-token")).thenReturn("user@test.com");
            when(jwtUtil.extractRole("valid-token")).thenReturn("USER");

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should set correct ROLE_ prefix on the authority")
        void validToken_rolePrefix() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer admin-token");
            when(jwtUtil.validateToken("admin-token")).thenReturn(true);
            when(jwtUtil.extractEmail("admin-token")).thenReturn("admin@rapidfix.com");
            when(jwtUtil.extractRole("admin-token")).thenReturn("ADMIN");

            filter.doFilterInternal(request, response, filterChain);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth.getAuthorities())
                    .extracting("authority")
                    .containsExactly("ROLE_ADMIN");
        }

        @Test
        @DisplayName("Should set email (not userId) as principal")
        void validToken_principalIsEmail() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer user-token");
            when(jwtUtil.validateToken("user-token")).thenReturn(true);
            when(jwtUtil.extractEmail("user-token")).thenReturn("dilip@gmail.com");
            when(jwtUtil.extractRole("user-token")).thenReturn("TECHNICIAN");

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                    .isEqualTo("dilip@gmail.com");
        }
    }

    // ══════════════════════════════════════════════════════════
    // Invalid token — authentication NOT set
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Invalid token")
    class InvalidTokenTests {

        @Test
        @DisplayName("Should NOT set Authentication when token is invalid")
        void invalidToken_noAuthentication() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer bad-token");
            when(jwtUtil.validateToken("bad-token")).thenReturn(false);

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }

        @Test
        @DisplayName("Should still call chain.doFilter even with an invalid token")
        void invalidToken_chainStillCalled() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer bad-token");
            when(jwtUtil.validateToken("bad-token")).thenReturn(false);

            filter.doFilterInternal(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should NOT call extractEmail or extractRole when token fails validation")
        void invalidToken_extractMethodsNotCalled() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer bad-token");
            when(jwtUtil.validateToken("bad-token")).thenReturn(false);

            filter.doFilterInternal(request, response, filterChain);

            verify(jwtUtil, never()).extractEmail(any());
            verify(jwtUtil, never()).extractRole(any());
        }
    }

    // ══════════════════════════════════════════════════════════
    // Missing / malformed Authorization header
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Missing or malformed Authorization header")
    class MissingHeaderTests {

        @Test
        @DisplayName("Should skip auth and call chain when Authorization header is absent")
        void noHeader_skipsAuth() throws Exception {
            when(request.getHeader("Authorization")).thenReturn(null);

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verify(filterChain).doFilter(request, response);
            verify(jwtUtil, never()).validateToken(any());
        }

        @Test
        @DisplayName("Should skip auth when header is empty string")
        void emptyHeader_skipsAuth() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("");

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verify(jwtUtil, never()).validateToken(any());
        }

        @Test
        @DisplayName("Should skip auth when header does not start with 'Bearer '")
        void nonBearerHeader_skipsAuth() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verify(jwtUtil, never()).validateToken(any());
            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should skip auth when header is just 'Bearer ' with no token")
        void bearerPrefixOnly_skipsAuthOrRejectsGracefully() throws Exception {
            // "Bearer " substring(7) → "" which is blank; StringUtils.hasText("Bearer ") is true
            // but validateToken("") should return false (handled in JwtUtil)
            when(request.getHeader("Authorization")).thenReturn("Bearer ");
            when(jwtUtil.validateToken("")).thenReturn(false);

            filter.doFilterInternal(request, response, filterChain);

            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verify(filterChain).doFilter(request, response);
        }
    }

    // ══════════════════════════════════════════════════════════
    // SecurityContext isolation
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("SecurityContext isolation")
    class ContextIsolationTests {

        @Test
        @DisplayName("Existing SecurityContext auth is not overwritten by a second invalid token")
        void existingAuth_notClearedByInvalidToken() throws Exception {
            // Pre-set a context (simulates a previous filter having authenticated)
            SecurityContext ctx = SecurityContextHolder.createEmptyContext();
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken preAuth =
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            "pre-existing@user.com", null, java.util.List.of());
            ctx.setAuthentication(preAuth);
            SecurityContextHolder.setContext(ctx);

            when(request.getHeader("Authorization")).thenReturn("Bearer bad-token");
            when(jwtUtil.validateToken("bad-token")).thenReturn(false);

            filter.doFilterInternal(request, response, filterChain);

            // The filter should NOT wipe out the pre-existing auth
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        }

        @Test
        @DisplayName("Credentials on the UsernamePasswordAuthenticationToken are always null")
        void auth_credentialsAreNull() throws Exception {
            when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
            when(jwtUtil.validateToken("valid-token")).thenReturn(true);
            when(jwtUtil.extractEmail("valid-token")).thenReturn("user@test.com");
            when(jwtUtil.extractRole("valid-token")).thenReturn("USER");

            filter.doFilterInternal(request, response, filterChain);

            // Password/credentials should never be stored in the security context
            assertThat(SecurityContextHolder.getContext().getAuthentication().getCredentials())
                    .isNull();
        }
    }
}