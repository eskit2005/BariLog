package com.barilog.entities;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BuildingSecurityAssignmentId implements Serializable {
    private Long buildingId;
    private Long securityUserId;
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BuildingSecurityAssignmentId that)) return false;
        return Objects.equals(buildingId, that.buildingId) && Objects.equals(securityUserId, that.securityUserId);
    }
    @Override public int hashCode() { return Objects.hash(buildingId, securityUserId); }
}
