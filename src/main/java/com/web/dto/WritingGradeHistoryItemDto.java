package com.web.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WritingGradeHistoryItemDto {
    private Long resultExamId;
    private Long questionId;
    private String questionTitle;
    private Long historyId;
    private Integer score;
    private String feedback;
    private LocalDateTime gradedAt;
    private Long graderId;
    private String graderName;
}

