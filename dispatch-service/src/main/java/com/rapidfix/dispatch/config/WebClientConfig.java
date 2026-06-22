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
        return WebClient.builder()
                .baseUrl(technicianServiceUrl)
                .filter((request, next) -> {
                    org.springframework.web.context.request.RequestAttributes attributes = 
                            org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                    if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                        jakarta.servlet.http.HttpServletRequest currentRequest = 
                                ((org.springframework.web.context.request.ServletRequestAttributes) attributes).getRequest();
                        String authHeader = currentRequest.getHeader("Authorization");
                        if (org.springframework.util.StringUtils.hasText(authHeader)) {
                            org.springframework.web.reactive.function.client.ClientRequest newRequest = 
                                    org.springframework.web.reactive.function.client.ClientRequest.from(request)
                                            .header("Authorization", authHeader)
                                            .build();
                            return next.exchange(newRequest);
                        }
                    }
                    return next.exchange(request);
                })
                .build();
    }
}
