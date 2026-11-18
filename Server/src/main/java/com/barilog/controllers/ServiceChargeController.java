package com.barilog.controllers;

import com.barilog.dtos.request.ChargeRuleRequest;
import com.barilog.dtos.request.GenerateChargesRequest;
import com.barilog.dtos.response.ChargeRuleResponse;
import com.barilog.dtos.response.GenerationSummaryResponse;
import com.barilog.dtos.response.ServiceChargeResponse;
import com.barilog.services.ServiceChargeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ServiceChargeController {

    private final ServiceChargeService serviceChargeService;

    // ---------- Charge rules (manager) ----------

    @PostMapping("/charge-rules")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ChargeRuleResponse> createRule(@RequestBody ChargeRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceChargeService.createRule(request));
    }

    @GetMapping("/charge-rules")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ChargeRuleResponse>> getRules(@RequestParam Long buildingId) {
        return ResponseEntity.ok(serviceChargeService.getRules(buildingId));
    }

    @PatchMapping("/charge-rules/{id}/active")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ChargeRuleResponse> setRuleActive(@PathVariable Long id, @RequestParam boolean value) {
        return ResponseEntity.ok(serviceChargeService.setRuleActive(id, value));
    }

    @DeleteMapping("/charge-rules/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        serviceChargeService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Monthly generation (manager) ----------

    @PostMapping("/service-charges/generate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<GenerationSummaryResponse> generate(@RequestBody GenerateChargesRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceChargeService.generateCharges(request));
    }

    @GetMapping("/service-charges")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ServiceChargeResponse>> getCharges(
            @RequestParam Long buildingId,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(serviceChargeService.getCharges(buildingId, month));
    }

    // ---------- Resident view ----------

    @GetMapping("/service-charges/my")
    public ResponseEntity<List<ServiceChargeResponse>> getMyCharges() {
        return ResponseEntity.ok(serviceChargeService.getMyCharges());
    }
}
