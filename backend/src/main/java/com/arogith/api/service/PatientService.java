package com.arogith.api.service;

import com.arogith.api.dto.PatientDTO;
import com.arogith.api.dto.PatientRegistrationDTO;
import com.arogith.api.dto.PatientResponseDTO;
import java.util.List;

public interface PatientService {
    
    // Get all patients
    List<PatientDTO> getAllPatients();
    
    // Get patient by ID
    PatientDTO getPatientById(String patientId);
    
    // Refresh patient details with latest visit data
    PatientDTO refreshPatientDetails(String patientId);
    
    // Get patients by visit date category (today, yesterday, all)
    List<PatientDTO> getPatientsByVisitDateCategory(String category);
    
    // Register new patient with first visit
    PatientResponseDTO registerPatient(PatientRegistrationDTO registrationDTO);
    
    // Update patient details
    PatientDTO updatePatient(String patientId, PatientDTO patientDTO);
    
    // Search patients
    List<PatientDTO> searchPatients(String query);
    
    // Update missing temperature values
    int updateMissingTemperatureValues();
} 