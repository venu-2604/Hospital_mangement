package com.hsptl.controller;

import com.hsptl.model.Nurse;
import com.hsptl.dto.NurseCreateDTO;
import com.hsptl.service.NurseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/nurses")
public class NurseController {
    private static final Logger logger = LoggerFactory.getLogger(NurseController.class);
    private final NurseService nurseService;

    @Autowired
    public NurseController(NurseService nurseService) {
        this.nurseService = nurseService;
    }

    @GetMapping
    public ResponseEntity<List<Nurse>> getAllNurses() {
        try {
            logger.info("Fetching all nurses");
            List<Nurse> nurses = nurseService.getAllNurses();
            logger.info("Found {} nurses", nurses.size());
            return ResponseEntity.ok(nurses);
        } catch (Exception e) {
            logger.error("Error fetching nurses", e);
            return ResponseEntity.internalServerError().build();
        }
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

    @PostMapping
    public ResponseEntity<Nurse> createNurse(@RequestBody NurseCreateDTO request) {
        try {
            logger.info("Creating nurse");
            Nurse nurse = nurseService.createNurse(request);
            return ResponseEntity.ok(nurse);
        } catch (Exception e) {
            logger.error("Error creating nurse", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 