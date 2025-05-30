package com.arogith.api.controller;

import com.arogith.api.dto.DoctorLoginDTO;
import com.arogith.api.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final DoctorService doctorService;

    @Autowired
    public AuthController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping("/login")
    public ResponseEntity<DoctorLoginDTO> login(@RequestBody DoctorLoginDTO loginRequest) {
        DoctorLoginDTO response = doctorService.authenticateDoctor(loginRequest);
        if (response.isAuthenticated()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<DoctorLoginDTO> getDoctorProfile(@PathVariable String doctorId) {
        DoctorLoginDTO response = doctorService.getDoctorById(doctorId);
        if (response.isAuthenticated()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(404).body(response);
        }
    }

    @PutMapping("/doctor/{doctorId}/status")
    public ResponseEntity<String> updateDoctorStatus(@PathVariable String doctorId, @RequestParam String status) {
        System.out.println("Received status update for doctorId=" + doctorId + ", status=" + status);
        boolean updated = doctorService.updateDoctorStatus(doctorId, status);
        if (updated) {
            return ResponseEntity.ok("Status updated successfully");
        } else {
            return ResponseEntity.status(404).body("Doctor not found");
        }
    }
} 