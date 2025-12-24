package com.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WritingAnswerDto {
    private Long id; // resultExam id
    private Long questionId;
    private String questionTitle;
    private String answerText;
    private Float manualScore; // dùng Float để giữ band .5 chính xác
    private String feedback;
    private Boolean graded;
    private String writingType;
}
