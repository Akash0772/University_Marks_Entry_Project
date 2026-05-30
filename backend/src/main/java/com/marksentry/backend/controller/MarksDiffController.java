package com.marksentry.backend.controller;

import com.marksentry.backend.repository.TempRawExcelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// PATH: src/main/java/com/marksentry/backend/controller/
@RestController
@RequestMapping("/api/admin/marks-diff")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarksDiffController {

    private final TempRawExcelRepository tempRepo;

    @GetMapping
    public List<Map<String, Object>> getMarksDiff(
            @RequestParam(defaultValue = "") String programme) {

        List<Object[]> raw = tempRepo.findMarksDiff(programme.isEmpty() ? null : programme);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("programmeName", row[0]);
            item.put("enrolmentNo",   row[1]);
            item.put("courseCode",    row[2]);
            item.put("comp7Marks",    row[3]);
            item.put("manualEntryM",  row[4]);
            result.add(item);
        }
        return result;
    }

    @GetMapping("/programmes")
    public List<String> getProgrammes() {
        return tempRepo.findDistinctProgrammes();
    }
}
