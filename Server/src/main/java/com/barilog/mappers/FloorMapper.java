package com.barilog.mappers;

import com.barilog.dtos.response.FloorResponse;
import com.barilog.entities.Floor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FloorMapper {

    @Mapping(target = "buildingId", source = "building.id")
    FloorResponse toResponse(Floor floor);
}
