package com.arogith.api.controller;

import com.arogith.api.dto.DoctorSummaryDTO;
import com.arogith.api.dto.DoctorCreateDTO;
import com.arogith.api.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    @Autowired
    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<List<DoctorSummaryDTO>> listDoctors() {
        return ResponseEntity.ok(doctorService.findAllDoctors());
    }

    @PostMapping
    public ResponseEntity<DoctorSummaryDTO> createDoctor(@RequestBody DoctorCreateDTO request) {
        return ResponseEntity.ok(doctorService.createDoctor(request));
    }
}
