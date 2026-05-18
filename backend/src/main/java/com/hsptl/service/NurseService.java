package com.hsptl.service;

import com.hsptl.model.Nurse;
import com.hsptl.dto.NurseCreateDTO;
import com.hsptl.repository.NurseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NurseService {
    
    private final NurseRepository nurseRepository;

    @Autowired
    public NurseService(NurseRepository nurseRepository) {
        this.nurseRepository = nurseRepository;
    }

    public List<Nurse> getActiveNurses() {
        return nurseRepository.findByStatus("Active");
    }

    public List<Nurse> getAllNurses() {
        return nurseRepository.findAll();
    }

    public Nurse createNurse(NurseCreateDTO createRequest) {
        Nurse nurse = new Nurse();
        nurse.setNurseId(generateNurseId());
        nurse.setName(createRequest.getName());
        nurse.setEmail(createRequest.getEmail());
        nurse.setPassword(createRequest.getPassword());
        nurse.setRole(createRequest.getRole() != null ? createRequest.getRole() : "NURSE");
        nurse.setStatus(createRequest.getStatus() != null ? createRequest.getStatus() : "Active");
        return nurseRepository.save(nurse);
    }

    private String generateNurseId() {
        String id;
        do {
            id = "N" + System.currentTimeMillis();
        } while (nurseRepository.existsByNurseId(id));
        return id;
    }
} 