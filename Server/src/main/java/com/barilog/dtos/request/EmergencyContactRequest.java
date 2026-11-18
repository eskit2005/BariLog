package com.barilog.dtos.request;
import lombok.Data;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Size;
@Data public class EmergencyContactRequest {
 @Size(max=10) @Size(max=10) private String bloodGroup;
 @Size(max=150) @Size(max=150) private String emergencyContactName;
 @Size(max=50) @Size(max=50) private String emergencyContactRelationship;
 @Size(max=30) @Size(max=30) private String emergencyContactPhone;
 @Size(max=150) @Size(max=150) private String physicianName;
 @Size(max=30) @Size(max=30) private String physicianPhone;
}
