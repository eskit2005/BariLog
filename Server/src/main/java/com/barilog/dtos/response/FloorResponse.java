package com.barilog.dtos.response;

import lombok.Data;

import java.time.Instant;

@Data
public class FloorResponse {
    private Long id;
    private Long buildingId;
    private Integer floorNumber;
    private String blockWing;
    private String description;
    private Instant createdAt;
}
