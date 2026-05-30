// ================================================================
// FILE: AuthService.java
// PATH: src/main/java/com/marksentry/backend/service/
// FIX: AuthenticationManager use login verify
// ================================================================

package com.marksentry.backend.service;

import com.marksentry.backend.dto.LoginRequest;
import com.marksentry.backend.dto.LoginResponse;
import com.marksentry.backend.entity.User;
import com.marksentry.backend.repository.UserRepository;
import com.marksentry.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository       userRepo;
    private final JwtUtil              jwtUtil;
    private final PasswordEncoder      passwordEncoder;
    private final AuthenticationManager authManager;

    // ── LOGIN ────────────────────────────────────────────────
    public LoginResponse login(LoginRequest req) {
        try {
            // FIX: AuthenticationManager authenticate
            // BCrypt check + UserDetailsService both use
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getUsername(),
                            req.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Username and Password wrong");
        }

        // Authentication pass - user DB
        Optional<User> optUser = userRepo.findByUsername(req.getUsername());
        if (optUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = optUser.get();

        if (!user.getIsActive()) {
            throw new RuntimeException("Account disabled. Contact to Administration");
        }

        // Token generate
        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole(),
                user.getFullName()
        );

        return new LoginResponse(
                token,
                user.getUsername(),
                user.getFullName(),
                user.getRole()
        );
    }

    // GET ALL USERS
    public List<User> getAllUsers() {
        return userRepo.findAllByOrderByCreatedAtDesc();
    }

    // CREATE USER
    @Transactional
    public String createUser(Map<String, Object> data) {
        String username = data.get("username").toString().trim().toLowerCase();

        if (userRepo.existsByUsername(username)) {
            throw new RuntimeException("Username '" + username + "' already exists!");
        }

        User newUser = new User();
        newUser.setUsername(username);
        newUser.setFullName(data.get("fullName").toString().trim());
        newUser.setPassword(passwordEncoder.encode(data.get("password").toString()));
        newUser.setRole(data.getOrDefault("role", "EXAMINER").toString().toUpperCase());
        newUser.setEmail(data.getOrDefault("email", "").toString());
        newUser.setIsActive(true);
        newUser.setCreatedAt(LocalDateTime.now());

        userRepo.save(newUser);
        return "User '" + username + "' successfully created!";
    }

    // ── UPDATE USER ──────────────────────────────────────────
    @Transactional
    public String updateUser(Long id, Map<String, Object> data) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) throw new RuntimeException("User not found");

        User u = optUser.get();

        if (data.containsKey("fullName"))
            u.setFullName(data.get("fullName").toString().trim());
        if (data.containsKey("role"))
            u.setRole(data.get("role").toString().toUpperCase());
        if (data.containsKey("email"))
            u.setEmail(data.get("email").toString());
        if (data.containsKey("isActive"))
            u.setIsActive(Boolean.parseBoolean(data.get("isActive").toString()));
        if (data.containsKey("password") &&
                !data.get("password").toString().isBlank())
            u.setPassword(passwordEncoder.encode(data.get("password").toString()));

        u.setUpdatedAt(LocalDateTime.now());
        userRepo.save(u);
        return "User updated successfully!";
    }

    // ── TOGGLE ACTIVE ────────────────────────────────────────
    @Transactional
    public String toggleUser(Long id) {
        Optional<User> optUser = userRepo.findById(id);
        if (optUser.isEmpty()) throw new RuntimeException("User not found");

        User u = optUser.get();
        u.setIsActive(!u.getIsActive());
        u.setUpdatedAt(LocalDateTime.now());
        userRepo.save(u);

        return u.getIsActive() ? "User enabled!" : "User disabled!";
    }
}