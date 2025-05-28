package com.arogith.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "labtests")
public class LabTest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Long testId;
    
    @Column(name = "visit_id")
    private Long visitId;
    
    @Column(name = "patient_id", length = 10)
    private String patientId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", referencedColumnName = "visit_id", insertable = false, updatable = false)
    private Visit visit;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "patient_id", insertable = false, updatable = false)
    private Patient patient;
    
    @Column(name = "test_name", length = 100)
    private String testName;
    
    @Column(length = 100)
    private String result;
    
    @Column(name = "reference_range", length = 100)
    private String referenceRange;
    
    @Column(length = 20)
    private String status;
    
    @Column(name = "test_given_at")
    private LocalDateTime testGivenAt;
    
    @Column(name = "result_updated_at")
    private LocalDateTime resultUpdatedAt;
} 