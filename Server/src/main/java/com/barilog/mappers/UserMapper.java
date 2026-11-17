package com.barilog.mappers;

import com.barilog.dtos.response.UserResponse;
import com.barilog.entities.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
}
