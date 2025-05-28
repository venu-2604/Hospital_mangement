package com.arogith.api.config;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Custom ID generator for Patient entities that formats IDs as padded numbers
 * This matches the PostgreSQL LPAD(NEXTVAL('patient_id_seq')::TEXT, 3, '0') format
 */
public class PatientIdGenerator implements IdentifierGenerator {

    private static final Logger logger = LoggerFactory.getLogger(PatientIdGenerator.class);
    
    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        Connection connection = null;
        try {
            connection = session.getJdbcConnectionAccess().obtainConnection();
            
            // Get the next value from the patient_id_seq
            try (PreparedStatement ps = connection.prepareStatement("SELECT NEXTVAL('patient_id_seq')");
                 ResultSet rs = ps.executeQuery()) {
                
                if (rs.next()) {
                    long nextValue = rs.getLong(1);
                    // Format it with leading zeros (3 digits)
                    String formattedId = String.format("%03d", nextValue);
                    logger.info("Generated patient ID: {}", formattedId);
                    return formattedId;
                }
            }
            throw new HibernateException("Failed to generate patient ID from sequence");
        } catch (SQLException e) {
            logger.error("Error generating patient ID: {}", e.getMessage(), e);
            throw new HibernateException("Error generating patient ID", e);
        } finally {
            if (connection != null) {
                try {
                    session.getJdbcConnectionAccess().releaseConnection(connection);
                } catch (SQLException e) {
                    logger.error("Error releasing JDBC connection: {}", e.getMessage(), e);
                }
            }
        }
    }
} 