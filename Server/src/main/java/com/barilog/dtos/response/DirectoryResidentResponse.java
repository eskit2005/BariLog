package com.barilog.dtos.response;
import lombok.Data;
@Data public class DirectoryResidentResponse {
 private Long residentId;
 private String name;
 private java.util.List<DirectoryUnitResponse> units;
 private String phoneNumber;
 private String email;
 private ContactVisibility phoneVisibility;
 private ContactVisibility emailVisibility;
}
