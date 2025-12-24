package com.web.dto;

public class PracticeAnswerDto {
    private Long id;
    private String title;
    private Boolean isTrue; // gửi luôn để client highlight sau khi chọn

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

    public Boolean getIsTrue() {
        return isTrue;
    }

    public void setIsTrue(Boolean isTrue) {
        this.isTrue = isTrue;
    }
}
