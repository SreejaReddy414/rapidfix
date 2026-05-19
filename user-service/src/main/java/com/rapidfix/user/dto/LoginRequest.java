package com.rapidfix.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Login credentials")
public class LoginRequest {

    @NotBlank(message = "{validation.login.email.required}")
    @Email
    @Schema(example = "john@example.com")
    private String email;

    @NotBlank(message = "{validation.login.password.required}")
    @Schema(example = "secret123")
    private String password;
}