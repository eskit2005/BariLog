package com.barilog.dtos.response;

import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class OccupancyHistoryResponse {
    private Long id;
    private Long apartmentId;
    private String unitNumber;
    private String fromStatus;
    private String toStatus;
    private Long previousResidentId;
    private String previousResidentName;
    private Long newResidentId;
    private String newResidentName;
    private Long changedByUserId;
    private String changedByUserName;
    private String reasonOrNotes;
    private LocalDate effectiveDate;
    private Instant createdAt;
}
