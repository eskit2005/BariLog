package com.barilog.dtos.request;
import lombok.Data;
import jakarta.validation.constraints.*;
@Data public class AssignManagerRequest { @NotNull @Positive private Long managerId; }
