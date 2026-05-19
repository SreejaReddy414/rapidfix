package com.rapidfix.dispatch.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "No body needed — technicianId and name are extracted from your JWT token automatically.")
public class AcceptRequest {
    // technicianId and technicianName intentionally removed.
    // They are extracted from the JWT token in the controller.
}