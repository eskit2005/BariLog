package com.barilog.mappers;

import com.barilog.dtos.response.MaintenanceAgreementResponse;
import com.barilog.entities.MaintenanceAgreement;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Mapper(componentModel = "spring")
public interface MaintenanceAgreementMapper {

    @Mapping(target = "submittedById", source = "submittedBy.id")
    @Mapping(target = "submittedByName", source = "submittedBy.name")
    @Mapping(target = "submittedByRole", source = "submittedBy.role")
    @Mapping(target = "buildingLevel", ignore = true)
    @Mapping(target = "notedById", source = "notedBy.id")
    @Mapping(target = "notedByName", source = "notedBy.name")
    @Mapping(target = "daysUntilExpiry", ignore = true)
    MaintenanceAgreementResponse toResponse(MaintenanceAgreement agreement);

    @AfterMapping
    default void computeDaysUntilExpiry(MaintenanceAgreement agreement, @MappingTarget MaintenanceAgreementResponse response) {
        if (agreement.getExpiryDate() != null) {
            response.setDaysUntilExpiry(ChronoUnit.DAYS.between(LocalDate.now(), agreement.getExpiryDate()));
        }
        // Agreements added by a manager/admin are building-level contracts (e.g. lift AMC)
        String role = agreement.getSubmittedBy() != null ? agreement.getSubmittedBy().getRole() : null;
        response.setBuildingLevel("MANAGER".equals(role) || "ADMIN".equals(role));
    }
}
