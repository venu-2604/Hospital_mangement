package com.arogith.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DatabaseDebugController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DatabaseDebugController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/schema/labtests")
    public ResponseEntity<Map<String, Object>> getLabTestsSchema() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Get table columns
            String sql = "SELECT column_name, data_type, is_nullable, column_default " +
                         "FROM information_schema.columns " +
                         "WHERE table_name = 'labtests' " +
                         "ORDER BY ordinal_position";
            
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(sql);
            
            // Get row count
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM labtests", Integer.class);
            
            // Get sample data if available
            List<Map<String, Object>> sampleData = new ArrayList<>();
            if (count != null && count > 0) {
                sampleData = jdbcTemplate.queryForList(
                    "SELECT * FROM labtests LIMIT 3");
            }
            
            result.put("table_name", "labtests");
            result.put("columns", columns);
            result.put("row_count", count);
            result.put("sample_data", sampleData);
            result.put("status", "SUCCESS");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            result.put("error_type", e.getClass().getName());
            
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/test/lab-insert")
    public ResponseEntity<Map<String, Object>> testLabInsert() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Insert a test record directly using SQL
            String insertSql = 
                "INSERT INTO labtests (visit_id, patient_id, test_name, reference_range, status) " +
                "VALUES (1, '001', 'Debug Test', 'N/A', 'pending') RETURNING test_id";
            
            Long testId = jdbcTemplate.queryForObject(insertSql, Long.class);
            
            result.put("status", "SUCCESS");
            result.put("message", "Test record inserted successfully");
            result.put("test_id", testId);
            
            // Retrieve the inserted record
            String selectSql = "SELECT * FROM labtests WHERE test_id = ?";
            Map<String, Object> insertedRecord = jdbcTemplate.queryForMap(selectSql, testId);
            result.put("inserted_record", insertedRecord);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            result.put("error_type", e.getClass().getName());
            
            return ResponseEntity.status(500).body(result);
        }
    }

    @PostMapping("/direct-insert")
    public ResponseEntity<Map<String, Object>> directInsertLabTest(@RequestBody Map<String, Object> labTestData) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Extract values from request
            Number visitId = (Number) labTestData.getOrDefault("visit_id", 1);
            String patientId = (String) labTestData.getOrDefault("patient_id", "000");
            String testName = (String) labTestData.getOrDefault("test_name", "Unknown Test");
            String referenceRange = (String) labTestData.getOrDefault("reference_range", "Pending");
            String status = (String) labTestData.getOrDefault("status", "pending");
            String result1 = (String) labTestData.getOrDefault("result", "");
            
            // Log the received data
            System.out.println("Direct insert called with data: " + labTestData);
            
            // Build SQL with parameters to prevent SQL injection
            String insertSql = 
                "INSERT INTO labtests (visit_id, patient_id, test_name, reference_range, status, result) " +
                "VALUES (?, ?, ?, ?, ?, ?) RETURNING test_id";
            
            Long testId = jdbcTemplate.queryForObject(
                insertSql, 
                Long.class,
                visitId.longValue(),
                patientId,
                testName,
                referenceRange,
                status,
                result1
            );
            
            result.put("status", "SUCCESS");
            result.put("message", "Record inserted successfully");
            result.put("test_id", testId);
            
            // Retrieve the inserted record
            String selectSql = "SELECT * FROM labtests WHERE test_id = ?";
            Map<String, Object> insertedRecord = jdbcTemplate.queryForMap(selectSql, testId);
            result.put("inserted_record", insertedRecord);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            result.put("error_type", e.getClass().getName());
            result.put("received_data", labTestData);
            
            return ResponseEntity.status(500).body(result);
        }
    }
} 