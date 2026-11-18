package com.barilog.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ResidentRegisterRequest {

    @NotBlank(message = "Resident name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email format required")
    private String email;

    @NotBlank(message = "Password is required for account security")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String phoneNumber;

    private String residentType = "TENANT"; // "OWNER" or "TENANT"

    private String nidPassportNumber;

    private String bloodGroup;

    private String occupation;

    // Shared Emergency Contact info
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    // Optional direct unit allocation on onboarding
    private Long initialApartmentId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private String paymentFrequency = "MONTHLY";
    private String terms;
}
