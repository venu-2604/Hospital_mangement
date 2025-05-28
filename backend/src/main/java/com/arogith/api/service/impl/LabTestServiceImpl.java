package com.arogith.api.service.impl;

import com.arogith.api.dto.LabTestDTO;
import com.arogith.api.model.LabTest;
import com.arogith.api.repository.LabTestRepository;
import com.arogith.api.service.LabTestService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LabTestServiceImpl implements LabTestService {

    private static final Logger logger = LoggerFactory.getLogger(LabTestServiceImpl.class);
    private final LabTestRepository labTestRepository;

    @Autowired
    public LabTestServiceImpl(LabTestRepository labTestRepository) {
        this.labTestRepository = labTestRepository;
    }

    @Override
    public List<LabTestDTO> getAllLabTests() {
        logger.info("Fetching all lab tests");
        List<LabTest> labTests = labTestRepository.findAll();
        logger.info("Found {} lab tests in database", labTests.size());
        return labTests.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public LabTestDTO getLabTestById(Long testId) {
        logger.info("Fetching lab test with ID: {}", testId);
        LabTest labTest = labTestRepository.findById(testId)
                .orElseThrow(() -> new EntityNotFoundException("Lab test not found with ID: " + testId));
        logger.info("Found lab test with ID: {}", testId);
        return convertToDTO(labTest);
    }

    @Override
    public List<LabTestDTO> getLabTestsByVisitId(Long visitId) {
        logger.info("Fetching lab tests for visit ID: {}", visitId);
        
        List<LabTest> labTests = null;
        Throwable lastError = null;
        
        // Try multiple strategies to fetch lab tests
        try {
            // First try the direct property
            labTests = labTestRepository.findByVisitId(visitId);
            logger.info("Used findByVisitId method - found {} lab tests", labTests.size());
        } catch (Exception e) {
            logger.warn("Error using findByVisitId: {}", e.getMessage());
            lastError = e;
            
            try {
                // Try JPQL query
                labTests = labTestRepository.findLabTestsByVisitId(visitId);
                logger.info("Used findLabTestsByVisitId method - found {} lab tests", labTests.size());
            } catch (Exception e2) {
                logger.warn("Error using findLabTestsByVisitId: {}", e2.getMessage());
                lastError = e2;
                
                try {
                    // Try native SQL query
                    labTests = labTestRepository.findLabTestsByVisitIdNative(visitId);
                    logger.info("Used findLabTestsByVisitIdNative method - found {} lab tests", labTests.size());
                } catch (Exception e3) {
                    logger.warn("Error using findLabTestsByVisitIdNative: {}", e3.getMessage());
                    lastError = e3;
                    
                    try {
                        // Try the comprehensive query that tries multiple approaches
                        labTests = labTestRepository.findLabTestsByVisitIdComprehensive(visitId);
                        logger.info("Used findLabTestsByVisitIdComprehensive method - found {} lab tests", labTests.size());
                    } catch (Exception e4) {
                        logger.warn("Error using findLabTestsByVisitIdComprehensive: {}", e4.getMessage());
                        lastError = e4;
                        
                        try {
                            // Fallback to original method if all else fails
                            labTests = labTestRepository.findByVisitVisitId(visitId);
                            logger.info("Used original findByVisitVisitId method - found {} lab tests", labTests.size());
                        } catch (Exception e5) {
                            logger.error("All repository methods failed. Last error: {}", e5.getMessage());
                            lastError = e5;
                        }
                    }
                }
            }
        }
        
        // If still null, log the last error and return empty list
        if (labTests == null) {
            logger.error("Unable to retrieve lab tests for visit ID: {}. Last error: {}", 
                    visitId, lastError != null ? lastError.getMessage() : "Unknown error");
            return new ArrayList<>();
        }
        
        return labTests.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LabTestDTO addLabTest(LabTestDTO labTestDTO) {
        logger.info("Adding new lab test for visit ID: {}", labTestDTO.getVisitId());
        
        try {
            LabTest labTest = new LabTest();
            
            // Set visit ID (required)
            labTest.setVisitId(labTestDTO.getVisitId());
            
            // Set patient ID if provided
            String patientId = labTestDTO.getPatientId();
            if (patientId != null && !patientId.isEmpty()) {
                labTest.setPatientId(patientId);
            }
            
            // Set test name - handle both camelCase and snake_case formats
            String testName = labTestDTO.getName();
            if (testName == null || testName.isEmpty()) {
                // Try the test_name property if it exists via reflection
                try {
                    java.lang.reflect.Field field = labTestDTO.getClass().getDeclaredField("test_name");
                    field.setAccessible(true);
                    Object value = field.get(labTestDTO);
                    if (value != null && !value.toString().isEmpty()) {
                        testName = value.toString();
                    }
                } catch (Exception e) {
                    logger.warn("Could not access test_name property via reflection: {}", e.getMessage());
                }
            }
            
            // If still null, use a default
            if (testName == null || testName.isEmpty()) {
                testName = "Unknown Test";
            }
            
            labTest.setTestName(testName);
            
            // Set result (optional)
            String result = labTestDTO.getResult();
            labTest.setResult(result != null ? result : "");
            
            // Set reference range - handle both camelCase and snake_case formats
            String referenceRange = labTestDTO.getReferenceRange();
            if (referenceRange == null || referenceRange.isEmpty()) {
                // Try the reference_range property if it exists via reflection
                try {
                    java.lang.reflect.Field field = labTestDTO.getClass().getDeclaredField("reference_range");
                    field.setAccessible(true);
                    Object value = field.get(labTestDTO);
                    if (value != null && !value.toString().isEmpty()) {
                        referenceRange = value.toString();
                    }
                } catch (Exception e) {
                    logger.warn("Could not access reference_range property via reflection: {}", e.getMessage());
                }
                
                // If still null, use a default
                if (referenceRange == null || referenceRange.isEmpty()) {
                    referenceRange = "Pending";
                }
            }
            
            labTest.setReferenceRange(referenceRange);
            
            // Set status (optional with default)
            String status = labTestDTO.getStatus();
            labTest.setStatus(status != null ? status : "pending");
            
            // Set timestamps (testGivenAt will be set by the database if null)
            labTest.setTestGivenAt(labTestDTO.getTestGivenAt());
            
            // Only set resultUpdatedAt if result is provided
            if (result != null && !result.isEmpty()) {
                labTest.setResultUpdatedAt(labTestDTO.getResultUpdatedAt() != null ? 
                                          labTestDTO.getResultUpdatedAt() : 
                                          java.time.LocalDateTime.now());
            }
            
            LabTest savedLabTest = labTestRepository.save(labTest);
            logger.info("Lab test created with ID: {}", savedLabTest.getTestId());
            
            return convertToDTO(savedLabTest);
        } catch (Exception e) {
            logger.error("Error saving lab test: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save lab test: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public LabTestDTO updateLabTest(Long testId, LabTestDTO labTestDTO) {
        logger.info("Updating lab test with ID: {}", testId);
        
        LabTest labTest = labTestRepository.findById(testId)
                .orElseThrow(() -> new EntityNotFoundException("Lab test not found with ID: " + testId));
        
        // Update fields if provided
        if (labTestDTO.getName() != null) {
            labTest.setTestName(labTestDTO.getName());
        }
        
        // Update result and set result_updated_at timestamp if result has changed
        if (labTestDTO.getResult() != null && !labTestDTO.getResult().equals(labTest.getResult())) {
            labTest.setResult(labTestDTO.getResult());
            // Set the result update timestamp to now
            labTest.setResultUpdatedAt(java.time.LocalDateTime.now());
        }
        
        if (labTestDTO.getReferenceRange() != null) {
            labTest.setReferenceRange(labTestDTO.getReferenceRange());
        }
        
        if (labTestDTO.getStatus() != null) {
            labTest.setStatus(labTestDTO.getStatus());
        }
        
        // Update patientId if provided
        if (labTestDTO.getPatientId() != null && !labTestDTO.getPatientId().isEmpty()) {
            labTest.setPatientId(labTestDTO.getPatientId());
        }
        
        // Only update timestamps if explicitly provided
        if (labTestDTO.getTestGivenAt() != null) {
            labTest.setTestGivenAt(labTestDTO.getTestGivenAt());
        }
        
        if (labTestDTO.getResultUpdatedAt() != null) {
            labTest.setResultUpdatedAt(labTestDTO.getResultUpdatedAt());
        }
        
        LabTest updatedLabTest = labTestRepository.save(labTest);
        logger.info("Lab test updated with ID: {}", updatedLabTest.getTestId());
        
        return convertToDTO(updatedLabTest);
    }

    @Override
    @Transactional
    public void deleteLabTest(Long testId) {
        logger.info("Deleting lab test with ID: {}", testId);
        
        if (!labTestRepository.existsById(testId)) {
            throw new EntityNotFoundException("Lab test not found with ID: " + testId);
        }
        
        labTestRepository.deleteById(testId);
        logger.info("Lab test deleted with ID: {}", testId);
    }
    
    // Helper method to convert LabTest entity to LabTestDTO
    private LabTestDTO convertToDTO(LabTest labTest) {
        LabTestDTO dto = new LabTestDTO();
        dto.setTestId(labTest.getTestId());
        dto.setVisitId(labTest.getVisitId());
        dto.setPatientId(labTest.getPatientId());
        dto.setName(labTest.getTestName());
        dto.setResult(labTest.getResult());
        dto.setReferenceRange(labTest.getReferenceRange());
        dto.setStatus(labTest.getStatus());
        
        // Ensure both camelCase and snake_case date fields are set
        LocalDateTime testDate = labTest.getTestGivenAt();
        LocalDateTime resultDate = labTest.getResultUpdatedAt();
        
        dto.setTestGivenAt(testDate);
        dto.setResultUpdatedAt(resultDate);
        
        // Explicitly set snake_case fields for compatibility
        dto.setTest_given_at(testDate);
        dto.setResult_updated_at(resultDate);
        
        // Format dates for display if present
        if (testDate != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            dto.setFormattedTestDate(testDate.format(formatter));
        }
        
        if (resultDate != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            dto.setFormattedResultDate(resultDate.format(formatter));
        }
        
        return dto;
    }

    // New method to get lab tests by both visit ID and patient ID
    public List<LabTestDTO> getLabTestsByVisitIdAndPatientId(Long visitId, String patientId) {
        logger.info("Fetching lab tests for visit ID: {} and patient ID: {}", visitId, patientId);
        
        List<LabTest> labTests = null;
        
        try {
            // First try the direct query for both IDs
            labTests = labTestRepository.findByVisitIdAndPatientId(visitId, patientId);
            logger.info("Found {} lab tests for visit ID: {} and patient ID: {}", 
                    labTests.size(), visitId, patientId);
        } catch (Exception e) {
            logger.warn("Error fetching lab tests by visit ID and patient ID: {}", e.getMessage());
            
            // Fall back to just using visit ID
            return getLabTestsByVisitId(visitId);
        }
        
        // If no results found, fall back to just using visit ID
        if (labTests == null || labTests.isEmpty()) {
            logger.info("No lab tests found with both visit ID and patient ID. Falling back to visit ID only.");
            return getLabTestsByVisitId(visitId);
        }
        
        return labTests.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Gets lab tests directly with SQL query, bypassing JPA complexity
     */
    @Override
    public List<LabTestDTO> getLabTestsByVisitIdWithDirectQuery(Long visitId) {
        logger.info("Fetching lab tests for visit ID: {} using direct SQL query", visitId);
        
        try {
            // Using the repository method that uses native SQL
            List<LabTest> labTests = labTestRepository.findLabTestsByVisitIdNative(visitId);
            
            if (labTests.isEmpty()) {
                logger.info("No lab tests found for visit ID {} using direct query", visitId);
                // Try the comprehensive query as a fallback
                labTests = labTestRepository.findLabTestsByVisitIdComprehensive(visitId);
                logger.info("Comprehensive query found {} lab tests", labTests.size());
            }
            
            // Convert to DTOs
            return labTests.stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error executing direct SQL query for visit ID {}: {}", visitId, e.getMessage(), e);
            
            // Create a dummy lab test for debugging if nothing was found
            if (logger.isDebugEnabled()) {
                logger.debug("Creating dummy lab test for debugging purposes");
                LabTest dummyTest = new LabTest();
                dummyTest.setTestId(-1L);
                dummyTest.setVisitId(visitId);
                dummyTest.setTestName("DEBUG: No tests found - query failed");
                dummyTest.setReferenceRange("N/A");
                dummyTest.setResult("Error: " + e.getMessage());
                dummyTest.setStatus("error");
                
                return List.of(convertToDTO(dummyTest));
            }
            
            // In production, return empty list
            return new ArrayList<>();
        }
    }

    @Override
    public Integer countLabTests() {
        try {
            logger.info("Counting total lab tests in database");
            Long count = labTestRepository.count();
            logger.info("Found {} lab tests in database", count);
            return count.intValue();
        } catch (Exception e) {
            logger.error("Error counting lab tests: {}", e.getMessage(), e);
            return 0;
        }
    }
} 