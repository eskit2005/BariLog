package com.barilog.controllers;

import com.barilog.dtos.request.BuildingRequest;
import com.barilog.dtos.request.FloorRequest;
import com.barilog.dtos.response.BuildingResponse;
import com.barilog.dtos.response.FloorResponse;
import com.barilog.dtos.response.OccupancyStatsResponse;
import com.barilog.services.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<BuildingResponse> createBuilding(@Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(buildingService.createBuilding(request));
    }

    @GetMapping
    public ResponseEntity<List<BuildingResponse>> getAllBuildings() {
        return ResponseEntity.ok(buildingService.getAllBuildings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildingResponse> getBuildingById(@PathVariable Long id) {
        return ResponseEntity.ok(buildingService.getBuildingById(id));
    }

    @PostMapping("/{id}/floors")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<FloorResponse> addFloor(@PathVariable Long id, @Valid @RequestBody FloorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(buildingService.addFloor(id, request));
    }

    @GetMapping("/{id}/floors")
    public ResponseEntity<List<FloorResponse>> getFloorsByBuilding(@PathVariable Long id) {
        return ResponseEntity.ok(buildingService.getFloorsByBuilding(id));
    }

    @GetMapping("/{id}/occupancy-stats")
    public ResponseEntity<OccupancyStatsResponse> getOccupancyStats(@PathVariable Long id) {
        return ResponseEntity.ok(buildingService.getOccupancyStats(id));
    }
}
