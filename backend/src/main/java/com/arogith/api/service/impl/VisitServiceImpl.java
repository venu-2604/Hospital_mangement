package com.arogith.api.service.impl;

import com.arogith.api.dto.LabTestDTO;
import com.arogith.api.dto.VisitDTO;
import com.arogith.api.model.Patient;
import com.arogith.api.model.Visit;
import com.arogith.api.repository.PatientRepository;
import com.arogith.api.repository.VisitRepository;
import com.arogith.api.service.VisitService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VisitServiceImpl implements VisitService {

    private static final Logger logger = LoggerFactory.getLogger(VisitServiceImpl.class);
    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm a");

    @Autowired
    public VisitServiceImpl(VisitRepository visitRepository, PatientRepository patientRepository) {
        this.visitRepository = visitRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public List<VisitDTO> getAllVisits() {
        logger.info("Fetching all visits");
        List<Visit> visits = visitRepository.findAll();
        logger.info("Found {} visits in database", visits.size());
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public VisitDTO getVisitById(Long visitId) {
        logger.info("Fetching visit with ID: {}", visitId);
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new EntityNotFoundException("Visit not found with ID: " + visitId));
        logger.info("Found visit with ID: {}", visitId);
        return convertToDTO(visit);
    }

    @Override
    public List<VisitDTO> getVisitsByPatientId(String patientId) {
        logger.info("Fetching visits for patient ID: {}", patientId);
        List<Visit> visits = visitRepository.findByPatientPatientId(patientId);
        logger.info("Found {} visits for patient ID: {}", visits.size(), patientId);
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<VisitDTO> getTodayVisits() {
        logger.info("Fetching today's visits");
        List<Visit> visits = visitRepository.findTodayVisits();
        logger.info("Found {} visits for today", visits.size());
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<VisitDTO> getYesterdayVisits() {
        logger.info("Fetching yesterday's visits");
        List<Visit> visits = visitRepository.findYesterdayVisits();
        logger.info("Found {} visits for yesterday", visits.size());
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VisitDTO createVisit(VisitDTO visitDTO) {
        logger.info("Creating new visit for patient ID: {}", visitDTO.getPatientId());
        
        // Verify patient exists
        String patientId = visitDTO.getPatientId();
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
        
        Visit visit = new Visit();
        visit.setPatientId(patientId);
        visit.setPatient(patient);
        visit.setOpNo(visitDTO.getOpNo());
        visit.setRegNo(visitDTO.getRegNo());
        visit.setBp(visitDTO.getBp());
        visit.setWeight(visitDTO.getWeight());
        visit.setTemperature(visitDTO.getTemperature());
        visit.setSymptoms(visitDTO.getSymptoms());
        visit.setComplaint(visitDTO.getComplaint());
        visit.setStatus(visitDTO.getStatus());
        visit.setPrescription(visitDTO.getPrescription());
        visit.setNotes(visitDTO.getNotes());
        visit.setVisitDate(LocalDateTime.now());
        
        Visit savedVisit = visitRepository.save(visit);
        logger.info("Visit created with ID: {}", savedVisit.getVisitId());
        
        return convertToDTO(savedVisit);
    }

    @Override
    @Transactional
    public VisitDTO updateVisit(Long visitId, VisitDTO visitDTO) {
        logger.info("Updating visit with ID: {}", visitId);
        logger.info("Received doctorId in DTO: {}", visitDTO.getDoctorId());
        
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new EntityNotFoundException("Visit not found with ID: " + visitId));
        
        // Update fields if provided
        if (visitDTO.getBp() != null) {
            visit.setBp(visitDTO.getBp());
        }
        if (visitDTO.getWeight() != null) {
            visit.setWeight(visitDTO.getWeight());
        }
        if (visitDTO.getTemperature() != null) {
            visit.setTemperature(visitDTO.getTemperature());
        }
        if (visitDTO.getSymptoms() != null) {
            visit.setSymptoms(visitDTO.getSymptoms());
        }
        if (visitDTO.getComplaint() != null) {
            visit.setComplaint(visitDTO.getComplaint());
        }
        if (visitDTO.getStatus() != null) {
            visit.setStatus(visitDTO.getStatus());
        }
        // Save doctorId if provided
        if (visitDTO.getDoctorId() != null) {
            logger.info("Setting doctorId to visit: {}", visitDTO.getDoctorId());
            visit.setDoctorId(visitDTO.getDoctorId());
            logger.info("Visit doctorId after setting: {}", visit.getDoctorId());
        }
        // Check if this update includes adding a prescription
        boolean isPrescriptionUpdate = visitDTO.getPrescription() != null && 
                                     !visitDTO.getPrescription().isEmpty();
        if (isPrescriptionUpdate) {
            // Only update prescription if it's not empty
            visit.setPrescription(visitDTO.getPrescription());
            // Get the patient to check total visits
            String patientId = visit.getPatientId();
            Patient patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
            // For new patients (total_visits is 0), increment total_visits when first prescription is saved
            if (patient.getTotalVisits() == 0) {
                patient.setTotalVisits(1);
                logger.info("Updating patient's total visits to 1 after first prescription saved. Patient ID: {}", patientId);
                patientRepository.save(patient);
            }
        }
        // Handle notes updates
        if (visitDTO.getNotes() != null) {
            visit.setNotes(visitDTO.getNotes());
            logger.info("Updated notes for visit ID: {}", visitId);
        }
        Visit updatedVisit = visitRepository.save(visit);
        logger.info("Visit updated with ID: {}", updatedVisit.getVisitId());
        return convertToDTO(updatedVisit);
    }
    
    /**
     * Gets visits with lab tests in a single query using JOIN for better performance
     */
    @Override
    public List<VisitDTO> getVisitsWithLabTestsByPatientId(String patientId) {
        logger.info("Fetching visits with lab tests for patient ID: {} using JOIN query", patientId);
        try {
            List<Visit> visits = visitRepository.findVisitsWithLabTestsByPatientId(patientId);
            logger.info("Found {} visits with lab tests for patient ID: {}", visits.size(), patientId);
            
            // Convert to DTOs with lab tests included
            List<VisitDTO> visitDTOs = visits.stream()
                .map(visit -> {
                    VisitDTO dto = convertToDTO(visit);
                    // Lab tests should already be loaded due to the FETCH JOIN
                    if (visit.getLabTests() != null && !visit.getLabTests().isEmpty()) {
                        logger.info("Visit {} has {} lab tests", visit.getVisitId(), visit.getLabTests().size());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
            
            return visitDTOs;
        } catch (Exception e) {
            logger.error("Error fetching visits with lab tests for patient ID {}: {}", patientId, e.getMessage(), e);
            // Fallback to regular method if JOIN approach fails
            logger.info("Falling back to standard visit fetch method");
            return getVisitsByPatientId(patientId);
        }
    }
    
    @Override
    public List<VisitDTO> getVisitsByDoctorId(String doctorId) {
        List<Visit> visits = visitRepository.findByDoctorId(doctorId);
        return visits.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper method to convert Visit entity to VisitDTO
    private VisitDTO convertToDTO(Visit visit) {
        VisitDTO dto = new VisitDTO();
        dto.setVisitId(visit.getVisitId());
        dto.setPatientId(visit.getPatientId());
        dto.setDoctorId(visit.getDoctorId());
        if (visit.getDoctor() != null) {
            dto.setDoctorName(visit.getDoctor().getName());
        }
        dto.setOpNo(visit.getOpNo());
        dto.setRegNo(visit.getRegNo());
        dto.setBp(visit.getBp());
        dto.setWeight(visit.getWeight());
        dto.setTemperature(visit.getTemperature());
        dto.setSymptoms(visit.getSymptoms());
        dto.setComplaint(visit.getComplaint());
        dto.setStatus(visit.getStatus());
        dto.setPrescription(visit.getPrescription());
        dto.setNotes(visit.getNotes());
        
        // Format the date and time
        if (visit.getVisitDate() != null) {
            dto.setVisitDate(visit.getVisitDate().format(DATE_FORMATTER));
            dto.setVisitTime(visit.getVisitDate().format(TIME_FORMATTER));
        }
        
        // Include lab tests if they exist
        if (visit.getLabTests() != null && !visit.getLabTests().isEmpty()) {
            // Convert lab tests to DTOs
            List<LabTestDTO> labTestDTOs = visit.getLabTests().stream()
                .map(labTest -> {
                    LabTestDTO labTestDTO = new LabTestDTO();
                    labTestDTO.setTestId(labTest.getTestId());
                    labTestDTO.setVisitId(labTest.getVisitId());
                    labTestDTO.setName(labTest.getTestName());
                    labTestDTO.setResult(labTest.getResult());
                    labTestDTO.setReferenceRange(labTest.getReferenceRange());
                    labTestDTO.setStatus(labTest.getStatus());
                    return labTestDTO;
                })
                .collect(Collectors.toList());
            
            dto.setLabTests(labTestDTOs);
        }
        
        return dto;
    }
} 