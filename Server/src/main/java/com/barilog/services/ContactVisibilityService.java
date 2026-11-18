package com.barilog.services;
import com.barilog.entities.*;
import com.barilog.dtos.response.ApartmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Objects;
@Service @RequiredArgsConstructor
public class ContactVisibilityService {
 private final DirectoryAccessService access;
 private boolean allowed(User a, Building b, Resident r, boolean shared) {
  if (!Boolean.TRUE.equals(a.getIsActive())) return false;
  if (Objects.equals(a.getId(),r.getId())) return true;
  return access.canReadBuilding(a,b) && (shared || access.canManageBuilding(a,b) || "SECURITY".equals(a.getRole()));
 }
 public boolean maySeePhone(User a,Building b,Resident r) {return allowed(a,b,r,r.isSharePhone());}
 public boolean maySeeEmail(User a,Building b,Resident r) {return allowed(a,b,r,r.isShareEmail());}
 public boolean maySeeEmergency(User a,Building b,Resident r) {return allowed(a,b,r,r.isShareEmergencyContacts());}
 public ApartmentResponse redactApartment(User a, Apartment apt, ApartmentResponse dto) {
  Building b=apt.getBuilding();
  boolean privileged=access.canManageBuilding(a,b) || ("SECURITY".equals(a.getRole()) && access.canReadBuilding(a,b));
  if (privileged) return dto;
  User occupant=apt.getCurrentResident();
  Resident r=org.hibernate.Hibernate.unproxy(occupant) instanceof Resident ? (Resident)org.hibernate.Hibernate.unproxy(occupant) : null;
  if(r==null || !maySeePhone(a,b,r)) dto.setCurrentResidentPhone(null);
  if(r==null || !maySeeEmail(a,b,r)) dto.setCurrentResidentEmail(null);
  User owner=apt.getOwner();
  boolean self=owner!=null && Objects.equals(a.getId(),owner.getId());
  Resident residentOwner=org.hibernate.Hibernate.unproxy(owner) instanceof Resident && access.eligible(apt) && Objects.equals(owner.getId(),occupant.getId()) ? (Resident)org.hibernate.Hibernate.unproxy(owner) : null;
  dto.setOwnerPhone(self ? apt.getOwnerPhone() : residentOwner!=null && maySeePhone(a,b,residentOwner) ? residentOwner.getPhoneNumber() : null);
  dto.setOwnerEmail(self ? apt.getOwnerEmail() : residentOwner!=null && maySeeEmail(a,b,residentOwner) ? residentOwner.getEmail() : null);
  return dto;
 }
}
