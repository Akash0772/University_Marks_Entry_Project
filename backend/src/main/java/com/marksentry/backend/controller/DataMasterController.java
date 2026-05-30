package com.marksentry.backend.controller;

import com.marksentry.backend.repository.DataMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // React ka default port
public class DataMasterController {

    private final DataMasterRepository dataRepo;

    @GetMapping("/programmes")
    public List<String> getProgrammes() {
        return dataRepo.findDistinctProgrammes();
    }

    @GetMapping("/terms")
    public List<String> getTerms(@RequestParam String programme) {
        return dataRepo.findTermsByProgramme(programme);
    }

    @GetMapping("/coursecodes")
    public List<String> getCourseCodes(@RequestParam String programme, @RequestParam String term) {
        return dataRepo.findCourseCodes(programme, term);
    }

    // NEW: Ye endpoint All Programme dropdown
    @GetMapping("/all-coursecodes")
    public List<String> getAllCourseCodes() {
        return dataRepo.findAllDistinctCourseCodes();
    }
}