package com.barilog.mappers;

import com.barilog.dtos.response.OccupancyHistoryResponse;
import com.barilog.entities.OccupancyHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OccupancyHistoryMapper {

    @Mapping(target = "apartmentId", source = "apartment.id")
    @Mapping(target = "unitNumber", source = "apartment.unitNumber")
    @Mapping(target = "previousResidentId", source = "previousResident.id")
    @Mapping(target = "previousResidentName", source = "previousResident.name")
    @Mapping(target = "newResidentId", source = "newResident.id")
    @Mapping(target = "newResidentName", source = "newResident.name")
    @Mapping(target = "changedByUserId", source = "changedBy.id")
    @Mapping(target = "changedByUserName", source = "changedBy.name")
    OccupancyHistoryResponse toResponse(OccupancyHistory history);
}
