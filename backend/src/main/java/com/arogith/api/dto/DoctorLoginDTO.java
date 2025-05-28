package com.arogith.api.dto;

public class DoctorLoginDTO {
    // Login request
    private String doctorId;
    private String password;
    
    // Login response
    private String name;
    private String email;
    private String role;
    private String status;
    private String department;
    private boolean authenticated;
    private String message;

    // Default constructor
    public DoctorLoginDTO() {
    }

    // Constructor for request
    public DoctorLoginDTO(String doctorId, String password) {
        this.doctorId = doctorId;
        this.password = password;
    }

    // Constructor for response
    public DoctorLoginDTO(String doctorId, String name, String email, String role, String status, String department, boolean authenticated, String message) {
        this.doctorId = doctorId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.department = department;
        this.authenticated = authenticated;
        this.message = message;
    }

    // Getters and Setters
    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
} 