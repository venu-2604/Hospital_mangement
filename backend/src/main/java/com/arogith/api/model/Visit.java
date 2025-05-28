package com.arogith.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "visits")
public class Visit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "visit_id")
    private Long visitId;
    
    @Column(name = "patient_id", length = 10)
    private String patientId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "patient_id", insertable = false, updatable = false)
    private Patient patient;
    
    @Column(name = "doctor_id", length = 50)
    private String doctorId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "doctor_id", insertable = false, updatable = false)
    private Doctor doctor;
    
    @Column(name = "op_no", length = 10)
    private String opNo;
    
    @Column(name = "reg_no", length = 10)
    private String regNo;
    
    @Column(length = 10)
    private String bp;
    
    @Column(length = 10)
    private String weight;
    
    @Column(length = 10)
    private String temperature;
    
    @Column(name = "symptoms", columnDefinition = "TEXT")
    private String symptoms;
    
    @Column(columnDefinition = "TEXT")
    private String complaint;
    
    @Column(length = 10)
    private String status;
    
    @Column(columnDefinition = "TEXT")
    private String prescription;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "visit_date")
    private LocalDateTime visitDate;
    
    @OneToMany(mappedBy = "visit", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<LabTest> labTests = new ArrayList<>();
} 