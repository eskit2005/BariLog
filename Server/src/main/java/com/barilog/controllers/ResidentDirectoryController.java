package com.barilog.controllers;
import com.barilog.services.ResidentDirectoryService;
import com.barilog.dtos.request.*;
import com.barilog.dtos.response.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class ResidentDirectoryController {
 private final ResidentDirectoryService service;
 @GetMapping("/directory/buildings") public List<BuildingResponse> buildings(){return service.buildings();}
 @GetMapping("/directory/me/preferences") public DirectoryPreferencesResponse preferences(){return service.preferences();}
 @PutMapping("/directory/me/preferences") public DirectoryPreferencesResponse preferences(@Valid @RequestBody DirectoryPreferencesRequest p){return service.updatePreferences(p);}
 @GetMapping("/buildings/{buildingId}/directory") public List<DirectoryResidentResponse> directory(@PathVariable Long buildingId){return service.directory(buildingId);}
 @GetMapping("/buildings/{buildingId}/directory/{residentId}/emergency") public EmergencyContactResponse emergency(@PathVariable Long buildingId,@PathVariable Long residentId){return service.emergency(buildingId,residentId);}
 @PutMapping("/buildings/{buildingId}/directory/{residentId}/emergency") public EmergencyContactResponse emergency(@PathVariable Long buildingId,@PathVariable Long residentId,@Valid @RequestBody EmergencyContactRequest p){return service.updateEmergency(buildingId,residentId,p);}
}
