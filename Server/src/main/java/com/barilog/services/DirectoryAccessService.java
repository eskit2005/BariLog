package com.barilog.services;
import com.barilog.entities.*;
import com.barilog.repositories.*;
import com.barilog.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
@Service @RequiredArgsConstructor
public class DirectoryAccessService {
 private final AuthService auth;
 private final BuildingRepository buildings;
 private final ApartmentRepository apartments;
 private final BuildingSecurityAssignmentRepository assignments;
 public User currentActor() {
  User actor=auth.getLoggedUser();
  if (!Boolean.TRUE.equals(actor.getIsActive())) throw new AccessDeniedException("Inactive account");
  return actor;
 }
 public boolean eligible(Apartment a) {
  return Boolean.TRUE.equals(a.getIsActive()) && a.getOccupancyStatus()!=OccupancyStatus.VACANT
   && org.hibernate.Hibernate.unproxy(a.getCurrentResident()) instanceof Resident && Boolean.TRUE.equals(a.getCurrentResident().getIsActive());
 }
 public boolean canManageBuilding(User actor, Building b) {
  return Boolean.TRUE.equals(actor.getIsActive()) && ("ADMIN".equals(actor.getRole()) ||
   ("MANAGER".equals(actor.getRole()) && b.getManager()!=null && Objects.equals(b.getManager().getId(),actor.getId())));
 }
 public boolean canReadBuilding(User actor, Building b) {
  if (!Boolean.TRUE.equals(actor.getIsActive())) return false;
  if (canManageBuilding(actor,b)) return true;
  if ("SECURITY".equals(actor.getRole())) return assignments.existsByIdBuildingIdAndIdSecurityUserId(b.getId(),actor.getId());
  return "RESIDENT".equals(actor.getRole()) && apartments.findByCurrentResidentId(actor.getId()).stream()
   .anyMatch(a->eligible(a) && Objects.equals(a.getBuilding().getId(),b.getId()));
 }
 public Building requireReadAccess(User actor, Long id) {
  if(id == null || id < 1) throw new IllegalArgumentException("Positive building ID required");
  Building b=buildings.findById(id).orElseThrow(()->new ResourceNotFoundException("Building not found"));
  if (!canReadBuilding(actor,b)) throw new AccessDeniedException("Building access denied");
  return b;
 }
 public Building requireManagementAccess(User actor, Long id) {
  Building b=requireReadAccess(actor,id);
  if (!canManageBuilding(actor,b)) throw new AccessDeniedException("Management access required");
  return b;
 }
 public Resident requireCurrentResident(User actor, Long buildingId, Long residentId) {
  requireReadAccess(actor,buildingId);
  return apartments.findByBuildingId(buildingId).stream().filter(this::eligible)
   .map(a->(Resident)org.hibernate.Hibernate.unproxy(a.getCurrentResident())).filter(r->Objects.equals(r.getId(),residentId)).findFirst()
   .orElseThrow(()->new ResourceNotFoundException("Current resident not found"));
 }
 public List<Building> accessibleBuildings(User actor) {
  return buildings.findAll().stream().filter(b->canReadBuilding(actor,b)).toList();
 }
}
