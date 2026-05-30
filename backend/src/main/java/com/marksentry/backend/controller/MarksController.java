package com.marksentry.backend.controller;

import com.marksentry.backend.service.MarksService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MarksController {

    private final MarksService marksService;

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String programme,
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String courseCode,
            @RequestParam(defaultValue = "false") boolean allProgramme) {
        return ResponseEntity.ok(
                marksService.search(programme, term, courseCode, allProgramme));
    }
    @PostMapping("/add-new")
    public ResponseEntity<?> addNew(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(Map.of("message", marksService.addNewRecord(data)));
    }


    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody List<Map<String, Object>> list) {
        String result = marksService.batchSave(list);
        return ResponseEntity.ok(Map.of("message", result));
    }
}