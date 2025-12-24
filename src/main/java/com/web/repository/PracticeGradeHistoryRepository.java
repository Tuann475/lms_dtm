package com.web.repository;

import com.web.entity.PracticeGradeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeGradeHistoryRepository extends JpaRepository<PracticeGradeHistory, Long> {
    List<PracticeGradeHistory> findByPsqIdOrderByGradedAtDesc(Long psqId);

    @Query("select h from PracticeGradeHistory h where h.psqId = ?1 order by h.gradedAt desc, h.id desc")
    List<PracticeGradeHistory> findHistories(Long psqId);
}
