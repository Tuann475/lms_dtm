package com.web.repository;

import com.web.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query("select a from Answer a where a.question.id = ?1")
    List<Answer> findByQuestion(Long questionId);


    List<Answer> findByQuestion_Id(Long questionId);

    void deleteByQuestion_Id(Long questionId);
}
