// ================================================================
// FILE: User.java
// PATH: src/main/java/com/marksentry/backend/entity/
// ================================================================

package com.marksentry.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;          // BCrypt hashed

    @Column(nullable = false, length = 150)
    private String fullName;          // Display name

    @Column(length = 150)
    private String email;

    @Column(nullable = false, length = 20)
    private String role;              // ADMIN / EXAMINER / VIEWER

    @Column(nullable = false)
    private Boolean isActive = true;  // Account enable/disable

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}