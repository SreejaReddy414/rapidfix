package com.rapidfix.dispatch.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Technician submits actual work details at completion")
public class CompletionRequest {

    @NotNull(message = "Actual hours is required")
    @DecimalMin(value = "0.5", message = "Minimum 0.5 hours")
    @Schema(description = "Actual hours worked", example = "2.5")
    private Double actualHours;

    @NotNull(message = "Actual appliance charge is required — use 0 if no parts used")
    @Min(value = 0, message = "Cannot be negative")
    @Schema(
            description = "Actual cost of parts/appliances used after work. " +
                    "This is the REAL cost — may differ from the estimated amount in the quote.",
            example = "420.0"
    )
    private Double actualApplianceCharge;

    @Size(max = 500)
    @Schema(description = "Summary of work done", example = "Replaced capacitor and motor bearings")
    private String completionNote;
}