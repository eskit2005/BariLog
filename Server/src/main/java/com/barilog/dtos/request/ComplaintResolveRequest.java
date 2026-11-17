package com.barilog.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintResolveRequest {

    @NotBlank(message = "Resolution note is required")
    private String resolutionNote;
}
