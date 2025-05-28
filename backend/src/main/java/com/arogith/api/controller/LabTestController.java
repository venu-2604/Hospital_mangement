package com.arogith.api.controller;

import com.arogith.api.dto.LabTestDTO;
import com.arogith.api.service.LabTestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

// Primary controller with /api/labtests mapping
@RestController
@RequestMapping("/api/labtests")
@CrossOrigin(origins = "*")
public class LabTestController {

    private static final Logger logger = LoggerFactory.getLogger(LabTestController.class);
    private final LabTestService labTestService;
    private final ObjectMapper objectMapper;

    @Autowired
    public LabTestController(LabTestService labTestService) {
        this.labTestService = labTestService;
        
        // Configure JSON serialization for dates
        this.objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.configure(SerializationFeature.INDENT_OUTPUT, true);
    }

    // Helper method to serialize dates in a consistent format
    private String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    // Helper method to add date fields directly to response
    private void ensureDateFields(LabTestDTO test) {
        // Log date fields for debugging
        logger.info("Processing date fields for test {}: testGivenAt={}, resultUpdatedAt={}", 
            test.getTestId(), 
            test.getTestGivenAt(), 
            test.getResultUpdatedAt()
        );
        
        // Set snake_case date fields explicitly
        if (test.getTestGivenAt() != null) {
            String formattedDate = formatDate(test.getTestGivenAt());
            logger.info("Setting formatted test_given_at: {}", formattedDate);
            // Accessor method will be used in serialization
            test.setTest_given_at(test.getTestGivenAt());
        }
        
        if (test.getResultUpdatedAt() != null) {
            String formattedDate = formatDate(test.getResultUpdatedAt());
            logger.info("Setting formatted result_updated_at: {}", formattedDate);
            // Accessor method will be used in serialization
            test.setResult_updated_at(test.getResultUpdatedAt());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllLabTests() {
        try {
            logger.info("Request received: GET /api/labtests");
            List<LabTestDTO> labTests = labTestService.getAllLabTests();
            logger.info("Returning {} lab tests", labTests.size());
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting all lab tests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/{testId}")
    public ResponseEntity<?> getLabTestById(@PathVariable Long testId) {
        try {
            logger.info("Request received: GET /api/labtests/{}", testId);
            LabTestDTO labTest = labTestService.getLabTestById(testId);
            logger.info("Returning lab test with ID: {}", testId);
            return ResponseEntity.ok(labTest);
        } catch (Exception e) {
            logger.error("Error getting lab test by ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab test: " + e.getMessage());
        }
    }

    @GetMapping("/visit/{visitId}")
    public ResponseEntity<?> getLabTestsByVisitId(@PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /api/labtests/visit/{}", visitId);
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitId(visitId);
            
            // Process date fields for each test
            for (LabTestDTO test : labTests) {
                ensureDateFields(test);
            }
            
            logger.info("Returning {} lab tests for visit ID: {}", labTests.size(), visitId);
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests for visit ID {}: {}", visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/visit/{visitId}/patient/{patientId}")
    public ResponseEntity<?> getLabTestsByVisitIdAndPatientId(
            @PathVariable Long visitId,
            @PathVariable String patientId) {
        try {
            logger.info("Request received: GET /api/labtests/visit/{}/patient/{}", visitId, patientId);
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitIdAndPatientId(visitId, patientId);
            
            // Log the results
            logger.info("Found {} lab tests for visit ID: {} and patient ID: {}", 
                    labTests.size(), visitId, patientId);
            
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests for visit ID {} and patient ID {}: {}", 
                    visitId, patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addLabTest(@Valid @RequestBody LabTestDTO labTestDTO) {
        try {
            logger.info("Request received: POST /api/labtests");
            logger.info("Lab test data: {}", labTestDTO);
            
            // Check for required fields
            if (labTestDTO.getVisitId() == null) {
                return ResponseEntity.badRequest().body("visitId is required");
            }
            
            if (labTestDTO.getName() == null || labTestDTO.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("name is required");
            }
            
            // Validate patientId if provided
            String patientId = labTestDTO.getPatientId();
            if (patientId == null || patientId.isEmpty()) {
                logger.warn("patientId is missing in the request - this should be provided for proper tracking");
            }
            
            LabTestDTO createdLabTest = labTestService.addLabTest(labTestDTO);
            logger.info("Lab test created with ID: {}", createdLabTest.getTestId());
            return new ResponseEntity<>(createdLabTest, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error adding lab test: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding lab test: " + e.getMessage());
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<?> addLabTestsBatch(@Valid @RequestBody List<LabTestDTO> labTestDTOs) {
        try {
            logger.info("Request received: POST /api/labtests/batch");
            logger.info("Received batch of {} lab tests", labTestDTOs.size());
            
            List<LabTestDTO> createdLabTests = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (LabTestDTO labTestDTO : labTestDTOs) {
                try {
                    // Check for required fields
                    if (labTestDTO.getVisitId() == null) {
                        errors.add("visitId is required for one or more tests");
                        continue;
                    }
                    
                    // Handle different name fields - check both name and testName
                    String testName = labTestDTO.getName();
                    if (testName == null || testName.isEmpty()) {
                        // Try to get testName via reflection if name is empty
                        try {
                            java.lang.reflect.Field field = labTestDTO.getClass().getDeclaredField("testName");
                            field.setAccessible(true);
                            Object value = field.get(labTestDTO);
                            if (value != null && !value.toString().isEmpty()) {
                                // Set the name field from testName for consistency
                                labTestDTO.setName(value.toString());
                            } else {
                                errors.add("name/testName is required for one or more tests");
                                continue;
                            }
                        } catch (Exception e) {
                            errors.add("name is required for one or more tests");
                            continue;
                        }
                    }
                    
                    LabTestDTO createdLabTest = labTestService.addLabTest(labTestDTO);
                    createdLabTests.add(createdLabTest);
                    logger.info("Created lab test with ID: {}", createdLabTest.getTestId());
                } catch (Exception e) {
                    logger.error("Error creating lab test in batch: {}", e.getMessage());
                    errors.add(e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("created", createdLabTests);
            response.put("totalCreated", createdLabTests.size());
            response.put("totalRequested", labTestDTOs.size());
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
                response.put("status", "PARTIAL_SUCCESS");
                return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
            }
            
            response.put("status", "SUCCESS");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error adding lab tests in batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding lab tests: " + e.getMessage());
        }
    }

    @PutMapping("/{testId}")
    public ResponseEntity<?> updateLabTest(@PathVariable Long testId, @Valid @RequestBody LabTestDTO labTestDTO) {
        try {
            logger.info("Request received: PUT /api/labtests/{}", testId);
            LabTestDTO updatedLabTest = labTestService.updateLabTest(testId, labTestDTO);
            logger.info("Lab test updated with ID: {}", testId);
            return ResponseEntity.ok(updatedLabTest);
        } catch (Exception e) {
            logger.error("Error updating lab test with ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating lab test: " + e.getMessage());
        }
    }

    @DeleteMapping("/{testId}")
    public ResponseEntity<?> deleteLabTest(@PathVariable Long testId) {
        try {
            logger.info("Request received: DELETE /api/labtests/{}", testId);
            labTestService.deleteLabTest(testId);
            logger.info("Lab test deleted with ID: {}", testId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting lab test with ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting lab test: " + e.getMessage());
        }
    }

    @GetMapping("/direct/visit/{visitId}")
    public ResponseEntity<?> getLabTestsDirectByVisitId(@PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /api/labtests/direct/visit/{}", visitId);
            
            // Get a direct connection to run SQL instead of using JPA
            String sql = "SELECT * FROM labtests WHERE visit_id = ?";
            
            // Log the query that will be executed
            logger.info("Executing direct SQL query: {}", sql);
            logger.info("With parameter: visitId = {}", visitId);
            
            // Execute query and map results manually to DTOs
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitIdWithDirectQuery(visitId);
            
            // Log the results
            logger.info("Direct query found {} lab tests for visit ID: {}", labTests.size(), visitId);
            
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests with direct query for visit ID {}: {}", visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/debug/schema")
    public ResponseEntity<?> getLabTestsSchema() {
        try {
            logger.info("Request received: GET /api/labtests/debug/schema");
            
            Map<String, Object> schemaInfo = new HashMap<>();
            
            // Add table info
            schemaInfo.put("table_name", "labtests");
            
            // Try to get column info
            try {
                // Count records in the table
                Integer recordCount = labTestService.countLabTests();
                schemaInfo.put("record_count", recordCount);
                
                // Get sample data if available
                if (recordCount > 0) {
                    List<LabTestDTO> samples = labTestService.getAllLabTests()
                        .stream()
                        .limit(3)
                        .collect(Collectors.toList());
                    schemaInfo.put("sample_data", samples);
                }
                
                schemaInfo.put("status", "CONNECTED");
                schemaInfo.put("message", "Successfully connected to labtests table");
            } catch (Exception e) {
                logger.error("Error accessing labtests table: {}", e.getMessage(), e);
                schemaInfo.put("status", "ERROR");
                schemaInfo.put("error", e.getMessage());
                schemaInfo.put("error_type", e.getClass().getName());
            }
            
            return ResponseEntity.ok(schemaInfo);
        } catch (Exception e) {
            logger.error("Error checking lab tests schema: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking schema: " + e.getMessage());
        }
    }
}

// Alternative controller with /labtests mapping for backward compatibility
@RestController
@RequestMapping("/labtests")
@CrossOrigin(origins = "*")
class AlternativeLabTestController {

    private static final Logger logger = LoggerFactory.getLogger(AlternativeLabTestController.class);
    private final LabTestService labTestService;
    private final LabTestController primaryController;

    @Autowired
    public AlternativeLabTestController(LabTestService labTestService, LabTestController primaryController) {
        this.labTestService = labTestService;
        this.primaryController = primaryController;
    }

    // Reuse the date formatting from the primary controller
    private void processDateFields(LabTestDTO test) {
        if (test.getTestGivenAt() != null) {
            test.setTest_given_at(test.getTestGivenAt()); 
        }
        if (test.getResultUpdatedAt() != null) {
            test.setResult_updated_at(test.getResultUpdatedAt());
        }
    }

    @GetMapping("/visit/{visitId}")
    public ResponseEntity<?> getLabTestsByVisitId(@PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /labtests/visit/{}", visitId);
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitId(visitId);
            
            // Process date fields for each test
            for (LabTestDTO test : labTests) {
                processDateFields(test);
            }
            
            logger.info("Returning {} lab tests for visit ID: {}", labTests.size(), visitId);
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests for visit ID {}: {}", visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/{testId}")
    public ResponseEntity<?> getLabTestById(@PathVariable Long testId) {
        try {
            logger.info("Request received: GET /labtests/{}", testId);
            LabTestDTO labTest = labTestService.getLabTestById(testId);
            logger.info("Returning lab test with ID: {}", testId);
            return ResponseEntity.ok(labTest);
        } catch (Exception e) {
            logger.error("Error getting lab test by ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab test: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addLabTest(@Valid @RequestBody LabTestDTO labTestDTO) {
        try {
            logger.info("Request received: POST /labtests");
            logger.info("Lab test data: {}", labTestDTO);
            
            // Check for required fields
            if (labTestDTO.getVisitId() == null) {
                return ResponseEntity.badRequest().body("visitId is required");
            }
            
            if (labTestDTO.getName() == null || labTestDTO.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("name is required");
            }
            
            // Validate patientId if provided
            String patientId = labTestDTO.getPatientId();
            if (patientId == null || patientId.isEmpty()) {
                logger.warn("patientId is missing in the request - this should be provided for proper tracking");
            }
            
            LabTestDTO createdLabTest = labTestService.addLabTest(labTestDTO);
            logger.info("Lab test created with ID: {}", createdLabTest.getTestId());
            return new ResponseEntity<>(createdLabTest, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error adding lab test: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding lab test: " + e.getMessage());
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<?> addLabTestsBatch(@Valid @RequestBody List<LabTestDTO> labTestDTOs) {
        try {
            logger.info("Request received: POST /labtests/batch");
            logger.info("Received batch of {} lab tests", labTestDTOs.size());
            
            List<LabTestDTO> createdLabTests = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (LabTestDTO labTestDTO : labTestDTOs) {
                try {
                    // Check for required fields
                    if (labTestDTO.getVisitId() == null) {
                        errors.add("visitId is required for one or more tests");
                        continue;
                    }
                    
                    // Handle different name fields - check both name and testName
                    String testName = labTestDTO.getName();
                    if (testName == null || testName.isEmpty()) {
                        // Try to get testName via reflection if name is empty
                        try {
                            java.lang.reflect.Field field = labTestDTO.getClass().getDeclaredField("testName");
                            field.setAccessible(true);
                            Object value = field.get(labTestDTO);
                            if (value != null && !value.toString().isEmpty()) {
                                // Set the name field from testName for consistency
                                labTestDTO.setName(value.toString());
                            } else {
                                errors.add("name/testName is required for one or more tests");
                                continue;
                            }
                        } catch (Exception e) {
                            errors.add("name is required for one or more tests");
                            continue;
                        }
                    }
                    
                    LabTestDTO createdLabTest = labTestService.addLabTest(labTestDTO);
                    createdLabTests.add(createdLabTest);
                    logger.info("Created lab test with ID: {}", createdLabTest.getTestId());
                } catch (Exception e) {
                    logger.error("Error creating lab test in batch: {}", e.getMessage());
                    errors.add(e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("created", createdLabTests);
            response.put("totalCreated", createdLabTests.size());
            response.put("totalRequested", labTestDTOs.size());
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
                response.put("status", "PARTIAL_SUCCESS");
                return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
            }
            
            response.put("status", "SUCCESS");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error adding lab tests in batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding lab tests: " + e.getMessage());
        }
    }

    @PutMapping("/{testId}")
    public ResponseEntity<?> updateLabTest(@PathVariable Long testId, @Valid @RequestBody LabTestDTO labTestDTO) {
        try {
            logger.info("Request received: PUT /labtests/{}", testId);
            LabTestDTO updatedLabTest = labTestService.updateLabTest(testId, labTestDTO);
            logger.info("Lab test updated with ID: {}", testId);
            return ResponseEntity.ok(updatedLabTest);
        } catch (Exception e) {
            logger.error("Error updating lab test with ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating lab test: " + e.getMessage());
        }
    }

    @DeleteMapping("/{testId}")
    public ResponseEntity<?> deleteLabTest(@PathVariable Long testId) {
        try {
            logger.info("Request received: DELETE /labtests/{}", testId);
            labTestService.deleteLabTest(testId);
            logger.info("Lab test deleted with ID: {}", testId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting lab test with ID {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting lab test: " + e.getMessage());
        }
    }

    // Add a new endpoint that allows fetching by both visit ID and patient ID
    @GetMapping("/patient/{patientId}/visit/{visitId}")
    public ResponseEntity<?> getLabTestsByPatientIdAndVisitId(
            @PathVariable String patientId,
            @PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /labtests/patient/{}/visit/{}", patientId, visitId);
            // Use the dedicated method that handles both IDs
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitIdAndPatientId(visitId, patientId);
            
            // Log the results
            logger.info("Found {} lab tests for patient ID: {} and visit ID: {}", 
                    labTests.size(), patientId, visitId);
            
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests for patient ID {} and visit ID {}: {}", 
                    patientId, visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting lab tests: " + e.getMessage());
        }
    }

    @GetMapping("/direct/visit/{visitId}")
    public ResponseEntity<?> getLabTestsDirectByVisitId(@PathVariable Long visitId) {
        try {
            logger.info("Request received: GET /labtests/direct/visit/{}", visitId);
            
            // Use the service method that uses direct SQL
            List<LabTestDTO> labTests = labTestService.getLabTestsByVisitIdWithDirectQuery(visitId);
            
            // Log the results
            logger.info("Direct query found {} lab tests for visit ID: {}", labTests.size(), visitId);
            
            return ResponseEntity.ok(labTests);
        } catch (Exception e) {
            logger.error("Error getting lab tests with direct query for visit ID {}: {}", visitId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting lab tests: " + e.getMessage());
        }
    }
} 