package com.barilog.services;
import com.barilog.entities.*;
import com.barilog.repositories.*;
import com.barilog.dtos.response.*;
import com.barilog.mappers.BuildingMapper;
import com.barilog.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.util.List;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class BuildingSecurityAssignmentService {
 private final DirectoryAccessService access;
 private final BuildingSecurityAssignmentRepository assignments;
 private final UserRepository users;
 private final BuildingRepository buildings;
 private final BuildingMapper mapper;
 private SecurityAssignmentResponse dto(BuildingSecurityAssignment a){SecurityAssignmentResponse d=new SecurityAssignmentResponse();d.setBuildingId(a.getId().getBuildingId());d.setSecurityUserId(a.getId().getSecurityUserId());d.setSecurityName(a.getSecurityUser().getName());return d;}
 public List<SecurityAssignmentResponse> list(Long buildingId){access.requireManagementAccess(access.currentActor(),buildingId);return assignments.findByIdBuildingId(buildingId).stream().map(this::dto).toList();}
 @Transactional public SecurityAssignmentResponse assign(Long buildingId,Long userId){
  if(userId==null || userId<1) throw new IllegalArgumentException("Positive security account ID required");
  Building b=access.requireManagementAccess(access.currentActor(),buildingId);
  User user=users.findById(userId).orElseThrow(()->new ResourceNotFoundException("Security account not found"));
  if(!(user instanceof SecurityStaff)||!Boolean.TRUE.equals(user.getIsActive()))throw new IllegalArgumentException("An active security account is required");
  BuildingSecurityAssignmentId id=new BuildingSecurityAssignmentId(buildingId,userId);
  BuildingSecurityAssignment a=assignments.findById(id).orElseGet(()->{BuildingSecurityAssignment n=new BuildingSecurityAssignment();n.setId(id);n.setBuilding(b);n.setSecurityUser((SecurityStaff)user);return assignments.save(n);});return dto(a);
 }
 @Transactional public void revoke(Long buildingId,Long userId){access.requireManagementAccess(access.currentActor(),buildingId);assignments.findById(new BuildingSecurityAssignmentId(buildingId,userId)).ifPresent(assignments::delete);}
 @Transactional public BuildingResponse assignManager(Long buildingId,Long managerId){
  User actor=access.currentActor();if(!"ADMIN".equals(actor.getRole()))throw new AccessDeniedException("Administrator required");
  Building b=buildings.findById(buildingId).orElseThrow(()->new ResourceNotFoundException("Building not found"));
  User manager=users.findById(managerId).orElseThrow(()->new ResourceNotFoundException("Manager not found"));
  if(!(manager instanceof Manager)||!Boolean.TRUE.equals(manager.getIsActive()))throw new IllegalArgumentException("An active manager is required");
  b.setManager(manager);return mapper.toResponse(buildings.save(b));
 }
}
