package com.web.dto;

public class PracticeSessionDto {
    private Long id;
    private Long resultId;
    private Long examId;
    private String examName; // added: exam name for faster client display
    private Integer totalQuestions;
    private Integer numAnswered;
    private Integer numCorrect;
    private Boolean completed;
    private String mode;
    private String createdDate; // ISO string
    private String finishedDate; // ISO string
    private Long durationSeconds; // finished - created
    private Float percentCorrect; // numCorrect / total * 100
    private Integer writingTotal;
    private Integer writingAnswered;
    private Integer writingPending;
    private Long userId;
    private String username;
    private String fullName;

    // NEW: flags to indicate whether all Reading/Listening FILL questions have been graded
    private Boolean readingFillGradedCompleted;
    private Boolean listeningFillGradedCompleted;
    private Float overallBand; // overall band for this practice session (0-9)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getNumAnswered() {
        return numAnswered;
    }

    public void setNumAnswered(Integer numAnswered) {
        this.numAnswered = numAnswered;
    }

    public Integer getNumCorrect() {
        return numCorrect;
    }

    public void setNumCorrect(Integer numCorrect) {
        this.numCorrect = numCorrect;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(String createdDate) {
        this.createdDate = createdDate;
    }

    public String getFinishedDate() {
        return finishedDate;
    }

    public void setFinishedDate(String finishedDate) {
        this.finishedDate = finishedDate;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Float getPercentCorrect() {
        return percentCorrect;
    }

    public void setPercentCorrect(Float percentCorrect) {
        this.percentCorrect = percentCorrect;
    }

    public Integer getWritingTotal() {
        return writingTotal;
    }

    public void setWritingTotal(Integer writingTotal) {
        this.writingTotal = writingTotal;
    }

    public Integer getWritingAnswered() {
        return writingAnswered;
    }

    public void setWritingAnswered(Integer writingAnswered) {
        this.writingAnswered = writingAnswered;
    }

    public Integer getWritingPending() {
        return writingPending;
    }

    public void setWritingPending(Integer writingPending) {
        this.writingPending = writingPending;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Boolean getReadingFillGradedCompleted() {
        return readingFillGradedCompleted;
    }

    public void setReadingFillGradedCompleted(Boolean readingFillGradedCompleted) {
        this.readingFillGradedCompleted = readingFillGradedCompleted;
    }

    public Boolean getListeningFillGradedCompleted() {
        return listeningFillGradedCompleted;
    }

    public void setListeningFillGradedCompleted(Boolean listeningFillGradedCompleted) {
        this.listeningFillGradedCompleted = listeningFillGradedCompleted;
    }

    public Float getOverallBand() {
        return overallBand;
    }

    public void setOverallBand(Float overallBand) {
        this.overallBand = overallBand;
    }

    // Backward compatibility alias
    public Long getUserID() {
        return userId;
    }

    public void setUserID(Long userId) {
        this.userId = userId;
    }
}
