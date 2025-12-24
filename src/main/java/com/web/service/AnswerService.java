package com.web.service;

import com.web.entity.Answer;
import com.web.repository.AnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AnswerService {

    @Autowired
    private AnswerRepository answerRepository;

    public Answer save(Answer answer) {
        // No answerType check needed; set isTrue elsewhere if required
        Answer result = answerRepository.save(answer);
        return result;
    }

    public void delete(Long id) {
        answerRepository.deleteById(id);
    }

    public Answer findById(Long id) {
        return answerRepository.findById(id).get();
    }

    public List<Answer> findByQuestion(Long questionId) {
        List<Answer> result = answerRepository.findByQuestion(questionId);
        return result;
    }

}
