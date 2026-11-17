package com.barilog.dtos.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FloorRequest {

    @NotNull(message = "Floor number is required")
    private Integer floorNumber;

    @Size(max = 50, message = "Block/Wing name cannot exceed 50 characters")
    private String blockWing = "Main";

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
}
