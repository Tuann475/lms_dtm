package com.web.repository;

import com.web.entity.ExamGradeHistory;
import com.web.enums.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ExamGradeHistoryRepository extends JpaRepository<ExamGradeHistory, Long> {
    List<ExamGradeHistory> findByResultExam_IdOrderByGradedAtDesc(Long resultExamId);

    List<ExamGradeHistory> findByResultExam_IdAndSkillOrderByGradedAtDesc(Long resultExamId, Skill skill);

    @Query("SELECT FUNCTION('date', e.gradedAt) AS gradedDate, AVG(e.score) AS avgScore, COUNT(e.id) AS cnt " +
           "FROM ExamGradeHistory e " +
           "WHERE e.skill = :skill " +
           "GROUP BY FUNCTION('date', e.gradedAt) " +
           "ORDER BY FUNCTION('date', e.gradedAt)")
    List<Object[]> findAverageScoreByDate(@Param("skill") Skill skill);

    @Query("SELECT FUNCTION('date', e.gradedAt) AS gradedDate, AVG(e.score) AS avgScore, COUNT(e.id) AS cnt " +
           "FROM ExamGradeHistory e " +
           "WHERE e.skill = :skill AND e.resultExam.result.exam.course.id = :courseId " +
           "GROUP BY FUNCTION('date', e.gradedAt) " +
           "ORDER BY FUNCTION('date', e.gradedAt)")
    List<Object[]> findAverageScoreByDateAndCourse(@Param("skill") Skill skill, @Param("courseId") Long courseId);
}
