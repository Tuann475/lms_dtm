package com.web.dto;

public class PracticeUserSummaryDto {
    private Long userId;
    private String username;
    private String fullName;
    private Integer numSessions; // total practice sessions for exam
    private Integer totalQuestions; // sum of totalQuestions across sessions
    private Integer totalAnswered; // sum of numAnswered
    private Integer totalCorrect; // sum of numCorrect
    private Float percentCorrectOverall; // totalCorrect / totalQuestions *100
    private Integer writingSubmitted; // writing answers submitted
    private Integer writingPending; // submitted but not graded
    private Integer writingGraded; // submitted and graded
    // Skill availability on the exam
    private Boolean hasReading;
    private Boolean hasListening;
    private Boolean hasSpeaking;
    private Boolean hasWriting;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Integer getNumSessions() { return numSessions; }
    public void setNumSessions(Integer numSessions) { this.numSessions = numSessions; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getTotalAnswered() { return totalAnswered; }
    public void setTotalAnswered(Integer totalAnswered) { this.totalAnswered = totalAnswered; }
    public Integer getTotalCorrect() { return totalCorrect; }
    public void setTotalCorrect(Integer totalCorrect) { this.totalCorrect = totalCorrect; }
    public Float getPercentCorrectOverall() { return percentCorrectOverall; }
    public void setPercentCorrectOverall(Float percentCorrectOverall) { this.percentCorrectOverall = percentCorrectOverall; }
    public Integer getWritingSubmitted() { return writingSubmitted; }
    public void setWritingSubmitted(Integer writingSubmitted) { this.writingSubmitted = writingSubmitted; }
    public Integer getWritingPending() { return writingPending; }
    public void setWritingPending(Integer writingPending) { this.writingPending = writingPending; }
    public Integer getWritingGraded() { return writingGraded; }
    public void setWritingGraded(Integer writingGraded) { this.writingGraded = writingGraded; }

    public Boolean getHasReading() { return hasReading; }
    public void setHasReading(Boolean hasReading) { this.hasReading = hasReading; }
    public Boolean getHasListening() { return hasListening; }
    public void setHasListening(Boolean hasListening) { this.hasListening = hasListening; }
    public Boolean getHasSpeaking() { return hasSpeaking; }
    public void setHasSpeaking(Boolean hasSpeaking) { this.hasSpeaking = hasSpeaking; }
    public Boolean getHasWriting() { return hasWriting; }
    public void setHasWriting(Boolean hasWriting) { this.hasWriting = hasWriting; }
}
