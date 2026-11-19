package com.barilog.services;
import com.barilog.entities.*;
import com.barilog.repositories.*;
import com.barilog.dtos.request.*;
import com.barilog.dtos.response.*;
import com.barilog.mappers.BuildingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class ResidentDirectoryService {
 private final DirectoryAccessService access;
 private final ContactVisibilityService visibility;
 private final ApartmentRepository apartments;
 private final ResidentRepository residents;
 private final BuildingMapper buildingMapper;
 private Resident self() {
  User a=access.currentActor();
  User unproxied = (User) org.hibernate.Hibernate.unproxy(a);
  if (unproxied instanceof Resident r) return r;
  Optional<Resident> residentOpt = residents.findById(a.getId());
  if (residentOpt.isPresent()) return residentOpt.get();
  if ("RESIDENT".equalsIgnoreCase(a.getRole())) {
   Resident r = new Resident();
   r.setId(a.getId());
   r.setName(a.getName());
   r.setEmail(a.getEmail());
   r.setPassword(a.getPassword());
   r.setPhoneNumber(a.getPhoneNumber());
   r.setRole("RESIDENT");
   r.setIsActive(a.getIsActive());
   return residents.save(r);
  }
  throw new AccessDeniedException("Resident access required");
 }
 public List<BuildingResponse> buildings(){
  User actor=access.currentActor();
  if("STAFF".equals(actor.getRole())) throw new AccessDeniedException("Directory access denied");
  return access.accessibleBuildings(actor).stream().map(buildingMapper::toResponse).toList();
 }
 private ContactVisibility state(boolean allowed,String value){return !allowed?ContactVisibility.HIDDEN:value==null?ContactVisibility.NOT_PROVIDED:ContactVisibility.VISIBLE;}
 public List<DirectoryResidentResponse> directory(Long buildingId) {
  User actor=access.currentActor(); Building b=access.requireReadAccess(actor,buildingId);
  Map<Long,DirectoryResidentResponse> rows=new LinkedHashMap<>();
  for(Apartment apt:apartments.findByBuildingId(buildingId)) {
   if(!access.eligible(apt)) continue;
   User occupant=(User)org.hibernate.Hibernate.unproxy(apt.getCurrentResident());
   Resident r = occupant instanceof Resident ? (Resident) occupant : residents.findById(occupant.getId()).orElse(null);
   DirectoryResidentResponse row=rows.computeIfAbsent(occupant.getId(),id->{
    DirectoryResidentResponse d=new DirectoryResidentResponse();d.setResidentId(id);d.setName(occupant.getName());d.setUnits(new ArrayList<>());
    boolean phone=r!=null ? visibility.maySeePhone(actor,b,r) : true;
    boolean email=r!=null ? visibility.maySeeEmail(actor,b,r) : true;
    d.setPhoneNumber(phone?occupant.getPhoneNumber():null);d.setEmail(email?occupant.getEmail():null);
    d.setPhoneVisibility(state(phone,occupant.getPhoneNumber()));d.setEmailVisibility(state(email,occupant.getEmail()));return d;
   });
   DirectoryUnitResponse unit=new DirectoryUnitResponse();unit.setApartmentId(apt.getId());unit.setUnitNumber(apt.getUnitNumber());unit.setFloorNumber(apt.getFloor().getFloorNumber());unit.setBlockWing(apt.getFloor().getBlockWing());row.getUnits().add(unit);
  }
  return rows.values().stream().sorted(Comparator.comparing(DirectoryResidentResponse::getName).thenComparing(DirectoryResidentResponse::getResidentId)).toList();
 }
 private DirectoryPreferencesResponse prefs(Resident r){DirectoryPreferencesResponse d=new DirectoryPreferencesResponse();d.setSharePhone(r.isSharePhone());d.setShareEmail(r.isShareEmail());d.setShareEmergencyContacts(r.isShareEmergencyContacts());return d;}
 @Transactional public DirectoryPreferencesResponse preferences(){return prefs(self());}
 @Transactional public DirectoryPreferencesResponse updatePreferences(DirectoryPreferencesRequest p){Resident r=self();r.setSharePhone(p.getSharePhone());r.setShareEmail(p.getShareEmail());r.setShareEmergencyContacts(p.getShareEmergencyContacts());return prefs(residents.save(r));}
 public EmergencyContactResponse emergency(Long buildingId,Long residentId){
  User a=access.currentActor();Resident r=access.requireCurrentResident(a,buildingId,residentId);Building b=access.requireReadAccess(a,buildingId);
  EmergencyContactResponse d=new EmergencyContactResponse();d.setResidentId(residentId);
  if(!visibility.maySeeEmergency(a,b,r)){d.setVisibility(ContactVisibility.HIDDEN);return d;}
  d.setBloodGroup(r.getBloodGroup());d.setEmergencyContactName(r.getEmergencyContactName());d.setEmergencyContactRelationship(r.getEmergencyContactRelationship());d.setEmergencyContactPhone(r.getEmergencyContactPhone());d.setPhysicianName(r.getPhysicianName());d.setPhysicianPhone(r.getPhysicianPhone());
  d.setVisibility(Arrays.asList(d.getBloodGroup(),d.getEmergencyContactName(),d.getEmergencyContactRelationship(),d.getEmergencyContactPhone(),d.getPhysicianName(),d.getPhysicianPhone()).stream().allMatch(Objects::isNull)?ContactVisibility.NOT_PROVIDED:ContactVisibility.VISIBLE);return d;
 }
 public EmergencyContactResponse myEmergency(){
  Resident r=self();
  EmergencyContactResponse d=new EmergencyContactResponse();d.setResidentId(r.getId());
  d.setBloodGroup(r.getBloodGroup());d.setEmergencyContactName(r.getEmergencyContactName());d.setEmergencyContactRelationship(r.getEmergencyContactRelationship());d.setEmergencyContactPhone(r.getEmergencyContactPhone());d.setPhysicianName(r.getPhysicianName());d.setPhysicianPhone(r.getPhysicianPhone());
  d.setVisibility(Arrays.asList(d.getBloodGroup(),d.getEmergencyContactName(),d.getEmergencyContactRelationship(),d.getEmergencyContactPhone(),d.getPhysicianName(),d.getPhysicianPhone()).stream().allMatch(Objects::isNull)?ContactVisibility.NOT_PROVIDED:ContactVisibility.VISIBLE);return d;
 }
 @Transactional public EmergencyContactResponse updateMyEmergency(EmergencyContactRequest p){
  Resident r=self();
  String blood=clean(p.getBloodGroup(),10),name=clean(p.getEmergencyContactName(),150),phone=clean(p.getEmergencyContactPhone(),30),rel=clean(p.getEmergencyContactRelationship(),50),doctor=clean(p.getPhysicianName(),150),doctorPhone=clean(p.getPhysicianPhone(),30);
  if(blood!=null&&!Set.of("A+","A-","B+","B-","AB+","AB-","O+","O-").contains(blood))throw new IllegalArgumentException("Invalid blood group");
  if((name==null)!=(phone==null)||(doctor==null)!=(doctorPhone==null)||(rel!=null&&name==null))throw new IllegalArgumentException("Supply both contact name and phone");
  r.setBloodGroup(blood);r.setEmergencyContactName(name);r.setEmergencyContactPhone(phone);r.setEmergencyContactRelationship(rel);r.setPhysicianName(doctor);r.setPhysicianPhone(doctorPhone);residents.save(r);return myEmergency();
 }
 @Transactional public String updateMyPhone(String phone){
  Resident r=self();
  String cleaned=clean(phone,30);
  r.setPhoneNumber(cleaned);
  residents.save(r);
  return cleaned;
 }
 private String clean(String value,int limit){if(value==null||value.isBlank())return null;String s=value.trim();if(s.length()>limit)throw new IllegalArgumentException("Contact field is too long");return s;}
 @Transactional public EmergencyContactResponse updateEmergency(Long buildingId,Long residentId,EmergencyContactRequest p){
  User a=access.currentActor();access.requireManagementAccess(a,buildingId);Resident r=access.requireCurrentResident(a,buildingId,residentId);
  String blood=clean(p.getBloodGroup(),10),name=clean(p.getEmergencyContactName(),150),phone=clean(p.getEmergencyContactPhone(),30),rel=clean(p.getEmergencyContactRelationship(),50),doctor=clean(p.getPhysicianName(),150),doctorPhone=clean(p.getPhysicianPhone(),30);
  if(blood!=null&&!Set.of("A+","A-","B+","B-","AB+","AB-","O+","O-").contains(blood))throw new IllegalArgumentException("Invalid blood group");
  if((name==null)!=(phone==null)||(doctor==null)!=(doctorPhone==null)||(rel!=null&&name==null))throw new IllegalArgumentException("Supply both contact name and phone");
  r.setBloodGroup(blood);r.setEmergencyContactName(name);r.setEmergencyContactPhone(phone);r.setEmergencyContactRelationship(rel);r.setPhysicianName(doctor);r.setPhysicianPhone(doctorPhone);residents.save(r);return emergency(buildingId,residentId);
 }
}
