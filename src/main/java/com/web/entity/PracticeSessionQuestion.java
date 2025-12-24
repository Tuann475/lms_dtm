package com.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.web.enums.WritingStatus;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_session_question")
@Getter
@Setter
public class PracticeSessionQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    @JsonIgnoreProperties({"questions"})
    private PracticeSession session;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne
    @JoinColumn(name = "answer_id")
    private Answer answer; // đáp án đã chọn trong ôn luyện

    private Boolean correct; // kết quả lựa chọn

    private LocalDateTime answeredAt;

    @Column(columnDefinition = "TEXT")
    private String answerText; // user submitted writing answer

    private Integer manualScore; // optional practice writing score

    @Column(columnDefinition = "TEXT")
    private String feedback; // optional feedback

    @Column(columnDefinition = "TINYINT(1)")
    private Boolean graded = false; // whether writing answer graded

    private Integer writingAttempts = 0; // number of times user submitted writing answer

    @Enumerated(EnumType.STRING)
    private WritingStatus writingStatus = WritingStatus.PENDING; // trạng thái chấm viết

    private Integer practiceScore; // manual score for non-writing skills

    @Column(columnDefinition = "TEXT")
    private String practiceFeedback; // manual feedback for non-writing skills

    @Column(columnDefinition = "TINYINT(1)")
    private Boolean practiceGraded = false; // whether manually graded (non-writing)

    @Column(columnDefinition = "TEXT")
    private String speakingAudio; // latest user speaking audio file path/url

    private Integer speakingAttempts = 0; // number of speaking submissions
}
