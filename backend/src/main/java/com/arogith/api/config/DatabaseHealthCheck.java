package com.arogith.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthCheck {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseHealthCheck.class);
    
    private final JdbcTemplate jdbcTemplate;
    
    @Autowired
    public DatabaseHealthCheck(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void checkDatabaseConnection() {
        try {
            logger.info("Checking database connection...");
            
            // Verify connection by running a simple query
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            if (result != null && result == 1) {
                logger.info("✅ Database connection successful");
                
                // Check if tables exist
                checkTablesExist();
            } else {
                logger.error("❌ Database connection test failed with unexpected result");
            }
        } catch (Exception e) {
            logger.error("❌ Database connection failed: {}", e.getMessage(), e);
            logger.error("Please ensure PostgreSQL is running and the credentials in application.properties are correct");
            logger.error("Database URL: {}", jdbcTemplate.getDataSource().toString());
        }
    }
    
    private void checkTablesExist() {
        try {
            // Check patients table
            Integer patientsCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = 'patients'", 
                    Integer.class);
            
            // Check visits table
            Integer visitsCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = 'visits'", 
                    Integer.class);
            
            // Check labtests table
            Integer labTestsCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = 'labtests'", 
                    Integer.class);
            
            logger.info("Tables check: patients={}, visits={}, labtests={}", 
                    patientsCount > 0 ? "✅" : "❌",
                    visitsCount > 0 ? "✅" : "❌",
                    labTestsCount > 0 ? "✅" : "❌");
            
            if (patientsCount == 0 || visitsCount == 0 || labTestsCount == 0) {
                logger.warn("Some tables are missing. Check your schema.sql file and database initialization.");
            }
        } catch (Exception e) {
            logger.error("❌ Error checking tables: {}", e.getMessage());
        }
    }
} 