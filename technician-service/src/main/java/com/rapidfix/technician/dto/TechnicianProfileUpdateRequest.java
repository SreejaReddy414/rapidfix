package com.rapidfix.technician.dto;

import com.rapidfix.technician.entity.ServiceType;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TechnicianProfileUpdateRequest {
    @Pattern(regexp = "^[0-9]{10}$", message = "{validation.phone.invalid}")
    private String phone;

    private Set<ServiceType> serviceTypes;
}
