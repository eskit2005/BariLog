package com.barilog.dtos.request;

import com.barilog.entities.TenancyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TenancyAgreementRequest {

    @NotNull(message = "Apartment ID is required")
    private Long apartmentId;

    @NotNull(message = "Resident ID is required")
    private Long residentId;

    private String agreementNumber;

    @NotNull(message = "Commencement start date is required")
    private LocalDate startDate;

    @NotNull(message = "Expiry end date is required")
    private LocalDate endDate;

    @NotNull(message = "Rent amount is required")
    private BigDecimal rentAmount;

    private BigDecimal depositAmount = BigDecimal.ZERO;

    private String paymentFrequency = "MONTHLY";

    private String terms;

    private String notes;

    private String documentReferenceId;

    private TenancyStatus status = TenancyStatus.ACTIVE;
}
