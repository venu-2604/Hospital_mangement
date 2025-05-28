package com.arogith.api.controller;

import com.arogith.api.dto.PatientDTO;
import com.arogith.api.dto.PatientRegistrationDTO;
import com.arogith.api.dto.PatientResponseDTO;
import com.arogith.api.service.PatientService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:3000")
public class PatientController {

    private static final Logger logger = LoggerFactory.getLogger(PatientController.class);
    private final PatientService patientService;

    @Autowired
    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public ResponseEntity<List<PatientDTO>> getAllPatients() {
        logger.info("Request received: GET /api/patients");
        List<PatientDTO> patients = patientService.getAllPatients();
        logger.info("Returning {} patients", patients.size());
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<PatientDTO> getPatientById(@PathVariable String patientId) {
        logger.info("Request received: GET /api/patients/{}", patientId);
        PatientDTO patient = patientService.getPatientById(patientId);
        logger.info("Returning patient with ID: {}", patientId);
        return ResponseEntity.ok(patient);
    }

    @GetMapping("/{patientId}/refresh")
    public ResponseEntity<PatientDTO> refreshPatientDetails(@PathVariable String patientId) {
        logger.info("Request received: GET /api/patients/{}/refresh", patientId);
        PatientDTO patient = patientService.refreshPatientDetails(patientId);
        logger.info("Returning refreshed patient data with ID: {}", patientId);
        return ResponseEntity.ok(patient);
    }

    @PostMapping("/fixTemperature")
    public ResponseEntity<String> fixTemperatureData() {
        logger.info("Request received: POST /api/patients/fixTemperature");
        try {
            int updatedCount = patientService.updateMissingTemperatureValues();
            return ResponseEntity.ok("Successfully updated " + updatedCount + " visit records with temperature data");
        } catch (Exception e) {
            logger.error("Error fixing temperature data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fixing temperature data: " + e.getMessage());
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<PatientDTO>> getPatientsByVisitDateCategory(@PathVariable String category) {
        logger.info("Request received: GET /api/patients/category/{}", category);
        List<PatientDTO> patients = patientService.getPatientsByVisitDateCategory(category);
        logger.info("Returning {} patients for category: {}", patients.size(), category);
        return ResponseEntity.ok(patients);
    }

    @PostMapping
    public ResponseEntity<PatientResponseDTO> registerPatient(@Valid @RequestBody PatientRegistrationDTO registrationDTO) {
        logger.info("Request received: POST /api/patients");
        
        if (registrationDTO == null) {
            logger.error("Request body is null");
            return ResponseEntity.badRequest().build();
        }
        
        PatientResponseDTO response = patientService.registerPatient(registrationDTO);
        
        logger.info("Patient registered successfully with ID: {}, isNewPatient: {}", 
                    response.getPatient().getPatientId(), response.isNewPatient());
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{patientId}")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable String patientId, @Valid @RequestBody PatientDTO patientDTO) {
        logger.info("Request received: PUT /api/patients/{}", patientId);
        PatientDTO updatedPatient = patientService.updatePatient(patientId, patientDTO);
        logger.info("Patient updated successfully with ID: {}", patientId);
        return ResponseEntity.ok(updatedPatient);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PatientDTO>> searchPatients(@RequestParam String query) {
        logger.info("Request received: GET /api/patients/search?query={}", query);
        List<PatientDTO> results = patientService.searchPatients(query);
        logger.info("Returning {} search results for query: {}", results.size(), query);
        return ResponseEntity.ok(results);
    }
} 