package com.web.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "speaking_submission")
@Getter
@Setter
public class SpeakingSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long examId; // link to exam

    private Long questionId; // optional specific speaking question

    private Long userId; // user who submitted

    private Long practiceSessionId; // optional link to practice session (ôn luyện)

    private String audioPath; // stored relative path or URL (local or cloud URL)

    private Timestamp createdDate;

    private Timestamp updatedDate;

    private String status; // PENDING, PROCESSING, SCORED, UPLOADED_CLOUD

    private String cloudinaryPublicId; // public_id of uploaded asset
    private String cloudinaryUrl; // secure URL returned by Cloudinary
    private Integer durationSeconds; // duration reported by client (optional)
}
