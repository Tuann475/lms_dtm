package com.web.service;

import com.web.entity.Answer;
import com.web.entity.Question;
import com.web.entity.Lesson;
import com.web.entity.User;
import com.web.enums.Skill;
import com.web.exception.MessageException;
import com.web.repository.AnswerRepository;
import com.web.repository.QuestionRepository;
import com.web.repository.ResultExamRepository;
import com.web.repository.LessonRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private AnswerRepository answerRepository;
    @Autowired
    private ResultExamRepository resultExamRepository;
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private UserUtils userUtils;

    public Question save(Question question) {
        if (question.getLesson() != null && question.getLesson().getSkill() != null) {
            Skill skill = question.getLesson().getSkill();
            if (skill == Skill.WRITING) {
                // Với WRITING: chỉ dùng questionType
                String qt = question.getQuestionType();
                if (qt == null || qt.trim().isEmpty()) {
                    throw new MessageException("Phải chọn loại Writing cho câu hỏi WRITING");
                }
                question.setQuestionType(qt.trim().toUpperCase());
            } else {
                // Non-writing: phải chọn questionType (MCQ/FILL)
                String qt = question.getQuestionType();
                if (qt == null || qt.trim().isEmpty()) {
                    throw new MessageException("Phải chọn loại câu hỏi (MCQ/FILL)");
                }
                qt = qt.trim().toUpperCase();
                if (!(qt.equals("MCQ") || qt.equals("FILL"))) {
                    throw new MessageException("Loại câu hỏi không hợp lệ, chỉ hỗ trợ MCQ hoặc FILL: " + question.getQuestionType());
                }
                question.setQuestionType(qt);
            }
        }
        return questionRepository.save(question);
    }

    public void delete(Long id) {
        List<Answer> answers = answerRepository.findByQuestion_Id(id);
        for (Answer answer : answers) {
            resultExamRepository.deleteByAnswer_Id(answer.getId());
            answerRepository.deleteById(answer.getId());
        }
        questionRepository.deleteById(id);
    }


    public Question findById(Long id) {
        Optional<Question> question = questionRepository.findById(id);
        if (question.isEmpty()) {
            throw new MessageException("Not found category :" + id);
        }
        return question.get();
    }

    public List<Question> findByLesson(Long lessonId) {
        return questionRepository.findByLesson(lessonId);
    }


    public void deleteQuestionAndAnswers(Long questionId) {

        Optional<Question> question = questionRepository.findById(questionId);

        if (question.isPresent()) {
            // Xóa câu hỏi (các câu trả lời sẽ được xóa tự động nhờ cascade)
            questionRepository.delete(question.get());
        }
    }

    public void deleteQuestionAndAnswers2(Long questionId) {
        Optional<Question> question = questionRepository.findById(questionId);

        if (question.isPresent()) {
            List<Answer> answers = question.get().getAnswers();
            for (Answer answer : answers) {
                answerRepository.delete(answer); // Xóa từng câu trả lời
            }
            questionRepository.delete(question.get());
        }
    }

    public Lesson getLessonById(Long id){
        return lessonRepository.findById(id).orElse(null);
    }

    public User getCurrentUser(){
        return userUtils.getUserWithAuthority();
    }
}
