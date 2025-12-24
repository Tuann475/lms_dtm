package com.web.service;

import com.web.entity.Exam;
import com.web.entity.Lesson;
import com.web.entity.Question;
import com.web.entity.User;
import com.web.repository.ExamRepository;
import com.web.repository.LessonRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserUtils userUtils;

    public List<Lesson> findByExam(Long examId) {
        List<Lesson> list = lessonRepository.findByExam(examId);
        return list;
    }

    public List<Lesson> findByListId(List<Long> listLesson) {
        List<Lesson> list = lessonRepository.findAllById(listLesson);
        return list;
    }

    public void delete(Long id) {
        lessonRepository.deleteById(id);
    }

    public void update(Lesson lesson) {
        lessonRepository.save(lesson);
    }

    public Lesson findById(Long id) {
        return lessonRepository.findById(id).get();
    }

    public Exam getExamById(Long id){
        return examRepository.findById(id).orElse(null);
    }

    public User getCurrentUser(){
        return userUtils.getUserWithAuthority();
    }
}
