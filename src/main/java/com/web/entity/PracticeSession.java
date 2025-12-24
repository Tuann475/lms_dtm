package com.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.web.enums.PracticeMode;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "practice_session")
@Getter
@Setter
public class PracticeSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "result_id")
    private Result result; // tham chiếu bài thi gốc

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime createdDate;
    private LocalDateTime finishedDate;

    private Integer totalQuestions;
    private Integer numAnswered = 0;
    private Integer numCorrect = 0;

    private Boolean completed = false;

    @Enumerated(EnumType.STRING)
    private PracticeMode mode = PracticeMode.WRONG_ONLY;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"session"})
    private List<PracticeSessionQuestion> questions;
}
