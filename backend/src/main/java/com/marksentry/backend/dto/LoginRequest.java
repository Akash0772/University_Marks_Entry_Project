// ================================================================
// FILE: LoginRequest.java
// PATH: src/main/java/com/marksentry/backend/dto/
// ================================================================

package com.marksentry.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}