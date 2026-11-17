package com.barilog.dtos.response;

import lombok.Data;

import java.time.Instant;

@Data
public class BuildingResponse {
    private Long id;
    private String name;
    private String address;
    private Integer totalFloors;
    private Long managerId;
    private String managerName;
    private Instant createdAt;
}
