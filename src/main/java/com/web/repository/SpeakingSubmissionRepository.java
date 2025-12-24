package com.web.repository;

import com.web.entity.SpeakingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpeakingSubmissionRepository extends JpaRepository<SpeakingSubmission, Long> {
    List<SpeakingSubmission> findByUserId(Long userId);
    List<SpeakingSubmission> findByExamIdAndUserId(Long examId, Long userId);
    List<SpeakingSubmission> findByExamIdAndUserIdOrderByCreatedDateDesc(Long examId, Long userId);
    List<SpeakingSubmission> findByPracticeSessionIdAndUserIdOrderByCreatedDateDesc(Long practiceSessionId, Long userId);
    List<SpeakingSubmission> findByPracticeSessionId(Long practiceSessionId);

    long countByExamIdAndUserIdAndQuestionId(Long examId, Long userId, Long questionId);
    Optional<SpeakingSubmission> findFirstByExamIdAndUserIdAndQuestionIdOrderByCreatedDateDesc(Long examId, Long userId, Long questionId);
}
