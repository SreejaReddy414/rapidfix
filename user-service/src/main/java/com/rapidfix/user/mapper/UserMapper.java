package com.rapidfix.user.mapper;
import com.rapidfix.user.dto.UserResponse;
import com.rapidfix.user.entity.User;
import org.springframework.stereotype.Component;
@Component
public class UserMapper {
    public UserResponse toResponse(User u) {
        return UserResponse.builder().id(u.getId()).name(u.getName())
            .email(u.getEmail()).role(u.getRole().name()).build();
    }
    public UserResponse toResponseWithToken(User u, String token) {
        return UserResponse.builder().id(u.getId()).name(u.getName())
            .email(u.getEmail()).role(u.getRole().name()).token(token).build();
    }
}
