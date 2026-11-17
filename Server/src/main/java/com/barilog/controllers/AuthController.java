package com.barilog.controllers;

import com.barilog.config.JwtConfig;
import com.barilog.dtos.request.LoginRequest;
import com.barilog.dtos.response.JwtResponse;
import com.barilog.dtos.response.UserResponse;
import com.barilog.entities.RefreshToken;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.UserMapper;
import com.barilog.repositories.RefreshTokenRepository;
import com.barilog.repositories.UserRepository;
import com.barilog.services.AuthService;
import com.barilog.services.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final UserMapper userMapper;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletResponse response) {
        // Authenticates credentials via DaoAuthenticationProvider; throws BadCredentialsException if invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        var accessToken = jwtService.getAccessToken(user);
        var refreshToken = jwtService.getRefreshToken(user);

        // Store refresh token in HttpOnly cookie to mitigate XSS attacks
        var cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(jwtConfig.getRefreshTokenExpiration());
        response.addCookie(cookie);

        // Persist refresh token in DB for revoking on logout
        var tokenEntity = new RefreshToken();
        tokenEntity.setToken(refreshToken);
        tokenEntity.setIssuedAt(Instant.now());
        tokenEntity.setExpiry(Instant.now().plusSeconds(jwtConfig.getRefreshTokenExpiration()));
        tokenEntity.setRevoked(false);
        tokenEntity.setUserId(user.getId());
        refreshTokenRepository.save(tokenEntity);

        return ResponseEntity.ok(new JwtResponse(accessToken));
    }

    @GetMapping("/refresh")
    public ResponseEntity<JwtResponse> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var tokenEntity = refreshTokenRepository.findByToken(refreshToken)
                .orElse(null);

        if (tokenEntity == null
                || tokenEntity.getRevoked()
                || !jwtService.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var user = userRepository.findById(jwtService.getUserIdFromToken(refreshToken))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(new JwtResponse(jwtService.getAccessToken(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userMapper.toResponse(authService.getLoggedUser()));
    }

    @DeleteMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        // Clear the cookie in client browser
        var cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        // Revoke token in DB
        if (refreshToken != null) {
            refreshTokenRepository.revokeToken(refreshToken);
        }

        return ResponseEntity.ok().build();
    }
}
