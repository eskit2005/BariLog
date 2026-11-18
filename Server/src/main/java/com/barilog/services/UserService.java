package com.barilog.services;

import com.barilog.dtos.request.RegisterRequest;
import com.barilog.dtos.response.UserResponse;
import com.barilog.entities.*;
import com.barilog.events.UserRegisteredEvent;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.UserMapper;
import com.barilog.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final ManagerRepository managerRepository;
    private final ResidentRepository residentRepository;
    private final StaffRepository staffRepository;
    private final SecurityStaffRepository securityStaffRepository;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (!"RESIDENT".equals(request.getRole())) throw new IllegalArgumentException("Public registration creates resident accounts only");
        if (userRepository.countByEmail(request.getEmail()) > 0) {
            throw new DuplicateResourceException("Email already in use: " + request.getEmail());
        }

        String role = request.getRole().toUpperCase();
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User saved;

        switch (role) {
            case "ADMIN" -> {
                Admin admin = new Admin();
                populateBaseUser(admin, request, encodedPassword, role);
                saved = adminRepository.save(admin);
            }
            case "MANAGER" -> {
                Manager manager = new Manager();
                populateBaseUser(manager, request, encodedPassword, role);
                saved = managerRepository.save(manager);
            }
            case "RESIDENT" -> {
                Resident resident = new Resident();
                populateBaseUser(resident, request, encodedPassword, role);
                saved = residentRepository.save(resident);
            }
            case "STAFF" -> {
                Staff staff = new Staff();
                populateBaseUser(staff, request, encodedPassword, role);
                saved = staffRepository.save(staff);
            }
            case "SECURITY" -> {
                SecurityStaff sec = new SecurityStaff();
                populateBaseUser(sec, request, encodedPassword, role);
                saved = securityStaffRepository.save(sec);
            }
            default -> throw new IllegalArgumentException("Unsupported role: " + role);
        }

        applicationEventPublisher.publishEvent(new UserRegisteredEvent(saved.getName(), saved.getEmail(), role));

        return userMapper.toResponse(saved);
    }

    private void populateBaseUser(User user, RegisterRequest req, String encodedPassword, String role) {
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(encodedPassword);
        user.setPhoneNumber(req.getPhoneNumber());
        user.setIsActive(true);
        user.setRole(role);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    UserResponse dto = userMapper.toResponse(u);
                    if (!"ADMIN".equals(authService.getLoggedUser().getRole())) { dto.setEmail(null); dto.setPhoneNumber(null); dto.setIsActive(null); dto.setCreatedAt(null); }
                    return dto;
                })
                .toList();
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
