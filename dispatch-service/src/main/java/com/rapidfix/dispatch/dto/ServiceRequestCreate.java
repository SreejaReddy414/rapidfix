package com.rapidfix.dispatch.dto;

import com.rapidfix.dispatch.entity.ServiceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Create a new service request")
public class ServiceRequestCreate {

    @NotNull(message = "{validation.service.type.required}")
    private ServiceType serviceType;

    @NotBlank(message = "{validation.description.required}")
    @Size(min = 10, max = 500, message = "{validation.description.size}")
    private String description;

    @NotNull(message = "{validation.latitude.required}")
    private Double userLatitude;

    @NotNull(message = "{validation.longitude.required}")
    private Double userLongitude;

    @NotBlank(message = "{validation.address.required}")
    private String address;
}