package com.rapidfix.dispatch.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    @Value("${services.technician-service.url}")
    private String technicianServiceUrl;

    @Bean
    public WebClient technicianWebClient() {
        return WebClient.builder().baseUrl(technicianServiceUrl).build();
    }
}
