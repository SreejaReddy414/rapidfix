package com.rapidfix.technician.dto;

import com.rapidfix.technician.entity.ServiceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Register a technician profile. " +
        "latitude and longitude are optional at registration — " +
        "update them later via PATCH /api/technicians/{id}/location")
public class TechnicianRequest {

    @NotBlank(message = "{validation.phone.required}")
    @Pattern(regexp = "^[0-9]{10}$", message = "{validation.phone.invalid}")
    private String phone;

    @NotEmpty(message = "{validation.service.types.required}")
    private Set<ServiceType> serviceTypes;

    @Schema(description = "Current latitude — send from device GPS. Optional at registration.")
    private Double latitude;

    @Schema(description = "Current longitude — send from device GPS. Optional at registration.")
    private Double longitude;
}