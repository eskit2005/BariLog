package com.barilog.dtos.response;

import com.barilog.entities.ComplaintStatus;
import lombok.Data;

import java.time.Instant;

@Data
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private ComplaintStatus status;
    private Long residentId;
    private String residentName;
    private String residentEmail;
    private String resolutionNote;
    private Long resolvedById;
    private String resolvedByName;
    private Instant resolvedAt;
    private Instant createdAt;
}
