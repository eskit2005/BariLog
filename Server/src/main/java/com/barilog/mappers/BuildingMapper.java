package com.barilog.mappers;

import com.barilog.dtos.response.BuildingResponse;
import com.barilog.entities.Building;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BuildingMapper {

    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "managerName", source = "manager.name")
    BuildingResponse toResponse(Building building);
}
