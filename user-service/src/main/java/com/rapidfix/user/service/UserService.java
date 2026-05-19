package com.rapidfix.user.service;
import com.rapidfix.user.dto.*;
import org.springframework.data.domain.Pageable;
public interface UserService {
    UserResponse register(UserRequest request);
    UserResponse login(LoginRequest request);
    UserResponse getUserById(Long id);
    PagedResponse<UserResponse> getAllUsers(Pageable pageable);
    UserResponse updateUser(Long id, UserRequest request);
    void deleteUser(Long id);
}
