package com.web.repository;

import com.web.entity.ResultExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ResultExamRepository extends JpaRepository<ResultExam, Long> {
    void deleteByResult_Id(Long resultId);

    void deleteByAnswer_Id(Long answerId);

    @Query("select re from ResultExam re where re.result.exam.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.WRITING")
    List<ResultExam> findWritingByExam(Long examId);

    @Query("select re from ResultExam re where re.result.exam.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.WRITING and re.graded = false")
    List<ResultExam> findPendingWritingByExam(Long examId);

    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.WRITING")
    List<ResultExam> findWritingByResult(Long resultId);

    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.READING")
    List<ResultExam> findReadingByResult(Long resultId);

    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.LISTENING")
    List<ResultExam> findListeningByResult(Long resultId);

    // Find pending (ungraded) Reading questions with answerText (FILL type)
    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.READING and re.graded = false and re.answerText is not null and re.answerText != ''")
    List<ResultExam> findPendingReadingByResult(Long resultId);

    // Find pending (ungraded) Listening questions with answerText (FILL type)
    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.LISTENING and re.graded = false and re.answerText is not null and re.answerText != ''")
    List<ResultExam> findPendingListeningByResult(Long resultId);

    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.id = ?2")
    ResultExam findByResultIdAndQuestionId(Long resultId, Long questionId);

    List<ResultExam> findByResult_Id(Long resultId);

    @Query("select re from ResultExam re where re.result.id = ?1 and re.question.lesson.skill = com.web.enums.Skill.SPEAKING")
    List<ResultExam> findSpeakingByResult(Long resultId);
}
