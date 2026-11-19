package com.barilog.repositories;
import com.barilog.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BuildingSecurityAssignmentRepository extends JpaRepository<BuildingSecurityAssignment, BuildingSecurityAssignmentId> {
 boolean existsByIdBuildingIdAndIdSecurityUserId(Long buildingId, Long securityUserId);
 List<BuildingSecurityAssignment> findByIdBuildingId(Long buildingId);
 List<BuildingSecurityAssignment> findByIdSecurityUserId(Long securityUserId);
}
