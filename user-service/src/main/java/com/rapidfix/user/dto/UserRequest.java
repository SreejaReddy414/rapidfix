package com.rapidfix.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "User creation/update request")
public class UserRequest {

    @NotBlank(message = "{validation.name.required}")
    @Size(min = 2, max = 100, message = "{validation.name.size}")
    @Schema(example = "John Doe")
    private String name;

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    @Schema(example = "john@example.com")
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @Schema(example = "secret123")
    private String password;

    @Schema(example = "USER", description = "USER | TECHNICIAN | ADMIN")
    private String role;
}