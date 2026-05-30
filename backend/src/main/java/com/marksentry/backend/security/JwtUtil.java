// ================================================================
// FILE: JwtUtil.java
// PATH: src/main/java/com/marksentry/backend/security/
// DEPENDENCY: pom.xml add:
//   <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-api</artifactId>
//     <version>0.11.5</version>
//   </dependency>
//   <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-impl</artifactId>
//     <version>0.11.5</version>
//     <scope>runtime</scope>
//   </dependency>
//   <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-jackson</artifactId>
//     <version>0.11.5</version>
//     <scope>runtime</scope>
//   </dependency>
// ================================================================

package com.marksentry.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;  // 28800000 ms = 8 hours

    // Token generate karo
    public String generateToken(String username, String role, String fullName) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role",     role)
                .claim("fullName", fullName)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Token username
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // Token role
    public String extractRole(String token) {
        return (String) getClaims(token).get("role");
    }

    // Token fullName
    public String extractFullName(String token) {
        return (String) getClaims(token).get("fullName");
    }

    // Token valid or un-valid
    public boolean isTokenValid(String token) {
        try {
            getClaims(token); // expire ya invalid to exception
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ── Private helpers ──────────────────────────────────────
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}