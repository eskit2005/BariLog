package com.barilog.controllers;

import com.barilog.dtos.request.ApartmentRequest;
import com.barilog.dtos.request.OccupancyUpdateRequest;
import com.barilog.dtos.response.ApartmentResponse;
import com.barilog.dtos.response.OccupancyHistoryResponse;
import com.barilog.entities.OccupancyStatus;
import com.barilog.services.ApartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApartmentResponse> createApartment(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apartmentService.createApartment(request));
    }

    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getApartments(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) Long floorId,
            @RequestParam(required = false) OccupancyStatus status,
            @RequestParam(required = false) Long residentId,
            @RequestParam(required = false) Long ownerId) {
        return ResponseEntity.ok(apartmentService.getApartments(buildingId, floorId, status, residentId, ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApartmentResponse> getApartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.getApartmentById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApartmentResponse> updateApartment(
            @PathVariable Long id,
            @Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.ok(apartmentService.updateApartment(id, request));
    }

    @PatchMapping("/{id}/occupancy")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApartmentResponse> updateOccupancy(
            @PathVariable Long id,
            @Valid @RequestBody OccupancyUpdateRequest request) {
        return ResponseEntity.ok(apartmentService.updateOccupancyStatus(id, request));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OccupancyHistoryResponse>> getOccupancyHistory(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.getOccupancyHistory(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteApartment(@PathVariable Long id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.noContent().build();
    }
}
