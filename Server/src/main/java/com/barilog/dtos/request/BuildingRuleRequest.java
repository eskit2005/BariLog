package com.barilog.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BuildingRuleRequest {

    @NotBlank(message = "Rule title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @NotBlank(message = "Rule description is required")
    private String description;

    @Size(max = 50, message = "Category must be at most 50 characters")
    private String category;
}
