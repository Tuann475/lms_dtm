package com.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FillSubmissionDto {
    private Long questionId; // question ID for FILL type
    private String answerText; // user typed answer
}

