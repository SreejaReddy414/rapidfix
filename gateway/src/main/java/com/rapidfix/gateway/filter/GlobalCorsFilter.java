package com.rapidfix.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class GlobalCorsFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        ServerHttpResponse response = exchange.getResponse();

        // Handle OPTIONS preflight immediately
        if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            response.getHeaders().set("Access-Control-Allow-Origin", "http://localhost:3000");
            response.getHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.getHeaders().set("Access-Control-Allow-Headers", "*");
            response.getHeaders().set("Access-Control-Allow-Credentials", "true");
            response.getHeaders().set("Access-Control-Max-Age", "3600");
            response.setStatusCode(HttpStatus.OK);
            return response.setComplete();
        }

        // For all other requests, add CORS headers before response is sent
        response.beforeCommit(() -> {
            response.getHeaders().set("Access-Control-Allow-Origin", "http://localhost:3000");
            response.getHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.getHeaders().set("Access-Control-Allow-Headers", "*");
            response.getHeaders().set("Access-Control-Allow-Credentials", "true");
            return Mono.empty();
        });

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}