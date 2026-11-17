package com.barilog.dtos.request;

import com.barilog.entities.NoticeCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class NoticeRequest {

    @NotBlank(message = "Notice title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @NotBlank(message = "Notice content is required")
    private String content;

    private NoticeCategory category;

    private LocalDate expiryDate;
}
