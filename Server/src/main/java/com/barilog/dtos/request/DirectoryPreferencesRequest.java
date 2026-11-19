package com.barilog.dtos.request;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
@Data public class DirectoryPreferencesRequest {
 @NotNull private Boolean sharePhone;
 @NotNull private Boolean shareEmail;
 @NotNull private Boolean shareEmergencyContacts;
}
