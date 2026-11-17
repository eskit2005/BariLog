package com.barilog.dtos.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BuildingRequest {

    @NotBlank(message = "Building name is required")
    @Size(max = 100, message = "Building name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    @NotNull(message = "Total floors count is required")
    @Min(value = 1, message = "Total floors must be at least 1")
    private Integer totalFloors;

    private Long managerId;
}
