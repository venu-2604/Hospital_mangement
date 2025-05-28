package com.arogith.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patients")
public class Patient {
    
    @Id
    @GeneratedValue(generator = "patient-id-generator")
    @GenericGenerator(
        name = "patient-id-generator",
        strategy = "com.arogith.api.config.PatientIdGenerator"
    )
    @Column(name = "patient_id")
    private String patientId;
    
    @Lob
    @Column(columnDefinition = "bytea")
    private byte[] photo;
    
    @Column(nullable = false, length = 50)
    private String surname;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    @Column(name = "father_name", length = 50)
    private String fatherName;
    
    private Integer age;
    
    @Column(name = "blood_group", length = 5)
    private String bloodGroup;
    
    @Column(length = 10)
    private String gender;
    
    @Column(name = "aadhar_number", unique = true, nullable = false, length = 12)
    private String aadharNumber;
    
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "total_visits")
    private Integer totalVisits = 0;
} 