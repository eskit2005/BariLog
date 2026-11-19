package com.barilog.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Size(min = 6, max = 30, message = "Phone number must be between 6 and 30 characters")
    @Pattern(regexp = "^[+0-9\\s\\-\\(\\)]{6,30}$", message = "Please provide a valid phone number")
    private String phoneNumber;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "ADMIN|MANAGER|RESIDENT|STAFF|SECURITY", message = "Role must be one of: ADMIN, MANAGER, RESIDENT, STAFF, SECURITY")
    private String role;
}
