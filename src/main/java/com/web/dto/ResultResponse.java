package com.web.dto;

import com.web.entity.Result;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResultResponse {

    private Integer tongCauHoi;

    private Integer soTLDung;

    private Integer soTLSai;

    private Integer soCauBo;

    private Float phanTram;

    private Float diemThangMuoi; // auto-calculated band (0-9) derived from objective sections

    private Float manualScore; // aggregated manual score exposed to clients

    private Result result;

    private Integer writingPending; // number of writing answers not graded
    private Integer writingGraded; // number graded
    private Float finalWritingBand; // IELTS weighted band (Task2 double weight) rounded to nearest 0.5
    private Float task1Score; // đổi sang Float để có .5
    private Float task2Score; // đổi sang Float để có .5

    private String readingBand;
    private String listeningBand;
    private String speakingBand;
    private String overallBand; // average of 4 skills rounded to nearest 0.5 when all present
    // Speaking details (each attempt with prompt audio)
    private List<SpeakingAnswerDto> speakingSubmissions; // populated when exam has speaking attempts
}
