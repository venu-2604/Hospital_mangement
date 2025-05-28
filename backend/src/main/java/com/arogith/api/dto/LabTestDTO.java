package com.arogith.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LabTestDTO {
    private Long testId;
    private Long visitId;
    private String patientId;
    private String name;
    private String result;
    private String referenceRange;
    private String status;
    private LocalDateTime testGivenAt;
    private LocalDateTime resultUpdatedAt;
    
    // Additional fields for frontend display
    private String formattedTestDate;
    private String formattedResultDate;
    
    // Accessor methods for name compatibility
    public String getTestName() {
        return this.name;
    }
    
    public void setTestName(String testName) {
        this.name = testName;
    }
    
    // Explicit accessors for timestamp fields in snake_case format
    public LocalDateTime getTest_given_at() {
        return this.testGivenAt;
    }
    
    public void setTest_given_at(LocalDateTime test_given_at) {
        this.testGivenAt = test_given_at;
    }
    
    public LocalDateTime getResult_updated_at() {
        return this.resultUpdatedAt;
    }
    
    public void setResult_updated_at(LocalDateTime result_updated_at) {
        this.resultUpdatedAt = result_updated_at;
    }
} 