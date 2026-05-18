package com.arogith.api.service;

import com.arogith.api.dto.DoctorLoginDTO;
import com.arogith.api.dto.DoctorSummaryDTO;
import com.arogith.api.dto.DoctorCreateDTO;

import java.util.List;

public interface DoctorService {
    DoctorLoginDTO authenticateDoctor(DoctorLoginDTO loginRequest);
    DoctorLoginDTO getDoctorById(String doctorId);
    boolean updateDoctorStatus(String doctorId, String status);
    List<DoctorSummaryDTO> findAllDoctors();
    DoctorSummaryDTO createDoctor(DoctorCreateDTO createRequest);
} 