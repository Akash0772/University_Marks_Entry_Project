// ================================================================
// FILE: StatisticsController.java
// PATH: src/main/java/com/marksentry/backend/controller/
// Work: Admin panel  statistics
// ================================================================

package com.marksentry.backend.controller;

import com.marksentry.backend.repository.DataMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final DataMasterRepository dataRepo;

    // GET /api/admin/stats/overview
    // Total students, entered, pending, manual, excel
    @GetMapping("/overview")
    public Map<String, Object> overview() {
        List<Object[]> raw = dataRepo.getOverviewStats();
        Map<String, Object> result = new LinkedHashMap<>();

        long total    = 0, entered = 0, pending = 0,
                manual   = 0, excel   = 0, absent = 0;

        for (Object[] row : raw) {
            // row = [entry_source, marks_null_count, marks_filled_count]
            String source  = (String)  row[0];
            long   filled  = ((Number) row[1]).longValue();
            long   notFill = ((Number) row[2]).longValue();
            long   abs     = ((Number) row[3]).longValue();


            total   += filled + notFill;
            entered += filled;
            pending += notFill;
            absent  += abs;


            if ("MANUAL".equals(source)) manual = filled + notFill;
            else                         excel  = filled + notFill;
        }

        result.put("totalStudents",   total);
        result.put("marksEntered",    entered);
        result.put("marksPending",    pending);
        result.put("totalAbsent",     absent);
        result.put("manualRecords",   manual);
        result.put("excelRecords",    excel);
        return result;
    }

    // GET /api/admin/stats/per-course
    // All course - avg marks, total students, entered count
    @GetMapping("/per-course")
    public List<Map<String, Object>> perCourse() {
        List<Object[]> raw = dataRepo.getCourseWiseStats();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseCode",    row[0]);
            item.put("courseName",    row[1]);
            item.put("totalStudents", ((Number) row[2]).longValue());
            item.put("entered",       ((Number) row[3]).longValue());
            item.put("pending",       ((Number) row[4]).longValue());
            item.put("averageMarks",
                    row[5] != null
                            ? Math.round(((Number) row[5]).doubleValue() * 10.0) / 10.0
                            : null);
            item.put("maximumMarks",  row[6]);
            result.add(item);
        }
        return result;
    }

    // GET /api/admin/stats/per-course-filtered?programme=MCA
    @GetMapping("/per-course-filtered")
    public List<Map<String, Object>> perCourseFiltered(
            @RequestParam(defaultValue = "") String programme) {
        List<Object[]> raw = dataRepo.getCourseStatsByProgramme(programme);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("programmeName", row[0]);
            item.put("courseCode",    row[1]);
            item.put("courseName",    row[2]);
            item.put("totalStudents", ((Number) row[3]).longValue());
            item.put("entered",       ((Number) row[4]).longValue());
            item.put("pending",       ((Number) row[5]).longValue());
            item.put("averageMarks",
                    row[6] != null
                            ? Math.round(((Number) row[6]).doubleValue() * 10.0) / 10.0
                            : null);
            item.put("maximumMarks",  row[7]);
            result.add(item);
        }
        return result;
    }

    // GET /api/admin/stats/entry-source
    // MANUAL vs EXCEL count - pie chart
    @GetMapping("/entry-source")
    public List<Map<String, Object>> entrySource() {
        List<Object[]> raw = dataRepo.getEntrySourceStats();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("source", row[0]);
            item.put("count",  ((Number) row[1]).longValue());
            result.add(item);
        }
        return result;
    }

    @GetMapping("/entry-by-user")
    public List<Map<String, Object>> entryByUser() {
        List<Object[]> raw = dataRepo.getCourseEntryByUser();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseCode",    row[0]);
            item.put("username",      row[1]);
            item.put("totalEntries",  ((Number) row[2]).longValue());
            item.put("filled",        ((Number) row[3]).longValue());
            result.add(item);
        }
        return result;
    }
}