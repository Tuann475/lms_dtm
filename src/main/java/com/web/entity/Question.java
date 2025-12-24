package com.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "question")
@Getter
@Setter
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    private String title;

    @ManyToOne
    @JoinColumn(name = "lession_id")
    @JsonIgnoreProperties(value = {"questions"})
    private Lesson lesson;

    @OneToMany(mappedBy = "question", cascade = CascadeType.REMOVE)
    private List<Answer> answers;

    private String linkAudio; // generated or uploaded audio for SPEAKING
    @Column(length=2000)
    private String speakingNote; // optional prompt/notes for speaking
    private String speakingVoice; // ElevenLabs voice ID
    private String questionType; // MCQ, FILL, INPUT, SHORT_ANSWER, etc.
}
