package com.marksentry.backend.service;

import com.marksentry.backend.entity.DataMaster;
import com.marksentry.backend.repository.DataMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MarksService {

    private final DataMasterRepository dataRepo;

    // SEARCH - isLocked
    public List<Map<String, Object>> search(
            String program, String term, String courseCode, boolean allProgram) {

        List<DataMaster> list;

        if (allProgram) {
            if (courseCode == null || courseCode.trim().isEmpty()) {
                list = dataRepo.findAll();
            } else {
                list = dataRepo.findByCourseCode(courseCode);
            }
        } else {
            list = dataRepo.findByProgrammeNameAndTermAndCourseCode(
                    program, term, courseCode);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (DataMaster d : list) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("enrolmentNo",   d.getEnrolmentNo());
            row.put("studentName",   d.getStudentName());
            row.put("programmeName", d.getProgrammeName());
            row.put("courseCode",    d.getCourseCode());
            row.put("courseName",    d.getCourseName());
            row.put("term",          d.getTerm());
            row.put("maximumMarks",  d.getMaximumMarks());
            row.put("credit",        d.getCredit());
            row.put("marks",         d.getMarks());
            row.put("status",        d.getStatus() != null ? d.getStatus() : "Present");
            row.put("alreadySaved",  d.getMarks() != null);
            row.put("updatedAt",     d.getUpdatedAt());
            row.put("entryBy",       d.getEntryBy()     != null ? d.getEntryBy()     : "-");
            row.put("entrySource",   d.getEntrySource() != null ? d.getEntrySource() : "EXCEL");

            // Lock fields - frontend
            row.put("isLocked",   Boolean.TRUE.equals(d.getIsLocked()));
            row.put("lockedBy",   d.getLockedBy()   != null ? d.getLockedBy()   : "-");
            row.put("lockedAt",   d.getLockedAt());
            row.put("unlockedBy", d.getUnlockedBy() != null ? d.getUnlockedBy() : "-");

            result.add(row);
        }
        return result;
    }

    // ADD NEW RECORD (Manual Entry) - FIXED Course Name Issue
    @Transactional
    public String addNewRecord(Map<String, Object> data) {
        String enrolmentNo = Objects.toString(data.get("enrolmentNo"), "").trim();
        String courseCode  = Objects.toString(data.get("courseCode"),  "").trim();

        if (enrolmentNo.isEmpty() || courseCode.isEmpty()) {
            return "Enrolment No And Course Code Required";
        }

        DataMaster dm = dataRepo
                .findByEnrolmentNoAndCourseCode(enrolmentNo, courseCode)
                .orElse(new DataMaster());

        boolean isNew = (dm.getId() == null);

//        // Validation - Check if existing row is locked
//        if (!isNew && Boolean.TRUE.equals(dm.getIsLocked())) {
//            return "Record locked. Please Contact to Admin";
//        }
        String entryBy = Objects.toString(data.get("entryBy"), "admin").trim();

        // Validation - Only block if marks are already filled by someone else and user is not ADMIN
//        if (!isNew && dm.getEntryBy() != null && !dm.getEntryBy().equals(entryBy) && !"admin".equalsIgnoreCase(entryBy)) {
//            return "This student is already registered by '" + dm.getEntryBy() + "'! Please contact them to complete the incomplete data.";
//        }
        if (!isNew && dm.getMarks() != null && dm.getEntryBy() != null && !dm.getEntryBy().equals(entryBy) && !"admin".equalsIgnoreCase(entryBy)) {
            return "This student is already registered and marks are filled by '" + dm.getEntryBy() + "'!";
        }

        dm.setEnrolmentNo(enrolmentNo);
        dm.setStudentName(Objects.toString(data.get("studentName"), "Unknown"));
        dm.setProgrammeName(Objects.toString(data.get("programmeName"), ""));
        dm.setTerm(Objects.toString(data.get("semester"), ""));
        dm.setCourseCode(courseCode);

        // FIX: Course Name set aur automatic matching logic
        String courseNameFromFrontend = Objects.toString(data.get("courseName"), "").trim();

        // Agar frontend se solid courseName
        if (!courseNameFromFrontend.isEmpty() && !"-".equals(courseNameFromFrontend)) {
            dm.setCourseName(courseNameFromFrontend);
        } else {
            Optional<DataMaster> existingCourseMatch = dataRepo.findByCourseCode(courseCode)
                    .stream()
                    .filter(r -> r.getCourseName() != null && !r.getCourseName().trim().isEmpty() && !"-".equals(r.getCourseName()))
                    .findFirst();

            if (existingCourseMatch.isPresent()) {
                dm.setCourseName(existingCourseMatch.get().getCourseName());
            } else {
                dm.setCourseName("-");
            }
        }

        // Maximum marks logic
        int maxMarks;
        if (!isNew && dm.getMaximumMarks() != null) {
            maxMarks = dm.getMaximumMarks();
        } else {
            Optional<DataMaster> anyRecord =
                    dataRepo.findByCourseCode(courseCode)
                            .stream()
                            .filter(r -> r.getMaximumMarks() != null)
                            .findFirst();

            if (anyRecord.isPresent()) {
                maxMarks = anyRecord.get().getMaximumMarks();
            } else {
                String maxStr = Objects.toString(data.get("maximumMarks"), "100").trim();
                try {
                    maxMarks = Integer.parseInt(maxStr);
                    if (maxMarks <= 0) maxMarks = 100;
                } catch (NumberFormatException e) {
                    maxMarks = 100;
                }
            }
        }
        dm.setMaximumMarks(maxMarks);

        // Marks range check
        String marksStr = Objects.toString(data.get("marks"), "").trim();
        if (!marksStr.isEmpty()) {
//            try {
//                int marksVal = Integer.parseInt(marksStr);
//                if (marksVal < 0) {
//                    return "Marks negative not allowed";
//                }
//                if (marksVal > maxMarks) {
//                    return "Marks cannot exceed " + maxMarks + "! (Maximum: " + maxMarks + ")";
//                }
//                dm.setMarks(marksVal);
//            } catch (NumberFormatException e) {
//                return "Marks only number allowed";
//            }
            try {
                float marksVal = Float.parseFloat(marksStr);
                if(marksVal < 0){
                    return "Marks negative not allowed";
                }
                if(marksVal > maxMarks){
                    return "Marks cannot exceed " + maxMarks + "! (Maximum: " + maxMarks + ")";
                }
                dm.setMarks(marksVal);
            }
            catch (NumberFormatException e){
                return "Marks only number allowed";
            }
        }

        // Status
        String status = Objects.toString(data.get("status"), "Present");
        dm.setStatus(status);
        if ("Absent".equals(status) || "Withheld".equals(status)) {
            dm.setMarks(0.0f);
        }

        // Entry tracking
        entryBy = Objects.toString(data.get("entryBy"), "admin");
        dm.setEntryBy(entryBy);
        if (isNew) dm.setEntrySource("MANUAL");
        dm.setUpdatedAt(LocalDateTime.now());

        dataRepo.save(dm);
        return isNew ? "New Record Added!" : "Record Updated!";
    }


    // BATCH SAVE - Grid Save All
    @Transactional
    public String batchSave(List<Map<String, Object>> list) {
        int saved   = 0;
        int locked = 0; // new line using locked
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (Map<String, Object> item : list) {
            String enrolmentNo = Objects.toString(item.get("enrolmentNo"), "").trim();
            String courseCode  = Objects.toString(item.get("courseCode"),  "").trim();

            // Marks null ya empty - skip
            if (item.get("marks") == null || item.get("marks").toString().trim().isEmpty()) {
                skipped++;
                continue;
            }

            Optional<DataMaster> existing =
                    dataRepo.findByEnrolmentNoAndCourseCode(enrolmentNo, courseCode);

            if (existing.isPresent()) {
                DataMaster d = existing.get();

                // Validation - Skip execution mapping on existing system locks
                if (Boolean.TRUE.equals(d.getIsLocked())) {
                    locked++;
                    continue;
                }

                // Max marks DB
                int maxMarks = (d.getMaximumMarks() != null) ? d.getMaximumMarks() : 100;

//                try {
//                    int marksVal = Integer.parseInt(item.get("marks").toString().trim());
//
//                    if (marksVal < 0) {
//                        errors.add(enrolmentNo + ": negative marks");
//                        continue;
//                    }
//                    if (marksVal > maxMarks) {
//                        errors.add(enrolmentNo + ": " + marksVal + " > max " + maxMarks);
//                        continue;
//                    }
//
//                    d.setMarks(marksVal);
//                } catch (NumberFormatException e) {
//                    errors.add(enrolmentNo + ": invalid marks");
//                    continue;
//                }
                try {
                    float marksVal = Float.parseFloat(item.get("marks").toString().trim());
                    if(marksVal < 0){
                        errors.add(enrolmentNo + ": negative marks");
                        continue;
                    }
                    if(marksVal > maxMarks){
                        errors.add(enrolmentNo + ": " + marksVal + " > max " + maxMarks);
                        continue;
                    }
                    d.setMarks(marksVal);
                }
                catch (NumberFormatException e){
                    errors.add(enrolmentNo + ": invalid marks");
                    continue;
                }

                // Status
                String status = Objects.toString(item.get("status"), "Present");
                d.setStatus(status);
                if ("Absent".equals(status) || "Withheld".equals(status)) {
                    d.setMarks(0.0f);
                }

                // Entry tracking
                String entryBy = Objects.toString(item.get("entryBy"), "admin");
                d.setEntryBy(entryBy);
                d.setUpdatedAt(LocalDateTime.now());

                dataRepo.save(d);
                saved++;
            }
        }
        StringBuilder msg = new StringBuilder();
        msg.append(saved).append(" records saved.");
        if (locked > 0) msg.append(" | ").append(locked).append(" records skipped (Locked).");
        if (skipped > 0) msg.append(" | ").append(skipped).append(" skipped (empty).");
        if (!errors.isEmpty()) msg.append(" | Errors: ").append(String.join(", ", errors));

        return msg.toString();
    }
}