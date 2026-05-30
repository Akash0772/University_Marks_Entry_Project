// ================================================================
// FILE: LockService.java
// PATH: src/main/java/com/marksentry/backend/service/
// CHANGES:
//   1. Password verify before unlock
//   2. Remarks save
//   3. Student wise unlock
//   4. Course wise bulk unlock
//   5. Programme + term + courseCode wise bulk unlock
// ================================================================

package com.marksentry.backend.service;

import com.marksentry.backend.entity.DataMaster;
import com.marksentry.backend.repository.DataMasterRepository;
import com.marksentry.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LockService {

    private final DataMasterRepository dataRepo;
    private final UserRepository       userRepo;
    private final PasswordEncoder      passwordEncoder;


    // COMMON: Password + Remarks Verify
    private void verifyPasswordAndRemarks(
            String username, String password, String remarks) {

        // Remarks check
        if (remarks == null || remarks.trim().isEmpty()) {
            throw new RuntimeException("Remarks required because unlock system?");
        }

        // Password verify
        userRepo.findByUsername(username).ifPresentOrElse(
                user -> {
                    if (!passwordEncoder.matches(password, user.getPassword())) {
                        throw new RuntimeException("Password wrong");
                    }
                },
                () -> { throw new RuntimeException("User not found"); }
        );
    }


    // 1. STUDENT WISE - Single record unlock
    @Transactional
    public String unlockSingle(
            String enrolmentNo, String courseCode,
            String unlockedBy, String password, String remarks) {

        // Password + remarks verify
        verifyPasswordAndRemarks(unlockedBy, password, remarks);

        Optional<DataMaster> opt =
                dataRepo.findByEnrolmentNoAndCourseCode(enrolmentNo, courseCode);

        if (opt.isEmpty()) {
            throw new RuntimeException("Record not found");
        }

        DataMaster d = opt.get();

        if (!Boolean.TRUE.equals(d.getIsLocked())) {
            throw new RuntimeException("Record already unlocked hai");
        }

        // Unlock
        d.setIsLocked(false);
        d.setUnlockedBy(unlockedBy);
        d.setUnlockedAt(LocalDateTime.now());
        d.setUnlockRemarks(remarks.trim());
        dataRepo.save(d);

        return "Record unlocked successfully!";
    }

    // 2. COURSE WISE - All course records unlock
    @Transactional
    public String unlockByCourse(
            String courseCode,
            String unlockedBy, String password, String remarks) {

        verifyPasswordAndRemarks(unlockedBy, password, remarks);

        List<DataMaster> list = dataRepo.findByCourseCode(courseCode);

        if (list.isEmpty()) {
            throw new RuntimeException("Not found any Course: " + courseCode);
        }

        int count = 0;
        for (DataMaster d : list) {
            if (Boolean.TRUE.equals(d.getIsLocked())) {
                d.setIsLocked(false);
                d.setUnlockedBy(unlockedBy);
                d.setUnlockedAt(LocalDateTime.now());
                d.setUnlockRemarks(remarks.trim());
                dataRepo.save(d);
                count++;
            }
        }

        return count + " records unlocked! (Course: " + courseCode + ")";
    }


    // 3. PROGRAMME WISE - Programme + Term + Course unlock
    @Transactional
    public String unlockByProgramme(
            String programmeName, String term, String courseCode,
            String unlockedBy, String password, String remarks) {

        verifyPasswordAndRemarks(unlockedBy, password, remarks);

        List<DataMaster> list =
                dataRepo.findByProgrammeNameAndTermAndCourseCode(
                        programmeName, term, courseCode);

        if (list.isEmpty()) {
            throw new RuntimeException("Not found any records");
        }

        int count = 0;
        for (DataMaster d : list) {
            if (Boolean.TRUE.equals(d.getIsLocked())) {
                d.setIsLocked(false);
                d.setUnlockedBy(unlockedBy);
                d.setUnlockedAt(LocalDateTime.now());
                d.setUnlockRemarks(remarks.trim());
                dataRepo.save(d);
                count++;
            }
        }

        return count + " records unlocked! (Programme: "
                + programmeName + ", Term: " + term + ")";
    }


    // Lock Summary - Course ke stats
    public Map<String, Object> getLockSummary(String courseCode) {
        List<DataMaster> list = dataRepo.findByCourseCode(courseCode);
        long locked    = list.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsLocked())).count();
        long unlocked  = list.size() - locked;
        long withMarks = list.stream()
                .filter(d -> d.getMarks() != null).count();

        return Map.of(
                "total",     list.size(),
                "locked",    locked,
                "unlocked",  unlocked,
                "withMarks", withMarks
        );
    }
}