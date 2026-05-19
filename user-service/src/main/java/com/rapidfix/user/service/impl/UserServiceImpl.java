package com.rapidfix.user.service.impl;

import com.rapidfix.user.dto.*;
import com.rapidfix.user.entity.*;
import com.rapidfix.user.exception.*;
import com.rapidfix.user.mapper.UserMapper;
import com.rapidfix.user.repository.UserRepository;
import com.rapidfix.user.security.JwtUtil;
import com.rapidfix.user.service.UserService;
import com.rapidfix.user.util.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;
    private final MessageService messages;

    @Override @Transactional
    public UserResponse register(UserRequest req) {
        log.info("Registering user: {}", req.getEmail());
        if (userRepository.existsByEmail(req.getEmail()))
            throw new EmailAlreadyExistsException(
                    messages.get("error.email.already.exists", req.getEmail()));

        User user = User.builder()
                .name(req.getName()).email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(parseRole(req.getRole())).build();

        User saved = userRepository.save(user);
        log.info("User created id={}", saved.getId());

        String token = jwtUtil.generateToken(
                saved.getEmail(), saved.getRole().name(), saved.getId(), saved.getName());
        return userMapper.toResponseWithToken(saved, token);
    }

    @Override @Transactional(readOnly = true)
    public UserResponse login(LoginRequest req) {
        log.info("Login: {}", req.getEmail());
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        messages.get("error.invalid.credentials")));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new InvalidCredentialsException(
                    messages.get("error.invalid.credentials"));

        String token = jwtUtil.generateToken(
                user.getEmail(), user.getRole().name(), user.getId(), user.getName());
        return userMapper.toResponseWithToken(user, token);
    }

    @Override @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        log.debug("Fetch user id={}", id);
        return userMapper.toResponse(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.user.not.found", id))));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return PagedResponse.<UserResponse>builder()
                .content(page.getContent().stream().map(userMapper::toResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }

    @Override @Transactional
    public UserResponse updateUser(Long id, UserRequest req) {
        log.info("Update user id={}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.user.not.found", id)));
        user.setName(req.getName());
        if (req.getPassword() != null && !req.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        if (req.getRole() != null) user.setRole(parseRole(req.getRole()));
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override @Transactional
    public void deleteUser(Long id) {
        log.info("Delete user id={}", id);
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException(
                    messages.get("error.user.not.found", id));
        userRepository.deleteById(id);
    }

    private Role parseRole(String r) {
        if (r == null || r.isBlank()) return Role.USER;
        try {
            Role role = Role.valueOf(r.toUpperCase());
            if (role != Role.USER && role != Role.TECHNICIAN)
                throw new RuntimeException(messages.get("error.role.admin.not.allowed"));
            return role;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(messages.get("error.role.invalid", r));
        }
    }
}