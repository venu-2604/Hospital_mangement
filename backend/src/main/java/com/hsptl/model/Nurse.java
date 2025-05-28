package com.hsptl.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "nurses")
public class Nurse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status;

    // Add other necessary fields like email, phone, etc.
} 