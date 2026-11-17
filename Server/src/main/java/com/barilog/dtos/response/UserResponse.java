package com.barilog.dtos.response;

import lombok.Data;

import java.time.Instant;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String role;
    private Boolean isActive;
    private Instant createdAt;
}
