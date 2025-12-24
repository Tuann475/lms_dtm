package com.web.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class
CloudConfig {
    // Đọc từ application.properties để tránh lộ key (free plan vẫn dùng được)
    @Value("${cloudinary.cloudName:}")
    private String cloudName;
    @Value("${cloudinary.apiKey:}")
    private String apiKey;
    @Value("${cloudinary.apiSecret:}")
    private String apiSecret;
    // Nếu muốn dùng unsigned upload (free model) khai báo upload preset
    @Value("${cloudinary.uploadPreset:}")
    private String uploadPreset; // optional

    @Bean
    public Cloudinary cloudinaryConfigs() {
        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new IllegalStateException("Thiếu cấu hình Cloudinary (cloudinary.cloudName/apiKey/apiSecret) trong application.properties");
        }
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        // Có thể thêm secure: true
        config.put("secure", true);
        return new Cloudinary(config);
    }

    private boolean isBlank(String s){ return s == null || s.trim().isEmpty(); }
}