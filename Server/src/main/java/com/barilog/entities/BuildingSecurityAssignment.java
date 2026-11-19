package com.barilog.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "building_security_assignments")
@Getter
@Setter
public class BuildingSecurityAssignment {
    @EmbeddedId
    private BuildingSecurityAssignmentId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("buildingId")
    @JoinColumn(name = "building_id")
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("securityUserId")
    @JoinColumn(name = "security_user_id")
    private SecurityStaff securityUser;
}
