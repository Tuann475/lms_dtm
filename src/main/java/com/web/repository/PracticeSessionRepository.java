package com.web.repository;

import com.web.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    @Query("select p from PracticeSession p where p.user.id = ?1 and p.result.id = ?2 and p.completed = false")
    Optional<PracticeSession> findActiveByUserAndResult(Long userId, Long resultId);

    @Query("select p from PracticeSession p where p.user.id = ?1")
    List<PracticeSession> findByUser(Long userId);

    @Query("select p from PracticeSession p where p.result.exam.id = ?1")
    List<PracticeSession> findByExam(Long examId);

    long countByUser_Id(Long userId);

    @Query("SELECT FUNCTION('date', p.createdDate) AS day, COUNT(p.id) AS cnt " +
           "FROM PracticeSession p " +
           "WHERE p.user.id = :userId " +
           "GROUP BY FUNCTION('date', p.createdDate) " +
           "ORDER BY FUNCTION('date', p.createdDate)")
    List<Object[]> countSessionsByUserGroupedByDay(@Param("userId") Long userId);
}
