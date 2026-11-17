package com.barilog.dtos.response;

import com.barilog.entities.NoticeCategory;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private NoticeCategory category;
    private LocalDate expiryDate;
    private boolean expired;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
}
