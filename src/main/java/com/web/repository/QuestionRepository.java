package com.web.repository;

import com.web.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("select q from Question q where q.lesson.id = ?1")
    List<Question> findByLesson(Long lessonId);
}
