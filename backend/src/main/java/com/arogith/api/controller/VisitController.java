package com.arogith.api.controller;

import com.arogith.api.dto.VisitDTO;
import com.arogith.api.service.VisitService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visits")
@CrossOrigin(origins = "http://localhost:3000")
public class VisitController {

    private static final Logger logger = LoggerFactory.getLogger(VisitController.class);
    private final VisitService visitService;

    @Autowired
    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @GetMapping
    public ResponseEntity<List<VisitDTO>> getAllVisits() {
        logger.info("Request received: GET /api/visits");
        List<VisitDTO> visits = visitService.getAllVisits();
        logger.info("Returning {} visits", visits.size());
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/{visitId}")
    public ResponseEntity<VisitDTO> getVisitById(@PathVariable Long visitId) {
        logger.info("Request received: GET /api/visits/{}", visitId);
        VisitDTO visit = visitService.getVisitById(visitId);
        logger.info("Returning visit with ID: {}", visitId);
        return ResponseEntity.ok(visit);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getVisitsByPatientId(@PathVariable String patientId) {
        try {
            logger.info("Request received: GET /api/visits/patient/{}", patientId);
            List<VisitDTO> visits = visitService.getVisitsByPatientId(patientId);
            logger.info("Returning {} visits for patient ID: {}", visits.size(), patientId);
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            logger.error("Error getting visits for patient ID {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting visits: " + e.getMessage());
        }
    }

    @GetMapping("/today")
    public ResponseEntity<List<VisitDTO>> getTodayVisits() {
        logger.info("Request received: GET /api/visits/today");
        List<VisitDTO> visits = visitService.getTodayVisits();
        logger.info("Returning {} visits for today", visits.size());
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/yesterday")
    public ResponseEntity<List<VisitDTO>> getYesterdayVisits() {
        logger.info("Request received: GET /api/visits/yesterday");
        List<VisitDTO> visits = visitService.getYesterdayVisits();
        logger.info("Returning {} visits for yesterday", visits.size());
        return ResponseEntity.ok(visits);
    }

    @PostMapping
    public ResponseEntity<VisitDTO> createVisit(@Valid @RequestBody VisitDTO visitDTO) {
        logger.info("Request received: POST /api/visits");
        VisitDTO createdVisit = visitService.createVisit(visitDTO);
        logger.info("Visit created with ID: {}", createdVisit.getVisitId());
        return new ResponseEntity<>(createdVisit, HttpStatus.CREATED);
    }

    @PutMapping("/{visitId}")
    public ResponseEntity<VisitDTO> updateVisit(@PathVariable Long visitId, @Valid @RequestBody VisitDTO visitDTO) {
        logger.info("Request received: PUT /api/visits/{}", visitId);
        // Debug logging
        logger.info("Received request body: {}", visitDTO);
        logger.info("Notes field: {}", visitDTO.getNotes());
        logger.info("DoctorId field: {}", visitDTO.getDoctorId());
        VisitDTO updatedVisit = visitService.updateVisit(visitId, visitDTO);
        logger.info("Visit updated successfully with ID: {}", visitId);
        return ResponseEntity.ok(updatedVisit);
    }

    @GetMapping("/patient/{patientId}/with-labtests")
    public ResponseEntity<?> getVisitsWithLabTestsByPatientId(@PathVariable String patientId) {
        try {
            logger.info("Request received: GET /api/visits/patient/{}/with-labtests", patientId);
            List<VisitDTO> visits = visitService.getVisitsWithLabTestsByPatientId(patientId);
            logger.info("Returning {} visits with lab tests for patient ID: {}", visits.size(), patientId);
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            logger.error("Error getting visits with lab tests for patient ID {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting visits with lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/{visitId}/labtests")
    public ResponseEntity<?> getLabTestsForVisit(@PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /api/visits/{}/labtests", visitId);
            
            // Get the visit first to ensure it exists
            VisitDTO visit = visitService.getVisitById(visitId);
            
            // Return the lab tests directly
            return ResponseEntity.ok(visit.getLabTests());
        } catch (Exception e) {
            logger.error("Error getting lab tests for visit ID {}: {}", visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }
} 