package com.rapidfix.dispatch.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Technician submits estimated quote before visiting")
public class QuoteRequest {

    @NotNull(message = "{validation.hourly.rate.required}")
    @Min(value = 1, message = "{validation.hourly.rate.min}")
    @Schema(description = "Your hourly charge in ₹", example = "150.0")
    private Double hourlyRate;

    @NotNull(message = "{validation.estimated.hours.required}")
    @DecimalMin(value = "0.5", message = "{validation.estimated.hours.min}")
    @Schema(description = "Estimated hours needed", example = "2.0")
    private Double estimatedHours;

    @NotNull(message = "{validation.appliance.charge.required}")
    @Min(value = 0, message = "{validation.appliance.charge.min}")
    @Schema(description = "Estimated parts/appliance cost in ₹. Use 0 if none.", example = "350.0")
    private Double applianceCharge;

    @Min(value = 0, message = "{validation.travel.charge.min}")
    @Schema(description = "Travel charge in ₹. Leave null to auto-calculate.", example = "48.0")
    private Double travelCharge;
    private String technicianPhone;
    @Size(max = 500, message = "{validation.quote.note.size}")
    @Schema(description = "What you think the problem is and what parts may be needed",
            example = "Likely capacitor issue, may need fan motor replacement")
    private String quoteNote;
    //private Double distanceKm;  // sent from frontend based on technician location
}