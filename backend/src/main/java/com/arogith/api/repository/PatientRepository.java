package com.arogith.api.repository;

import com.arogith.api.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    // Find patient by Aadhar number
    Optional<Patient> findByAadharNumber(String aadharNumber);
    
    // Find patient by Aadhar number and name (case insensitive)
    Optional<Patient> findByAadharNumberAndNameIgnoreCase(String aadharNumber, String name);
} 