package com.arogith.api.service;

import com.arogith.api.dto.DoctorLoginDTO;

public interface DoctorService {
    DoctorLoginDTO authenticateDoctor(DoctorLoginDTO loginRequest);
    DoctorLoginDTO getDoctorById(String doctorId);
    boolean updateDoctorStatus(String doctorId, String status);
} 