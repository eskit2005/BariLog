package com.barilog.dtos.response;

import lombok.Data;

import java.time.Instant;

@Data
public class BuildingRuleResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
}
