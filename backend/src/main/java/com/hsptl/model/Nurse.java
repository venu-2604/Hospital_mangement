package com.hsptl.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "nurse")
public class Nurse {
    @Id
    @Column(name = "nurse_id", nullable = false, length = 50)
    private String nurseId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "email", length = 100)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "role", length = 50)
    private String role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
} 