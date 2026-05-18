package com.arogith.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = { "com.arogith.api", "com.hsptl" })
@EntityScan(basePackages = { "com.arogith.api.model", "com.hsptl.model" })
@EnableJpaRepositories(basePackages = { "com.arogith.api.repository", "com.hsptl.repository" })
public class ArogithApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ArogithApiApplication.class, args);
    }
} 