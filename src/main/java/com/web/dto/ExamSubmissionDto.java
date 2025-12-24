package com.web.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import com.web.dto.FillSubmissionDto;

@Getter
@Setter
public class ExamSubmissionDto {
    private Long examId;
    private String time; // finish time string
    private List<Long> answerIds; // selected multiple-choice answer IDs
    private List<WritingSubmissionDto> writings; // writing submissions
    private List<FillSubmissionDto> fills; // fill-in-the-blank submissions (Reading/Listening short answers)
}
