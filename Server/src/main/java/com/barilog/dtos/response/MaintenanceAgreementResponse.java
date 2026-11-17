package com.barilog.dtos.response;

import com.barilog.entities.AgreementStatus;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class MaintenanceAgreementResponse {
    private Long id;
    private String title;
    private String vendorName;
    private String serviceType;
    private String description;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private long daysUntilExpiry;
    private AgreementStatus status;
    private Long submittedById;
    private String submittedByName;
    private String submittedByRole;
    private boolean buildingLevel;
    private Long notedById;
    private String notedByName;
    private Instant notedAt;
    private Instant createdAt;
}
