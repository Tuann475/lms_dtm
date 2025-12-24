package com.web.dto;

public class UserExamPracticeStatsDto {
    private long totalExamsDone;
    private long totalPracticesDone;
    private Double avgExamScore;

    public long getTotalExamsDone() {
        return totalExamsDone;
    }

    public void setTotalExamsDone(long totalExamsDone) {
        this.totalExamsDone = totalExamsDone;
    }

    public long getTotalPracticesDone() {
        return totalPracticesDone;
    }

    public void setTotalPracticesDone(long totalPracticesDone) {
        this.totalPracticesDone = totalPracticesDone;
    }

    public Double getAvgExamScore() {
        return avgExamScore;
    }

    public void setAvgExamScore(Double avgExamScore) {
        this.avgExamScore = avgExamScore;
    }
}
