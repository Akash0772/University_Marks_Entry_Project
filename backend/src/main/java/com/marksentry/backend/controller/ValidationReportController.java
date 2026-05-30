package com.marksentry.backend.controller;

import com.marksentry.backend.repository.DataMasterRepository;
import com.marksentry.backend.repository.TempRawExcelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/validation-report")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ValidationReportController {

    private final DataMasterRepository dataRepo;
    private final TempRawExcelRepository tempRepo;

    @GetMapping
    public List<Map<String, Object>> getValidationReport(
            @RequestParam String programme,
            @RequestParam String semester) {

        // Only rows where marks = 0 (absent/zero) OR D-flag mismatch
        List<Object[]> raw = dataRepo.getValidationReport(programme, semester);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : raw) {
            String status    = (String) row[3];

            // SAHI KIYA GAYA CODE: Yahan cast ki jagah safeToFloat method ka use kiya hai
            Float  marks     = safeToFloat(row[4]);
            Float  comp7     = safeToFloat(row[5]);
            Float  manualM   = safeToFloat(row[6]);

            // Marking logic
            String marking;
            if ("Absent".equals(status))    marking = "A";
            else if ("Withheld".equals(status)) marking = "W";
            else if ("UFM".equals(status))  marking = "UFM";
            else if (comp7 != null && manualM != null
                    && Math.abs(comp7 - manualM) > 0.001) marking = "D";
            else marking = "-";

            // Skip if marks > 0 and no flag
            if ((marks == null || marks > 0) && "-".equals(marking)) continue;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("enrolmentNo", row[0]);
            item.put("courseCode",  row[1]);
            item.put("courseName",  row[2]);
            item.put("marking",     marking);
            item.put("examType",    "-");       //this coloum not created by DB
            item.put("presentAbsent", "Absent".equals(status) ? "A" : "P");
            item.put("marks",       marks);
            item.put("remark",      "");        // empty - operator fill
            result.add(item);
        }
        return result;
    }

     // Safe helper method use chane any string and number to update in float
    private Float safeToFloat(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof Number) {
            return ((Number) obj).floatValue();
        }
        try {
            // use parse if string comes to database
            return Float.parseFloat(obj.toString().trim());
        } catch (NumberFormatException e) {
            return null; // if string is blank so fill up null value
        }
    }
}