package com.web.dto;

import java.util.List;

public class PracticeQuestionDto {
    private Long id;
    private String title;
    private List<PracticeAnswerDto> answers;
    private Boolean answered; // đã trả lời trong phiên ôn luyện
    private Boolean correct; // nếu đã trả lời, đúng/sai
    private Long selectedAnswerId;
    private Long lessonId;
    private String lessonName;
    private String writingType;
    private String answerText;
    private Integer manualScore;
    private String feedback;
    private Boolean graded;
    private Integer writingAttempts;
    private String writingStatus; // PENDING / GRADED
    private Long userId;
    private String username;
    private String skill; // SPEAKING / WRITING / READING / LISTENING for UI rendering
    private String linkAudio; // audio prompt for speaking question
    private String speakingNote; // optional note/prompt
    private Integer practiceScore;
    private String practiceFeedback;
    private Boolean practiceGraded;
    private String questionType; // MCQ or FILL for filtering in admin practice grading
    private String userAudio; // user's speaking answer audio
    private String lessonContent;
    private String lessonLinkFile; // NEW: expose lesson content/media for practice UI rendering (Reading/Listening)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<PracticeAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<PracticeAnswerDto> answers) {
        this.answers = answers;
    }

    public Boolean getAnswered() {
        return answered;
    }

    public void setAnswered(Boolean answered) {
        this.answered = answered;
    }

    public Boolean getCorrect() {
        return correct;
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct;
    }

    public Long getSelectedAnswerId() {
        return selectedAnswerId;
    }

    public void setSelectedAnswerId(Long selectedAnswerId) {
        this.selectedAnswerId = selectedAnswerId;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public String getLessonName() {
        return lessonName;
    }

    public void setLessonName(String lessonName) {
        this.lessonName = lessonName;
    }

    public String getWritingType() {
        return writingType;
    }

    public void setWritingType(String writingType) {
        this.writingType = writingType;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public Integer getManualScore() {
        return manualScore;
    }

    public void setManualScore(Integer manualScore) {
        this.manualScore = manualScore;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Boolean getGraded() {
        return graded;
    }

    public void setGraded(Boolean graded) {
        this.graded = graded;
    }

    public Integer getWritingAttempts() {
        return writingAttempts;
    }

    public void setWritingAttempts(Integer writingAttempts) {
        this.writingAttempts = writingAttempts;
    }

    public String getWritingStatus() {
        return writingStatus;
    }

    public void setWritingStatus(String writingStatus) {
        this.writingStatus = writingStatus;
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

    // Backward compatibility alias (in case code uses setUserName/getUserName)
    public void setUserName(String username) {
        this.username = username;
    }

    public String getUserName() {
        return username;
    }

    public String getSkill() {
        return skill;
    }

    public void setSkill(String skill) {
        this.skill = skill;
    }

    public String getLinkAudio() {
        return linkAudio;
    }

    public void setLinkAudio(String linkAudio) {
        this.linkAudio = linkAudio;
    }

    public String getSpeakingNote() {
        return speakingNote;
    }

    public void setSpeakingNote(String speakingNote) {
        this.speakingNote = speakingNote;
    }

    public Integer getPracticeScore() {
        return practiceScore;
    }

    public void setPracticeScore(Integer practiceScore) {
        this.practiceScore = practiceScore;
    }

    public String getPracticeFeedback() {
        return practiceFeedback;
    }

    public void setPracticeFeedback(String practiceFeedback) {
        this.practiceFeedback = practiceFeedback;
    }

    public Boolean getPracticeGraded() {
        return practiceGraded;
    }

    public void setPracticeGraded(Boolean practiceGraded) {
        this.practiceGraded = practiceGraded;
    }

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public String getUserAudio() {
        return userAudio;
    }

    public void setUserAudio(String userAudio) {
        this.userAudio = userAudio;
    }

    public String getLessonContent() {
        return lessonContent;
    }

    public void setLessonContent(String lessonContent) {
        this.lessonContent = lessonContent;
    }

    public String getLessonLinkFile() {
        return lessonLinkFile;
    }

    public void setLessonLinkFile(String lessonLinkFile) {
        this.lessonLinkFile = lessonLinkFile;
    }

    // Backward compatibility alias (old frontend key 'speakingAudio')
    public String getSpeakingAudio() {
        return userAudio;
    }

    public void setSpeakingAudio(String audio) {
        this.userAudio = audio;
    }
}
