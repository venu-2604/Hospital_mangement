package com.arogith.api.dto;

import java.time.LocalDateTime;

/**
 * Public doctor fields for admin lists (never includes password).
 */
public class DoctorSummaryDTO {
    private String doctorId;
    private String name;
    private String email;
    private String role;
    private String status;
    private String department;
    private LocalDateTime createdAt;

    public DoctorSummaryDTO() {
    }

    public DoctorSummaryDTO(String doctorId, String name, String email, String role, String status,
            String department, LocalDateTime createdAt) {
        this.doctorId = doctorId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.department = department;
        this.createdAt = createdAt;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
