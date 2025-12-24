package com.web.dto;

import java.sql.Timestamp;

public class SpeakingSubmissionDto {
    private Long id;
    private Long examId;
    private Long questionId;
    private Long userId;
    private Long practiceSessionId;
    private String audioPath;
    private String cloudinaryUrl;
    private String cloudinaryPublicId;
    private Integer durationSeconds;
    private Long fileSizeBytes;
    private Float score;
    private String transcript;
    private String status;
    private Timestamp createdDate;
    private Timestamp updatedDate;
    // Question enrichment
    private String questionTitle;
    private String questionLinkAudio; // audio của đề (prompt audio)
    private String speakingNote; // ghi chú / prompt text

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getPracticeSessionId() { return practiceSessionId; }
    public void setPracticeSessionId(Long practiceSessionId) { this.practiceSessionId = practiceSessionId; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getCloudinaryUrl() { return cloudinaryUrl; }
    public void setCloudinaryUrl(String cloudinaryUrl) { this.cloudinaryUrl = cloudinaryUrl; }
    public String getCloudinaryPublicId() { return cloudinaryPublicId; }
    public void setCloudinaryPublicId(String cloudinaryPublicId) { this.cloudinaryPublicId = cloudinaryPublicId; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public Float getScore() { return score; }
    public void setScore(Float score) { this.score = score; }
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Timestamp getCreatedDate() { return createdDate; }
    public void setCreatedDate(Timestamp createdDate) { this.createdDate = createdDate; }
    public Timestamp getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Timestamp updatedDate) { this.updatedDate = updatedDate; }
    public String getQuestionTitle() { return questionTitle; }
    public void setQuestionTitle(String questionTitle) { this.questionTitle = questionTitle; }
    public String getQuestionLinkAudio() { return questionLinkAudio; }
    public void setQuestionLinkAudio(String questionLinkAudio) { this.questionLinkAudio = questionLinkAudio; }
    public String getSpeakingNote() { return speakingNote; }
    public void setSpeakingNote(String speakingNote) { this.speakingNote = speakingNote; }
}

