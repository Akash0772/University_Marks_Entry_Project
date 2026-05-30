// ================================================================
// FILE: LockController.java
// PATH: src/main/java/com/marksentry/backend/controller/
// CHANGES:
//   Request body  password + remarks
//   3 unlock types: single, course, programme
// ================================================================

package com.marksentry.backend.controller;

import com.marksentry.backend.service.LockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lock")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LockController {

    private final LockService lockService;

    // 1. Student Wise Unlock
    // PUT /api/lock/unlock/single
    // Body: { enrolmentNo, courseCode, password, remarks }
    @PutMapping("/unlock/single")
    public ResponseEntity<?> unlockSingle(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            String msg = lockService.unlockSingle(
                    body.get("enrolmentNo"),
                    body.get("courseCode"),
                    auth.getName(),           // logged-in admin username
                    body.get("password"),     // admin ka password
                    body.get("remarks")       // unlock reason
            );
            return ResponseEntity.ok(Map.of("message", msg));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 2. Course Wise Bulk Unlock
    // PUT /api/lock/unlock/course
    // Body: { courseCode, password, remarks }
    @PutMapping("/unlock/course")
    public ResponseEntity<?> unlockByCourse(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            String msg = lockService.unlockByCourse(
                    body.get("courseCode"),
                    auth.getName(),
                    body.get("password"),
                    body.get("remarks")
            );
            return ResponseEntity.ok(Map.of("message", msg));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 3. Programme Wise Bulk Unlock
    // PUT /api/lock/unlock/programme
    // Body: { programmeName, term, courseCode, password, remarks }
    @PutMapping("/unlock/programme")
    public ResponseEntity<?> unlockByProgramme(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            String msg = lockService.unlockByProgramme(
                    body.get("programmeName"),
                    body.get("term"),
                    body.get("courseCode"),
                    auth.getName(),
                    body.get("password"),
                    body.get("remarks")
            );
            return ResponseEntity.ok(Map.of("message", msg));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Lock Summary
    // GET /api/lock/summary?courseCode=BCA101
    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestParam String courseCode) {
        return ResponseEntity.ok(lockService.getLockSummary(courseCode));
    }
}