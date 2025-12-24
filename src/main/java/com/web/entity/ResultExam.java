package com.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "result_exam_detail")
@Getter
@Setter
public class ResultExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "answers_id")
    private Answer answer;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question; // for writing questions or redundancy for answer questions

    @Column(columnDefinition = "TEXT")
    private String answerText; // user submitted writing answer

    private Float manualScore; // manual score assigned by admin (Writing/other skills)

    @Column(columnDefinition = "TEXT")
    private String feedback; // admin feedback

    @Column(columnDefinition = "TINYINT(1)")
    private Boolean graded = false; // whether admin graded this writing answer

    @ManyToOne(cascade = CascadeType.ALL)  // Đảm bảo sử dụng CascadeType.REMOVE
    @JoinColumn(name = "result_id")
    @JsonIgnoreProperties(value = {"resultExams"})
    private Result result;

    @Version
    private Long version;

    @Column(name = "speaking_audio_public_id")
    private String speakingAudioPublicId; // optional cloud public_id

    @OneToMany(mappedBy = "resultExam", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("resultExam")
    private List<ExamGradeHistory> gradeHistories; // lịch sử chấm điểm
}
