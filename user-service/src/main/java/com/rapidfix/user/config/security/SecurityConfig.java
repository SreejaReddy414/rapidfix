package com.rapidfix.user.config.security;

import com.rapidfix.user.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
    //private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/swagger-ui/**",
                    "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**").permitAll()
                .anyRequest().permitAll())
          //  .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
//                .exceptionHandling(ex -> ex
//                        .authenticationEntryPoint((request, response, authException) -> {
//                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                            response.setContentType("application/json");
//                            response.getWriter().write(
//                                    "{\"status\":401,\"message\":\"Missing or invalid token. Please login first.\"}"
//                            );
//                        })
//                        .accessDeniedHandler((request, response, accessDeniedException) -> {
//                            // Check if user is anonymous (no token was sent at all)
//                            var auth = org.springframework.security.core.context.SecurityContextHolder
//                                    .getContext().getAuthentication();
//                            boolean isAnonymous = auth == null ||
//                                    auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken;
//
//                            if (isAnonymous) {
//                                // No token sent — return 401
//                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                                response.setContentType("application/json");
//                                response.getWriter().write(
//                                        "{\"status\":401,\"message\":\"Missing or invalid token. Please login first.\"}"
//                                );
//                            } else {
//                                // Token valid but wrong role — return 403
//                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
//                                response.setContentType("application/json");
//                                response.getWriter().write(
//                                        "{\"status\":403,\"message\":\"Access denied. You don't have permission for this action.\"}"
//                                );
//                            }
//                        })
//                )
                .build();
    }

//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration config = new CorsConfiguration();
//        config.setAllowedOrigins(List.of("http://localhost:3000"));
//        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
//        config.setAllowedHeaders(List.of("*"));
//        config.setAllowCredentials(true);
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", config);
//        return source;
//    }
}
