package com.web.dto;

import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
public class SpeakingAnswerDto {
    private Long id;
    private Long examId;
    private Long questionId;
    private String questionTitle;
    private Long userId;
    private String audioPath;
    private String cloudinaryUrl;
    private Float score;
    private String transcript;
    private Timestamp createdDate;
    private Timestamp updatedDate;
    private String status;
    private Boolean graded;
    private String feedback;
    private Integer durationSeconds;
    private String questionLinkAudio; // audio của đề (prompt)
    private String speakingNote; // ghi chú đề speaking
    private String linkAudio; // backward compatibility alias -> same as questionLinkAudio
    private Integer speakingAttempts;
}
