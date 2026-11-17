package com.barilog;

import com.barilog.config.JwtConfig;
import com.barilog.entities.Manager;
import com.barilog.services.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class AuthUnitTests {

    private JwtService jwtService;
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        // A valid 256-bit base64 secret
        config.setSecret("etXNsB587RXPk/iV6ulz0n0Kujo3t8G0JMprES5E8Co=");
        config.setAccessTokenExpiration(600);
        config.setRefreshTokenExpiration(604800);
        jwtService = new JwtService(config);
        passwordEncoder = new BCryptPasswordEncoder();
    }

    @Test
    void testPasswordEncoding() {
        String raw = "StrongP@ss123";
        String encoded = passwordEncoder.encode(raw);
        assertNotNull(encoded);
        assertTrue(passwordEncoder.matches(raw, encoded));
        assertFalse(passwordEncoder.matches("WrongPassword", encoded));
    }

    @Test
    void testJwtTokenGenerationAndValidation() {
        Manager manager = new Manager();
        manager.setId(101L);
        manager.setName("Ibrahim Manager");
        manager.setEmail("ibrahim@barilog.com");
        manager.setRole("MANAGER");

        String token = jwtService.getAccessToken(manager);
        assertNotNull(token);
        assertTrue(jwtService.validateToken(token));

        assertEquals(101L, jwtService.getUserIdFromToken(token));
        assertEquals("ibrahim@barilog.com", jwtService.getEmailFromToken(token));
        assertEquals("MANAGER", jwtService.getRoleFromToken(token));
    }
}
