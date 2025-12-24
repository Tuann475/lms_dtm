package com.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillAnswerDto {
    private Long id;
    private Long resultExamId;
    private Long questionId;
    private String questionTitle;
    private String questionContent;
    private String userAnswer;
    private Float score;
    private String feedback;
    private Boolean graded;
    private String skill;
    private Long selectedAnswerId; // answers_id in result_exam_detail
    private String answerText;     // raw answer_text in result_exam_detail
}
