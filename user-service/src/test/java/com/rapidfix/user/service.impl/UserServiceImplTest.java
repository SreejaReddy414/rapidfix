package com.rapidfix.user.service.impl;

import com.rapidfix.user.dto.*;
import com.rapidfix.user.entity.*;
import com.rapidfix.user.exception.*;
import com.rapidfix.user.mapper.UserMapper;
import com.rapidfix.user.repository.UserRepository;
import com.rapidfix.user.security.JwtUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Tests")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserMapper userMapper;

    @InjectMocks private UserServiceImpl service;

    // ─── Test data ────────────────────────────────────────────
    private UserRequest userRequest;
    private LoginRequest loginRequest;
    private User savedUser;
    private UserResponse userResponse;
    private UserResponse userResponseWithToken;

    @BeforeEach
    void setUp() {
        userRequest = UserRequest.builder()
                .name("Sreeja Reddy")
                .email("sreeja@gmail.com")
                .password("password123")
                .role("USER")
                .build();

        loginRequest = LoginRequest.builder()
                .email("sreeja@gmail.com")
                .password("password123")
                .build();

        savedUser = User.builder()
                .id(1L)
                .name("Sreeja Reddy")
                .email("sreeja@gmail.com")
                .password("$2a$10$hashedpassword")
                .role(Role.USER)
                .build();

        userResponse = UserResponse.builder()
                .id(1L).name("Sreeja Reddy")
                .email("sreeja@gmail.com").role("USER")
                .build();

        userResponseWithToken = UserResponse.builder()
                .id(1L).name("Sreeja Reddy")
                .email("sreeja@gmail.com").role("USER")
                .token("mock.jwt.token")
                .build();
    }

    // ══════════════════════════════════════════════════════════
    // REGISTER TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("Should register user successfully and return JWT token")
        void register_success() {
            when(userRepository.existsByEmail("sreeja@gmail.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedpassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja Reddy"))
                    .thenReturn("mock.jwt.token");
            when(userMapper.toResponseWithToken(savedUser, "mock.jwt.token"))
                    .thenReturn(userResponseWithToken);

            UserResponse result = service.register(userRequest);

            assertThat(result).isNotNull();
            assertThat(result.getToken()).isEqualTo("mock.jwt.token");
            assertThat(result.getEmail()).isEqualTo("sreeja@gmail.com");
            assertThat(result.getRole()).isEqualTo("USER");

            verify(userRepository).existsByEmail("sreeja@gmail.com");
            verify(passwordEncoder).encode("password123");
            verify(userRepository).save(any(User.class));
            verify(jwtUtil).generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja Reddy");
        }

        @Test
        @DisplayName("Should throw EmailAlreadyExistsException when email is already registered")
        void register_duplicateEmail_throwsException() {
            when(userRepository.existsByEmail("sreeja@gmail.com")).thenReturn(true);

            assertThatThrownBy(() -> service.register(userRequest))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessageContaining("Email already registered");

            verify(userRepository, never()).save(any());
            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("Should register TECHNICIAN role successfully")
        void register_technicianRole_success() {
            userRequest.setRole("TECHNICIAN");
            User techUser = User.builder().id(2L).name("Dilip").email("sreeja@gmail.com")
                    .password("hashed").role(Role.TECHNICIAN).build();
            UserResponse techResponse = UserResponse.builder().id(2L).name("Dilip")
                    .email("sreeja@gmail.com").role("TECHNICIAN").token("tech.token").build();

            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            when(userRepository.save(any())).thenReturn(techUser);
            when(jwtUtil.generateToken(any(), eq("TECHNICIAN"), any(), any())).thenReturn("tech.token");
            when(userMapper.toResponseWithToken(techUser, "tech.token")).thenReturn(techResponse);

            UserResponse result = service.register(userRequest);

            assertThat(result.getRole()).isEqualTo("TECHNICIAN");
        }

        @Test
        @DisplayName("Should throw RuntimeException when role is ADMIN")
        void register_adminRole_throwsException() {
            userRequest.setRole("ADMIN");
            when(userRepository.existsByEmail(any())).thenReturn(false);

            assertThatThrownBy(() -> service.register(userRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only USER or TECHNICIAN roles allowed");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should default to USER role when role is null")
        void register_nullRole_defaultsToUser() {
            userRequest.setRole(null);
            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                assertThat(u.getRole()).isEqualTo(Role.USER);
                return savedUser;
            });
            when(jwtUtil.generateToken(any(), any(), any(), any())).thenReturn("token");
            when(userMapper.toResponseWithToken(any(), any())).thenReturn(userResponseWithToken);

            service.register(userRequest);

            verify(userRepository).save(argThat(u -> u.getRole() == Role.USER));
        }

        @Test
        @DisplayName("Should throw RuntimeException for invalid role string")
        void register_invalidRole_throwsException() {
            userRequest.setRole("SUPERADMIN");
            when(userRepository.existsByEmail(any())).thenReturn(false);

            assertThatThrownBy(() -> service.register(userRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid role");
        }

        @Test
        @DisplayName("Password should be BCrypt encoded — never stored as plain text")
        void register_passwordIsEncoded() {
            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedpassword");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                assertThat(u.getPassword()).isEqualTo("$2a$10$hashedpassword");
                assertThat(u.getPassword()).doesNotContain("password123");
                return savedUser;
            });
            when(jwtUtil.generateToken(any(), any(), any(), any())).thenReturn("token");
            when(userMapper.toResponseWithToken(any(), any())).thenReturn(userResponseWithToken);

            service.register(userRequest);

            verify(passwordEncoder).encode("password123");
        }
    }

    // ══════════════════════════════════════════════════════════
    // LOGIN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully and return JWT token")
        void login_success() {
            when(userRepository.findByEmail("sreeja@gmail.com")).thenReturn(Optional.of(savedUser));
            when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(true);
            when(jwtUtil.generateToken("sreeja@gmail.com", "USER", 1L, "Sreeja Reddy"))
                    .thenReturn("mock.jwt.token");
            when(userMapper.toResponseWithToken(savedUser, "mock.jwt.token"))
                    .thenReturn(userResponseWithToken);

            UserResponse result = service.login(loginRequest);

            assertThat(result).isNotNull();
            assertThat(result.getToken()).isEqualTo("mock.jwt.token");
            assertThat(result.getEmail()).isEqualTo("sreeja@gmail.com");
        }

        @Test
        @DisplayName("Should throw InvalidCredentialsException when email not found")
        void login_emailNotFound_throwsException() {
            when(userRepository.findByEmail("sreeja@gmail.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.login(loginRequest))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid email or password");

            verify(passwordEncoder, never()).matches(any(), any());
        }

        @Test
        @DisplayName("Should throw InvalidCredentialsException when password is wrong")
        void login_wrongPassword_throwsException() {
            when(userRepository.findByEmail("sreeja@gmail.com")).thenReturn(Optional.of(savedUser));
            when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(false);

            assertThatThrownBy(() -> service.login(loginRequest))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid email or password");

            verify(jwtUtil, never()).generateToken(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Error message should be same for wrong email and wrong password — security best practice")
        void login_sameErrorForEmailAndPassword() {
            when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
            Throwable t1 = catchThrowable(() -> service.login(loginRequest));

            when(userRepository.findByEmail(any())).thenReturn(Optional.of(savedUser));
            when(passwordEncoder.matches(any(), any())).thenReturn(false);
            Throwable t2 = catchThrowable(() -> service.login(loginRequest));

            assertThat(t1.getMessage()).isEqualTo(t2.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════
    // GET USER TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getUserById()")
    class GetUserTests {

        @Test
        @DisplayName("Should return user when found by ID")
        void getUserById_success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(savedUser));
            when(userMapper.toResponse(savedUser)).thenReturn(userResponse);

            UserResponse result = service.getUserById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getEmail()).isEqualTo("sreeja@gmail.com");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user ID not found")
        void getUserById_notFound_throwsException() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getUserById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found: 99");
        }
    }

    // ══════════════════════════════════════════════════════════
    // GET ALL USERS TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getAllUsers()")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should return paginated list of users")
        void getAllUsers_success() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> page = new PageImpl<>(List.of(savedUser), pageable, 1);

            when(userRepository.findAll(pageable)).thenReturn(page);
            when(userMapper.toResponse(savedUser)).thenReturn(userResponse);

            PagedResponse<UserResponse> result = service.getAllUsers(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(10);
        }

        @Test
        @DisplayName("Should return empty list when no users exist")
        void getAllUsers_empty() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(userRepository.findAll(pageable)).thenReturn(emptyPage);

            PagedResponse<UserResponse> result = service.getAllUsers(pageable);

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE USER TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateUser()")
    class UpdateUserTests {

        @Test
        @DisplayName("Should update user name successfully")
        void updateUser_name_success() {
            userRequest.setName("Sreeja Updated");
            when(userRepository.findById(1L)).thenReturn(Optional.of(savedUser));
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(userMapper.toResponse(any())).thenReturn(userResponse);

            service.updateUser(1L, userRequest);

            verify(userRepository).save(argThat(u -> u.getName().equals("Sreeja Updated")));
        }

        @Test
        @DisplayName("Should update password when provided")
        void updateUser_password_success() {
            userRequest.setPassword("newpassword123");
            when(userRepository.findById(1L)).thenReturn(Optional.of(savedUser));
            when(passwordEncoder.encode("newpassword123")).thenReturn("$2a$10$newhash");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(userMapper.toResponse(any())).thenReturn(userResponse);

            service.updateUser(1L, userRequest);

            verify(passwordEncoder).encode("newpassword123");
        }

        @Test
        @DisplayName("Should NOT update password when blank")
        void updateUser_blankPassword_notUpdated() {
            userRequest.setPassword("   ");
            when(userRepository.findById(1L)).thenReturn(Optional.of(savedUser));
            when(userRepository.save(any())).thenReturn(savedUser);
            when(userMapper.toResponse(any())).thenReturn(userResponse);

            service.updateUser(1L, userRequest);

            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void updateUser_notFound_throwsException() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateUser(99L, userRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found: 99");
        }
    }

    // ══════════════════════════════════════════════════════════
    // DELETE USER TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("deleteUser()")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete user successfully")
        void deleteUser_success() {
            when(userRepository.existsById(1L)).thenReturn(true);
            doNothing().when(userRepository).deleteById(1L);

            assertThatCode(() -> service.deleteUser(1L)).doesNotThrowAnyException();

            verify(userRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void deleteUser_notFound_throwsException() {
            when(userRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteUser(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found: 99");

            verify(userRepository, never()).deleteById(any());
        }
    }
}