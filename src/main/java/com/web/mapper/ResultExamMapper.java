package com.web.mapper;

import com.web.dto.SkillAnswerDto;
import com.web.entity.Answer;
import com.web.entity.Question;
import com.web.entity.ResultExam;
import java.util.ArrayList;
import java.util.List;

public final class ResultExamMapper {
    private ResultExamMapper() {}

    public static SkillAnswerDto toSkillAnswerDto(ResultExam entry){
        SkillAnswerDto dto = new SkillAnswerDto();
        dto.setId(entry.getId());
        dto.setResultExamId(entry.getId());
        Question question = entry.getQuestion();
        if(question != null){
            dto.setQuestionId(question.getId());
            dto.setQuestionTitle(question.getTitle());
            dto.setQuestionContent(question.getQuestionType());
            if(question.getLesson()!=null && question.getLesson().getSkill()!=null){
                dto.setSkill(question.getLesson().getSkill().name());
            }
        }
        Answer ans = entry.getAnswer();
        if(ans != null){
            dto.setSelectedAnswerId(ans.getId());
        }
        String userAnswer = entry.getAnswerText();
        if(userAnswer == null || userAnswer.isBlank()){
            userAnswer = firstNonBlank(ans == null ? null : ans.getTitle());
        } else {
            userAnswer = userAnswer.trim();
        }
        dto.setUserAnswer(userAnswer);
        dto.setAnswerText(entry.getAnswerText());
        // Tính toán score và trạng thái graded cho câu trắc nghiệm (Reading/Listening)
        Float score = entry.getManualScore();
        Boolean graded = entry.getGraded();
        if(score == null && ans != null){
            // Nếu là câu trắc nghiệm có đáp án đúng/sai, tự set score = 1 (đúng) hoặc 0 (sai)
            if(Boolean.TRUE.equals(ans.getIsTrue())){
                score = 1f;
            } else if(Boolean.FALSE.equals(ans.getIsTrue())){
                score = 0f;
            }
        }
        // Nếu đã xác định được score cho MCQ thì coi như đã chấm
        if(graded == null){
            graded = (score != null);
        }
        dto.setScore(score);
        dto.setFeedback(entry.getFeedback());
        dto.setGraded(Boolean.TRUE.equals(graded));
        return dto;
    }

    public static String firstNonBlank(String... values){
        if(values==null) return null;
        for(String v: values){
            if(v!=null && !v.isBlank()){
                return v.trim();
            }
        }
        return null;
    }

    public static List<SkillAnswerDto> buildSkillAnswerDtos(List<ResultExam> entries){
        List<SkillAnswerDto> out = new ArrayList<>();
        if(entries == null) return out;
        for(ResultExam entry : entries){
            if(entry == null) continue;
            out.add(toSkillAnswerDto(entry));
        }
        return out;
    }
}
