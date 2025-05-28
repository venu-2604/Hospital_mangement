package com.arogith.api.service.impl;

import com.arogith.api.dto.PatientDTO;
import com.arogith.api.dto.PatientRegistrationDTO;
import com.arogith.api.dto.PatientResponseDTO;
import com.arogith.api.model.Patient;
import com.arogith.api.model.Visit;
import com.arogith.api.repository.PatientRepository;
import com.arogith.api.repository.VisitRepository;
import com.arogith.api.service.PatientService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PatientServiceImpl implements PatientService {

    private static final Logger logger = LoggerFactory.getLogger(PatientServiceImpl.class);
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm a");

    @Autowired
    public PatientServiceImpl(PatientRepository patientRepository, VisitRepository visitRepository) {
        this.patientRepository = patientRepository;
        this.visitRepository = visitRepository;
    }

    @Override
    public List<PatientDTO> getAllPatients() {
        logger.info("Fetching all patients");
        List<Patient> patients = patientRepository.findAll();
        logger.info("Found {} patients in database", patients.size());
        return patients.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public PatientDTO getPatientById(String patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
        return convertToDTO(patient);
    }

    @Override
    public PatientDTO refreshPatientDetails(String patientId) {
        logger.info("Refreshing patient details for ID: {}", patientId);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
        
        // Force refresh from the database to ensure we have the latest visit data
        List<Visit> latestVisits = visitRepository.findLatestVisitsByPatientId(patientId);
        logger.info("Found {} recent visits for patient ID: {}", latestVisits.size(), patientId);
        
        return convertToDTO(patient);
    }

    @Override
    public List<PatientDTO> getPatientsByVisitDateCategory(String category) {
        List<Visit> visits;
        
        switch (category.toLowerCase()) {
            case "today":
                visits = visitRepository.findTodayVisits();
                break;
            case "yesterday":
                visits = visitRepository.findYesterdayVisits();
                break;
            case "all":
            default:
                return getAllPatients();
        }
        
        // Get unique patients from these visits
        List<Patient> patients = visits.stream()
                .map(Visit::getPatient)
                .distinct()
                .collect(Collectors.toList());
        
        return patients.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientResponseDTO registerPatient(PatientRegistrationDTO registrationDTO) {
        logger.info("Starting patient registration process");
        
        if (registrationDTO == null) {
            logger.error("Registration data is null");
            throw new IllegalArgumentException("Patient registration data cannot be null");
        }
        
        // Check if patient already exists with the same Aadhar number
        String aadharNumber = registrationDTO.getAadharNumber();
        String name = registrationDTO.getName();
        
        logger.info("Checking if patient already exists with Aadhar number: {}", aadharNumber);
        
        // First, check by Aadhar number only as it should be unique in the database
        Optional<Patient> existingPatientByAadhar = patientRepository.findByAadharNumber(aadharNumber);
        
        Patient patient;
        boolean isNewPatient = false;
        
        if (existingPatientByAadhar.isPresent()) {
            // Patient with this Aadhar already exists
            Patient existingPatient = existingPatientByAadhar.get();
            logger.info("Found existing patient with ID: {} and name: {}", 
                      existingPatient.getPatientId(), existingPatient.getName());
            
            // Strictly verify that the name matches for the same Aadhar number
            if (existingPatient.getName().equalsIgnoreCase(name)) {
                // Same Aadhar and same name - this is a returning patient (revisit)
                logger.info("Name matches existing patient record. Using existing patient for revisit.");
                patient = existingPatient;
                isNewPatient = false;
            } else {
                // Same Aadhar but different name - this is an error condition
                logger.error("Found patient with same Aadhar but different name. Existing: {}, New: {}", 
                          existingPatient.getName(), name);
                throw new IllegalArgumentException(
                    "A patient with Aadhar number " + aadharNumber + " already exists with name: " 
                    + existingPatient.getName() + ". Please verify your information or contact admin."
                );
            }
        } else {
            // Aadhar doesn't exist in the system - create a new patient record
            logger.info("No existing patient found with Aadhar number: {}. Creating new patient record.", aadharNumber);
            isNewPatient = true;
            
            // Create a new patient
            patient = new Patient();
            patient.setSurname(registrationDTO.getSurname());
            patient.setName(registrationDTO.getName());
            patient.setFatherName(registrationDTO.getFatherName());
            patient.setAge(registrationDTO.getAge());
            patient.setBloodGroup(registrationDTO.getBloodGroup());
            patient.setGender(registrationDTO.getGender());
            patient.setAadharNumber(registrationDTO.getAadharNumber());
            patient.setPhoneNumber(registrationDTO.getPhoneNumber());
            patient.setAddress(registrationDTO.getAddress());
            patient.setTotalVisits(0); // New patient starts with 0 visits
            
            // Handle photo if provided
            if (registrationDTO.getPhoto() != null && !registrationDTO.getPhoto().isEmpty()) {
                logger.info("Processing patient photo");
                try {
                    String base64Image = registrationDTO.getPhoto();
                    // Check if it's a data URL
                    if (base64Image.contains(",")) {
                        base64Image = base64Image.split(",")[1];
                    }
                    // Decode the Base64 string
                    byte[] decodedPhoto = Base64.getDecoder().decode(base64Image);
                    patient.setPhoto(decodedPhoto);
                    logger.info("Photo processed successfully");
                } catch (IllegalArgumentException e) {
                    logger.error("Invalid Base64 encoding in photo: {}", e.getMessage());
                    throw new IllegalArgumentException("Invalid photo format: " + e.getMessage());
                } catch (Exception e) {
                    logger.error("Error processing photo: {}", e.getMessage());
                    throw new IllegalArgumentException("Failed to process photo: " + e.getMessage());
                }
            } else {
                logger.info("No photo provided for patient");
            }
            
            logger.info("Saving new patient to database");
            // Save the patient to generate the ID
            patient = patientRepository.save(patient);
            logger.info("Patient saved with ID: {}", patient.getPatientId());
        }
        
        // Create a new visit record (for both new and existing patients)
        logger.info("Creating visit record for patient ID: {}", patient.getPatientId());
        Visit visit = new Visit();
        visit.setPatientId(patient.getPatientId());
        visit.setPatient(patient);
        visit.setBp(registrationDTO.getBp());
        visit.setWeight(registrationDTO.getWeight());
        visit.setTemperature(registrationDTO.getTemperature());
        visit.setSymptoms(registrationDTO.getSymptoms());
        visit.setComplaint(registrationDTO.getComplaint());
        visit.setStatus(registrationDTO.getStatus());
        visit.setVisitDate(LocalDateTime.now());
        
        logger.info("Saving visit for patient");
        // Save the visit
        Visit savedVisit = visitRepository.save(visit);
        logger.info("Visit saved with ID: {}", savedVisit.getVisitId());
        
        // Only increment total_visits for existing patients
        // For new patients, leave total_visits at 0 until a prescription is explicitly saved
        if (!isNewPatient) {
            int newVisitCount = patient.getTotalVisits() + 1;
            patient.setTotalVisits(newVisitCount);
            logger.info("Updating existing patient's total visits to: {}", newVisitCount);
            patient = patientRepository.save(patient);
        }
        
        // Convert patient to DTO
        PatientDTO patientDTO = getPatientById(patient.getPatientId());
        
        // Create and return the appropriate response
        if (isNewPatient) {
            logger.info("Patient registration process completed successfully for new patient");
            return PatientResponseDTO.forNewPatient(patientDTO);
        } else {
            logger.info("Patient visit added successfully for existing patient");
            return PatientResponseDTO.forExistingPatient(patientDTO);
        }
    }

    @Override
    @Transactional
    public PatientDTO updatePatient(String patientId, PatientDTO patientDTO) {
        logger.info("Updating patient with ID: {}", patientId);
        
        if (patientDTO == null) {
            logger.error("Patient update data is null");
            throw new IllegalArgumentException("Patient update data cannot be null");
        }
        
        if (patientId == null || patientId.isEmpty()) {
            logger.error("Patient ID is required for update");
            throw new IllegalArgumentException("Patient ID is required");
        }
        
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
        
        // Update basic fields
        if (patientDTO.getSurname() != null) patient.setSurname(patientDTO.getSurname());
        if (patientDTO.getName() != null) patient.setName(patientDTO.getName());
        if (patientDTO.getFatherName() != null) patient.setFatherName(patientDTO.getFatherName());
        if (patientDTO.getAge() != null) patient.setAge(patientDTO.getAge());
        if (patientDTO.getBloodGroup() != null) patient.setBloodGroup(patientDTO.getBloodGroup());
        if (patientDTO.getGender() != null) patient.setGender(patientDTO.getGender());
        if (patientDTO.getAadharNumber() != null) patient.setAadharNumber(patientDTO.getAadharNumber());
        if (patientDTO.getPhoneNumber() != null) patient.setPhoneNumber(patientDTO.getPhoneNumber());
        if (patientDTO.getAddress() != null) patient.setAddress(patientDTO.getAddress());
        
        // Handle photo if provided
        if (patientDTO.getPhoto() != null && !patientDTO.getPhoto().isEmpty() 
                && patientDTO.getPhoto().startsWith("data:image")) {
            try {
                String base64Image = patientDTO.getPhoto();
                if (base64Image.contains(",")) {
                    base64Image = base64Image.split(",")[1];
                }
                byte[] decodedPhoto = Base64.getDecoder().decode(base64Image);
                patient.setPhoto(decodedPhoto);
            } catch (Exception e) {
                logger.error("Error processing photo: {}", e.getMessage(), e);
                // Continue without updating photo
            }
        }
        
        logger.info("Saving updated patient to database");
        Patient updatedPatient = patientRepository.save(patient);
        logger.info("Patient updated successfully");
        
        return convertToDTO(updatedPatient);
    }

    @Override
    public List<PatientDTO> searchPatients(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllPatients();
        }
        
        List<Patient> patients = patientRepository.findAll();
        
        // Filter patients based on the query
        return patients.stream()
                .filter(patient -> 
                        (patient.getName() != null && 
                         patient.getName().toLowerCase().contains(query.toLowerCase())) ||
                        (patient.getSurname() != null && 
                         patient.getSurname().toLowerCase().contains(query.toLowerCase())) ||
                        (patient.getAadharNumber() != null && 
                         patient.getAadharNumber().contains(query))
                )
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public int updateMissingTemperatureValues() {
        logger.info("Updating missing temperature values for visits");
        
        // Get all visits
        List<Visit> allVisits = visitRepository.findAll();
        int updatedCount = 0;
        
        for (Visit visit : allVisits) {
            if (visit.getTemperature() == null || visit.getTemperature().isEmpty()) {
                // Set a default temperature value based on the visit's status
                if ("Critical".equalsIgnoreCase(visit.getStatus())) {
                    visit.setTemperature("102.2°F");
                } else if ("Active".equalsIgnoreCase(visit.getStatus())) {
                    visit.setTemperature("99.6°F");
                } else {
                    visit.setTemperature("98.6°F");
                }
                
                visitRepository.save(visit);
                updatedCount++;
                logger.info("Updated temperature for visit ID: {} to {}", visit.getVisitId(), visit.getTemperature());
            }
        }
        
        logger.info("Updated temperature values for {} visits", updatedCount);
        return updatedCount;
    }

    // Helper method to convert Patient entity to PatientDTO
    private PatientDTO convertToDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setPatientId(patient.getPatientId());
        dto.setSurname(patient.getSurname());
        dto.setName(patient.getName());
        dto.setFatherName(patient.getFatherName());
        dto.setAge(patient.getAge());
        dto.setBloodGroup(patient.getBloodGroup());
        dto.setGender(patient.getGender());
        dto.setAadharNumber(patient.getAadharNumber());
        dto.setPhoneNumber(patient.getPhoneNumber());
        dto.setAddress(patient.getAddress());
        dto.setTotalVisits(patient.getTotalVisits());
        
        // Set photo as Base64 string if available
        if (patient.getPhoto() != null) {
            dto.setPhoto("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(patient.getPhoto()));
        }
        
        // Retrieve the most recent visit to populate additional fields
        List<Visit> visits = visitRepository.findLatestVisitsByPatientId(patient.getPatientId());
        if (!visits.isEmpty()) {
            Visit latestVisit = visits.get(0);
            dto.setRegNo(latestVisit.getRegNo());
            dto.setOpNo(latestVisit.getOpNo());
            dto.setBp(latestVisit.getBp());
            dto.setWeight(latestVisit.getWeight());
            dto.setTemperature(latestVisit.getTemperature());
            dto.setSymptoms(latestVisit.getSymptoms());
            dto.setComplaints(latestVisit.getComplaint());
            dto.setStatus(latestVisit.getStatus());
            
            if (latestVisit.getVisitDate() != null) {
                dto.setLastVisit(latestVisit.getVisitDate().format(DATE_FORMATTER));
                dto.setVisitDate(latestVisit.getVisitDate().format(DATE_FORMATTER));
                dto.setVisitTime(latestVisit.getVisitDate().format(TIME_FORMATTER));
            }
        }
        
        return dto;
    }
} 