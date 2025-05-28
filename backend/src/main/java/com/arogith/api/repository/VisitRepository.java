package com.arogith.api.repository;

import com.arogith.api.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    
    // Find visits by patient ID with doctor information
    @Query("SELECT v FROM Visit v LEFT JOIN FETCH v.doctor WHERE v.patientId = :patientId")
    List<Visit> findByPatientPatientId(@Param("patientId") String patientId);
    
    // Find visits with lab tests and doctor using JOIN query
    @Query("SELECT DISTINCT v FROM Visit v LEFT JOIN FETCH v.labTests LEFT JOIN FETCH v.doctor WHERE v.patientId = :patientId ORDER BY v.visitDate DESC")
    List<Visit> findVisitsWithLabTestsByPatientId(@Param("patientId") String patientId);
    
    // For today's visits with doctor information
    @Query(value = "SELECT v.* FROM visits v LEFT JOIN doctor d ON v.doctor_id = d.doctor_id WHERE CAST(v.visit_date AS DATE) = CURRENT_DATE", nativeQuery = true)
    List<Visit> findTodayVisits();
    
    // For yesterday's visits with doctor information
    @Query(value = "SELECT v.* FROM visits v LEFT JOIN doctor d ON v.doctor_id = d.doctor_id WHERE CAST(v.visit_date AS DATE) = CURRENT_DATE - INTERVAL '1 day'", nativeQuery = true)
    List<Visit> findYesterdayVisits();
    
    // Find most recent visit by patient ID with doctor information
    @Query(value = "SELECT v.* FROM visits v LEFT JOIN doctor d ON v.doctor_id = d.doctor_id WHERE v.patient_id = :patientId ORDER BY v.visit_date DESC LIMIT 1", nativeQuery = true)
    List<Visit> findLatestVisitsByPatientId(@Param("patientId") String patientId);
    
    // Find visits between dates with doctor information
    @Query(value = "SELECT v.* FROM visits v LEFT JOIN doctor d ON v.doctor_id = d.doctor_id WHERE v.visit_date BETWEEN :startDate AND :endDate", nativeQuery = true)
    List<Visit> findByVisitDateBetween(@Param("startDate") LocalDateTime start, @Param("endDate") LocalDateTime end);

    // Find visits by doctor ID
    @Query(value = "SELECT v.* FROM visits v LEFT JOIN doctor d ON v.doctor_id = d.doctor_id WHERE v.doctor_id = :doctorId", nativeQuery = true)
    List<Visit> findByDoctorId(@Param("doctorId") String doctorId);
} 