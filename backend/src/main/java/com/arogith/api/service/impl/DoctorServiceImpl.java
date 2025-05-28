package com.arogith.api.service.impl;

import com.arogith.api.dto.DoctorLoginDTO;
import com.arogith.api.model.Doctor;
import com.arogith.api.repository.DoctorRepository;
import com.arogith.api.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    @Autowired
    public DoctorServiceImpl(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    public DoctorLoginDTO authenticateDoctor(DoctorLoginDTO loginRequest) {
        Optional<Doctor> doctorOptional = doctorRepository.findByDoctorId(loginRequest.getDoctorId());
        
        if (doctorOptional.isPresent()) {
            Doctor doctor = doctorOptional.get();
            
            // Check if password matches
            // In a real application, you would use a proper password encoder
            if (doctor.getPassword().equals(loginRequest.getPassword())) {
                return new DoctorLoginDTO(
                    doctor.getDoctorId(),
                    doctor.getName(),
                    doctor.getEmail(),
                    doctor.getRole(),
                    doctor.getStatus(),
                    doctor.getDepartment(),
                    true,
                    "Authentication successful"
                );
            } else {
                return new DoctorLoginDTO(
                    doctor.getDoctorId(),
                    doctor.getName(),
                    doctor.getEmail(),
                    doctor.getRole(),
                    doctor.getStatus(),
                    doctor.getDepartment(),
                    false,
                    "Invalid password"
                );
            }
        } else {
            return new DoctorLoginDTO(
                loginRequest.getDoctorId(),
                null,
                null,
                null,
                null,
                null,
                false,
                "Doctor ID not found"
            );
        }
    }

    @Override
    public DoctorLoginDTO getDoctorById(String doctorId) {
        Optional<Doctor> doctorOptional = doctorRepository.findByDoctorId(doctorId);
        
        if (doctorOptional.isPresent()) {
            Doctor doctor = doctorOptional.get();
            System.out.println("Fetched doctor: status=" + doctor.getStatus() + ", department=" + doctor.getDepartment());
            return new DoctorLoginDTO(
                doctor.getDoctorId(),
                doctor.getName(),
                doctor.getEmail(),
                doctor.getRole(),
                doctor.getStatus(),
                doctor.getDepartment(),
                true,
                null
            );
        } else {
            return new DoctorLoginDTO(
                doctorId,
                null,
                null,
                null,
                null,
                null,
                false,
                "Doctor not found"
            );
        }
    }

    @Override
    public boolean updateDoctorStatus(String doctorId, String status) {
        Optional<Doctor> doctorOptional = doctorRepository.findByDoctorId(doctorId);
        if (doctorOptional.isPresent()) {
            Doctor doctor = doctorOptional.get();
            System.out.println("Updating status for doctorId=" + doctorId + " to " + status);
            doctor.setStatus(status);
            doctorRepository.save(doctor);
            return true;
        }
        System.out.println("Doctor not found for doctorId=" + doctorId);
        return false;
    }
} 