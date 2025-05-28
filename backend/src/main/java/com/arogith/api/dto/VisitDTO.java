package com.arogith.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitDTO {
    private Long visitId;
    private String patientId;
    private String doctorId;
    private String doctorName;
    private String opNo;
    private String regNo;
    private String bp;
    private String weight;
    private String temperature;
    private String symptoms;
    private String complaint;
    private String status;
    private String prescription;
    private String notes;
    private String visitDate; // Date in string format (yyyy-MM-dd)
    private String visitTime; // Time in string format (HH:mm)
    private List<LabTestDTO> labTests;
}