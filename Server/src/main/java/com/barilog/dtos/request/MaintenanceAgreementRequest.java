package com.barilog.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MaintenanceAgreementRequest {

    @NotBlank(message = "Agreement title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @NotBlank(message = "Vendor name is required")
    @Size(max = 150, message = "Vendor name must be at most 150 characters")
    private String vendorName;

    @NotBlank(message = "Service type is required")
    @Size(max = 100, message = "Service type must be at most 100 characters")
    private String serviceType;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;
}
