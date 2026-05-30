// ================================================================
// FILE: AuthController.java
// PATH: src/main/java/com/marksentry/backend/controller/
// FIX: Added /api/auth/logout mapping and formatted structure
// ================================================================

package com.marksentry.backend.controller;

import com.marksentry.backend.dto.LoginRequest;
import com.marksentry.backend.entity.User;
import com.marksentry.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")   // Dev mode allowance *
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            return ResponseEntity.ok(authService.login(req));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/auth/logout
    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout() {
        // Clear Spring Security Context
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // GET /api/auth/me
    @GetMapping("/auth/me")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of("username", principal.getName()));
    }

    // ════════════════════════════════════════════════════════
    // ADMIN ROUTES - /api/admin/**
    // ════════════════════════════════════════════════════════

    // GET /api/admin/users
    @GetMapping("/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    // POST /api/admin/users
    @PostMapping("/admin/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> data) {
        try {
            return ResponseEntity.ok(
                    Map.of("message", authService.createUser(data)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/admin/users/{id}
    @PutMapping("/admin/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, Object> data) {
        try {
            return ResponseEntity.ok(
                    Map.of("message", authService.updateUser(id, data)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/admin/users/{id}/toggle
    @PutMapping("/admin/users/{id}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(
                    Map.of("message", authService.toggleUser(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}