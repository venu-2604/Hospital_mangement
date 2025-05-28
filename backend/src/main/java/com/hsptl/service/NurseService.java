package com.hsptl.service;

import com.hsptl.model.Nurse;
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
} 