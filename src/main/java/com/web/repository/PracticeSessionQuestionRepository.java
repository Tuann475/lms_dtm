package com.web.repository;

import com.web.entity.PracticeSessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PracticeSessionQuestionRepository extends JpaRepository<PracticeSessionQuestion, Long> {
    @Query("select q from PracticeSessionQuestion q where q.session.id = ?1")
    List<PracticeSessionQuestion> findBySession(Long sessionId);

    @Query("select q from PracticeSessionQuestion q where q.session.result.exam.id = ?1")
    List<PracticeSessionQuestion> findByExam(Long examId);

    @Query("select q from PracticeSessionQuestion q where q.session.id = ?1 and q.question.id = ?2")
    PracticeSessionQuestion findBySessionAndQuestion(Long sessionId, Long questionId);
}
