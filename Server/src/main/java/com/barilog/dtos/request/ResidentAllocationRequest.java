package com.barilog.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ResidentAllocationRequest {

    @NotNull(message = "Apartment ID is required")
    private Long apartmentId;

    private String residentType; // "OWNER" or "TENANT"

    private LocalDate effectiveDate;

    private String notes;

    // Tenancy agreement fields (required for Tenant, omitted for Owner)
    private String agreementNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private String paymentFrequency = "MONTHLY";
    private String terms;
}
