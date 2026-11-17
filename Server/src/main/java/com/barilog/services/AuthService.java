package com.barilog.services;

import com.barilog.entities.User;
import com.barilog.repositories.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class AuthService {

    private final UserRepository userRepository;

    // Retrieves current user from SecurityContext via principal (Long userId)
    public User getLoggedUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new RuntimeException("No authenticated user found in security context");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
