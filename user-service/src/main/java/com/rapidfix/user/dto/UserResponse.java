package com.rapidfix.user.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "User response")
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    @Schema(description = "JWT token (only on login/register)") private String token;
}
