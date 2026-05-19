package com.rapidfix.technician.config.swagger;
import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;
@Configuration
public class SwaggerConfig {
    @Bean public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info().title("RapidFix Technician Service API").version("1.0")
                .description("Technician management, availability & location for RapidFix"))
            .addSecurityItem(new SecurityRequirement().addList("Bearer"))
            .components(new Components().addSecuritySchemes("Bearer",
                new SecurityScheme().name("Bearer").type(SecurityScheme.Type.HTTP)
                    .scheme("bearer").bearerFormat("JWT")));
    }
}
