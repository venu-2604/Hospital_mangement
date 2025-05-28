package com.arogith.api.service;

import com.arogith.api.dto.LabTestDTO;
import java.util.List;

public interface LabTestService {
    
    // Get all lab tests
    List<LabTestDTO> getAllLabTests();
    
    // Get lab test by ID
    LabTestDTO getLabTestById(Long testId);
    
    // Get lab tests by visit ID
    List<LabTestDTO> getLabTestsByVisitId(Long visitId);
    
    // Get lab tests by both visit ID and patient ID
    List<LabTestDTO> getLabTestsByVisitIdAndPatientId(Long visitId, String patientId);
    
    // Get lab tests using direct SQL query without JPA complexity
    List<LabTestDTO> getLabTestsByVisitIdWithDirectQuery(Long visitId);
    
    // Add new lab test
    LabTestDTO addLabTest(LabTestDTO labTestDTO);
    
    // Update lab test
    LabTestDTO updateLabTest(Long testId, LabTestDTO labTestDTO);
    
    // Delete lab test
    void deleteLabTest(Long testId);
    
    // Count total lab tests
    Integer countLabTests();
} 