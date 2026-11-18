package com.barilog.dtos.response;
import lombok.Data;
@Data public class EmergencyContactResponse {
 private Long residentId;
 private String bloodGroup;
 private String emergencyContactName;
 private String emergencyContactRelationship;
 private String emergencyContactPhone;
 private String physicianName;
 private String physicianPhone;
 private ContactVisibility visibility;
}
