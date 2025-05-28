package com.arogith.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponseDTO {
    private PatientDTO patient;
    private boolean isNewPatient;
    private String message;
    
    public static PatientResponseDTO forNewPatient(PatientDTO patient) {
        return new PatientResponseDTO(
            patient,
            true,
            "New patient created successfully with ID: " + patient.getPatientId()
        );
    }
    
    public static PatientResponseDTO forExistingPatient(PatientDTO patient) {
        return new PatientResponseDTO(
            patient,
            false,
            "Added new visit for existing patient with ID: " + patient.getPatientId()
        );
    }
} 