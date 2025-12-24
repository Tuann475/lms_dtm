package com.web.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WritingGradeHistoryDto {
    private Long id;
    private Integer score;
    private String feedback;
    private LocalDateTime gradedAt;
    private Long graderId;
    private String graderName;
}

