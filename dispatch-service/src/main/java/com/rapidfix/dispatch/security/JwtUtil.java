package com.rapidfix.dispatch.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component @Slf4j
public class JwtUtil {
    private final SecretKey key;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String extractEmail(String token)  { return getClaims(token).getSubject(); }
    public String extractRole(String token)   { return (String) getClaims(token).get("role"); }
    public String extractName(String token)   { return (String) getClaims(token).get("name"); }  // ← add
    public Long extractUserId(String token) {
        Object id = getClaims(token).get("userId");
        return id != null ? Long.valueOf(id.toString()) : null;
    }

    public boolean validateToken(String token) {
        try { getClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage()); return false; }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }
}