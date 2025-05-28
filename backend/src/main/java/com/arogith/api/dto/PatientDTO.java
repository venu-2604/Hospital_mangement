package com.arogith.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Base64;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private String patientId;
    private String photo; // Base64 encoded string
    private String surname;
    private String name;
    private String fatherName;
    private Integer age;
    private String bloodGroup;
    private String gender;
    private String aadharNumber;
    private String phoneNumber;
    private String address;
    private Integer totalVisits;
    private String lastVisit; // Date in string format
    
    // Frontend compatible fields
    private String regNo; // From most recent visit
    private String opNo; // From most recent visit
    private String bp; // From most recent visit
    private String weight; // From most recent visit
    private String temperature; // From most recent visit
    private String symptoms; // From most recent visit
    private String complaints; // From most recent visit
    private String status; // From most recent visit
    private String visitDate; // From most recent visit
    private String visitTime; // From most recent visit
} 