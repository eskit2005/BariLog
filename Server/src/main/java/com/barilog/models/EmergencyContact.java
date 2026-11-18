package com.barilog.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Shared model representing emergency contact information for a resident profile.
 * Reuses existing Resident table emergency contact attributes without duplicating schemas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContact {
    private String name;
    private String phone;
    private String relationship;
}
