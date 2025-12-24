package com.web.config;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.UUID;

@Component
public class CorsFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CorsFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-Id");
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString();
            response.setHeader("X-Correlation-Id", correlationId);
        }
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Correlation-Id");
        response.addHeader("Access-Control-Expose-Headers", "Authorization, X-Correlation-Id");
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            log.debug("[CORS][Preflight] method=OPTIONS path={} correlationId={}", request.getRequestURI(), correlationId);
            return;
        }
        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("[CORS][ChainError] path={} correlationId={} msg={}", request.getRequestURI(), correlationId, e.getMessage(), e);
            throw e;
        }
    }
}
