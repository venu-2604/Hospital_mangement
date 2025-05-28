package com.arogith.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientRegistrationDTO {
    // Patient details
    private String photo; // Base64 encoded string
    
    @NotBlank(message = "Surname is required")
    @Size(max = 100, message = "Surname must be less than 100 characters")
    private String surname;
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    private String fatherName;
    
    @PositiveOrZero(message = "Age must be a positive number or zero")
    private Integer age;
    
    private String bloodGroup;
    
    private String gender;
    
    @NotBlank(message = "Aadhar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhar number must be exactly 12 digits")
    private String aadharNumber;
    
    @Pattern(regexp = "^$|^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;
    
    private String address;
    
    // First visit details
    private String bp;
    private String weight;
    private String temperature;
    private String symptoms;
    private String complaint;
    private String status;
} 