package com.hsptl.repository;

import com.hsptl.model.Nurse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NurseRepository extends JpaRepository<Nurse, Long> {
    List<Nurse> findByStatus(String status);
} 