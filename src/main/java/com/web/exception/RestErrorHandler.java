package com.web.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Instant;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.multipart.MaxUploadSizeExceededException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class RestErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(RestErrorHandler.class);

    private Map<String,Object> buildBody(HttpStatus status, String message, String path, String traceId){
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "path", path,
                "traceId", traceId
        );
    }

    @ExceptionHandler(MessageException.class)
    @ResponseStatus(HttpStatus.EXPECTATION_FAILED)
    @ResponseBody
    public Object processValidationError(MessageException ex, HttpServletRequest request) {
        String msg = ex.getDefaultMessage();
        String traceId = request.getHeader("X-Correlation-Id");
        log.warn("[Error][MessageException] path={} msg={} traceId={}", request.getRequestURI(), msg, traceId);
        return buildBody(HttpStatus.EXPECTATION_FAILED, msg, request.getRequestURI(), traceId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Object illegalArgument(IllegalArgumentException ex, HttpServletRequest request){
        String traceId = request.getHeader("X-Correlation-Id");
        log.warn("[Error][IllegalArgument] path={} msg={} traceId={}", request.getRequestURI(), ex.getMessage(), traceId);
        return buildBody(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI(), traceId);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    @ResponseBody
    public Object uploadTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest request){
        String traceId = request.getHeader("X-Correlation-Id");
        log.warn("[Error][MaxUpload] path={} msg={} traceId={}", request.getRequestURI(), ex.getMessage(), traceId);
        return buildBody(HttpStatus.PAYLOAD_TOO_LARGE, "Kích thước file vượt quá giới hạn", request.getRequestURI(), traceId);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public Object generic(Exception ex, HttpServletRequest request){
        String traceId = request.getHeader("X-Correlation-Id");
        log.error("[Error][Generic] path={} msg={} traceId={}", request.getRequestURI(), ex.getMessage(), traceId, ex);
        return buildBody(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống", request.getRequestURI(), traceId);
    }
}
