package com.arogith.api.repository;

import com.arogith.api.model.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    
    // Find lab tests by visit ID using the property name directly
    List<LabTest> findByVisitId(Long visitId);
    
    // Find lab tests by visit ID using JPQL to avoid lazy load issues
    @Query("SELECT lt FROM LabTest lt WHERE lt.visitId = :visitId")
    List<LabTest> findLabTestsByVisitId(@Param("visitId") Long visitId);
    
    // Find lab tests by visit ID using native SQL query as fallback
    @Query(value = "SELECT * FROM labtests WHERE visit_id = :visitId", nativeQuery = true)
    List<LabTest> findLabTestsByVisitIdNative(@Param("visitId") Long visitId);
    
    // Comprehensive fallback method that tries various approaches to find tests
    @Query(value = 
        "SELECT t.* FROM labtests t " +
        "WHERE t.visit_id = :visitId " +
        "UNION " +
        "SELECT t.* FROM labtests t " +
        "JOIN visits v ON t.visit_id = v.visit_id " +
        "WHERE v.visit_id = :visitId", 
        nativeQuery = true)
    List<LabTest> findLabTestsByVisitIdComprehensive(@Param("visitId") Long visitId);
    
    // Method to find lab tests by both visit ID and patient ID
    @Query(value = 
        "SELECT t.* FROM labtests t " +
        "WHERE t.visit_id = :visitId AND t.patient_id = :patientId", 
        nativeQuery = true)
    List<LabTest> findByVisitIdAndPatientId(@Param("visitId") Long visitId, @Param("patientId") String patientId);
    
    // Find by patientId directly
    List<LabTest> findByPatientId(String patientId);
    
    // Original method (keeping for compatibility)
    List<LabTest> findByVisitVisitId(Long visitId);
} 