package com.arogith.api.service;

import com.arogith.api.dto.VisitDTO;
import java.util.List;

public interface VisitService {
    
    // Get all visits
    List<VisitDTO> getAllVisits();
    
    // Get visit by ID
    VisitDTO getVisitById(Long visitId);
    
    // Get visits by patient ID
    List<VisitDTO> getVisitsByPatientId(String patientId);
    
    // Get visits by doctor ID
    List<VisitDTO> getVisitsByDoctorId(String doctorId);
    
    // Get visits with lab tests in a single query (JOIN approach)
    List<VisitDTO> getVisitsWithLabTestsByPatientId(String patientId);
    
    // Get today's visits
    List<VisitDTO> getTodayVisits();
    
    // Get yesterday's visits
    List<VisitDTO> getYesterdayVisits();
    
    // Create new visit
    VisitDTO createVisit(VisitDTO visitDTO);
    
    // Update visit
    VisitDTO updateVisit(Long visitId, VisitDTO visitDTO);
} 