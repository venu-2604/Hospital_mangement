package com.arogith.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.cors.CorsRegistry;
import org.springframework.web.cors.WebMvcConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final WebMvcConfigurer webMvcConfigurer;

    @Autowired
    public SecurityConfig(WebMvcConfigurer webMvcConfigurer) {
        this.webMvcConfigurer = webMvcConfigurer;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf().disable()
            .authorizeHttpRequests()
            .anyRequest().permitAll();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsRegistry registry = new CorsRegistry();
        webMvcConfigurer.addCorsMappings(registry);
        registry.getMappings().forEach(mapping -> {
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowedOrigins(mapping.getAllowedOrigins());
            config.setAllowedMethods(mapping.getAllowedMethods());
            config.setAllowedHeaders(mapping.getAllowedHeaders());
            config.setAllowCredentials(mapping.getAllowCredentials());
            config.setMaxAge(mapping.getMaxAge());
            source.registerCorsConfiguration(mapping.getPathPattern(), config);
        });
        return source;
    }
} 