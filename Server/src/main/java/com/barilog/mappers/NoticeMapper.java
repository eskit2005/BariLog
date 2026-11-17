package com.barilog.mappers;

import com.barilog.dtos.response.NoticeResponse;
import com.barilog.entities.Notice;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.time.LocalDate;

@Mapper(componentModel = "spring")
public interface NoticeMapper {

    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    @Mapping(target = "expired", ignore = true)
    NoticeResponse toResponse(Notice notice);

    @AfterMapping
    default void computeExpired(Notice notice, @MappingTarget NoticeResponse response) {
        response.setExpired(notice.getExpiryDate() != null && notice.getExpiryDate().isBefore(LocalDate.now()));
    }
}
