package com.barilog.controllers;
import com.barilog.services.BuildingSecurityAssignmentService;
import com.barilog.dtos.request.AssignManagerRequest;
import com.barilog.dtos.response.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/buildings/{buildingId}") @RequiredArgsConstructor
public class BuildingSecurityAssignmentController {
 private final BuildingSecurityAssignmentService service;
 @GetMapping("/security-assignments") public List<SecurityAssignmentResponse> list(@PathVariable Long buildingId){return service.list(buildingId);}
 @PutMapping("/security-assignments/{securityUserId}") public SecurityAssignmentResponse assign(@PathVariable Long buildingId,@PathVariable Long securityUserId){return service.assign(buildingId,securityUserId);}
 @DeleteMapping("/security-assignments/{securityUserId}") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void revoke(@PathVariable Long buildingId,@PathVariable Long securityUserId){service.revoke(buildingId,securityUserId);}
 @PutMapping("/manager") public BuildingResponse manager(@PathVariable Long buildingId,@Valid @RequestBody AssignManagerRequest request){return service.assignManager(buildingId,request.getManagerId());}
}
