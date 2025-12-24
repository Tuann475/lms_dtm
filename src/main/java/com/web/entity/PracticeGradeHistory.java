package com.web.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "practice_grade_history")
public class PracticeGradeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "psq_id", nullable = false)
    private Long psqId;

    @Column(name = "score")
    private Integer score;

    @Column(name = "feedback", length = 2000)
    private String feedback;

    @Column(name = "grader_id")
    private Long graderId;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPsqId() { return psqId; }
    public void setPsqId(Long psqId) { this.psqId = psqId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public Long getGraderId() { return graderId; }
    public void setGraderId(Long graderId) { this.graderId = graderId; }

    public LocalDateTime getGradedAt() { return gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }
}
