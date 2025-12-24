package com.web.entity;

import com.web.enums.Skill;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_grade_history")
@Getter
@Setter
public class ExamGradeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "result_exam_detail_id")
    private ResultExam resultExam;

    @Enumerated(EnumType.STRING)
    private Skill skill; // LISTENING, SPEAKING, READING, WRITING

    private Float score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private LocalDateTime gradedAt;

    @ManyToOne
    @JoinColumn(name = "grader_id")
    private User grader;
}
