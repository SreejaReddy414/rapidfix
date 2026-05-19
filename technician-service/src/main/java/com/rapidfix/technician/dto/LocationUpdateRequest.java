package com.rapidfix.technician.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LocationUpdateRequest {

    @NotNull(message = "{validation.latitude.required}")
    private Double latitude;

    @NotNull(message = "{validation.longitude.required}")
    private Double longitude;
}