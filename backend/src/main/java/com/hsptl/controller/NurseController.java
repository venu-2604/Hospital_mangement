package com.hsptl.controller;

import com.hsptl.model.Nurse;
import com.hsptl.service.NurseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/nurses")
@CrossOrigin(origins = "http://localhost:3000")
public class NurseController {
    private static final Logger logger = LoggerFactory.getLogger(NurseController.class);
    private final NurseService nurseService;

    @Autowired
    public NurseController(NurseService nurseService) {
        this.nurseService = nurseService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Nurse>> getActiveNurses() {
        try {
            logger.info("Fetching active nurses");
            List<Nurse> activeNurses = nurseService.getActiveNurses();
            logger.info("Found {} active nurses", activeNurses.size());
            return ResponseEntity.ok(activeNurses);
        } catch (Exception e) {
            logger.error("Error fetching active nurses", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 