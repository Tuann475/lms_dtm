package com.web.service;

import com.web.entity.SpeakingSubmission;
import com.web.entity.Result;
import com.web.entity.ResultExam;
import com.web.repository.SpeakingSubmissionRepository;
import com.web.repository.ResultRepository;
import com.web.repository.ResultExamRepository;
import com.web.repository.QuestionRepository;
import com.web.entity.Question;
import com.web.repository.PracticeSessionQuestionRepository;
import com.web.entity.PracticeSessionQuestion;
import com.web.dto.SpeakingSubmissionDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class SpeakingSubmissionService {

    private static final Logger log = LoggerFactory.getLogger(SpeakingSubmissionService.class);

    private final SpeakingSubmissionRepository repository;
    private final ResultRepository resultRepository;
    private final ResultExamRepository resultExamRepository;
    private final QuestionRepository questionRepository;
    private final PracticeSessionQuestionRepository practiceSessionQuestionRepository;

    public SpeakingSubmissionService(SpeakingSubmissionRepository repository, ResultRepository resultRepository, ResultExamRepository resultExamRepository, QuestionRepository questionRepository, PracticeSessionQuestionRepository practiceSessionQuestionRepository) {
        this.repository = repository;
        this.resultRepository = resultRepository;
        this.resultExamRepository = resultExamRepository;
        this.questionRepository = questionRepository;
        this.practiceSessionQuestionRepository = practiceSessionQuestionRepository;
    }

    // Cloud-only creation (no local file save) for exam mode
    public SpeakingSubmission storeCloud(Long userId, Long examId, Long questionId, MultipartFile audio) {
        if (audio == null || audio.isEmpty()) throw new IllegalArgumentException("File rỗng");
        String contentType = audio.getContentType();
        if (contentType == null || !(contentType.equals("audio/mpeg") || contentType.equals("audio/wav") || contentType.equals("audio/webm") || contentType.equals("audio/ogg"))) {
            throw new IllegalArgumentException("Định dạng audio không hỗ trợ");
        }
        if (audio.getSize() > 12 * 1024 * 1024) throw new IllegalArgumentException("File quá lớn (max 12MB)");
        SpeakingSubmission submission = new SpeakingSubmission();
        submission.setUserId(userId);
        submission.setExamId(examId);
        submission.setQuestionId(questionId);
        submission.setCreatedDate(Timestamp.from(Instant.now()));
        submission.setUpdatedDate(submission.getCreatedDate());
        submission.setStatus("PENDING");
        return repository.save(submission);
    }

    // Cloud-only creation for practice session mode
    public SpeakingSubmission storeCloudPractice(Long userId, Long practiceSessionId, Long examId, Long questionId, MultipartFile audio) {
        if (audio == null || audio.isEmpty()) throw new IllegalArgumentException("File rỗng");
        String contentType = audio.getContentType();
        if (contentType == null || !(contentType.equals("audio/mpeg") || contentType.equals("audio/wav") || contentType.equals("audio/webm") || contentType.equals("audio/ogg"))) {
            throw new IllegalArgumentException("Định dạng audio không hỗ trợ");
        }
        if (audio.getSize() > 12 * 1024 * 1024) throw new IllegalArgumentException("File quá lớn (max 12MB)");
        SpeakingSubmission submission = new SpeakingSubmission();
        submission.setUserId(userId);
        submission.setPracticeSessionId(practiceSessionId);
        submission.setExamId(examId); // lưu examId để dễ thống kê band nếu cần
        submission.setQuestionId(questionId);
        submission.setCreatedDate(Timestamp.from(Instant.now()));
        submission.setUpdatedDate(submission.getCreatedDate());
        submission.setStatus("PENDING");
        return repository.save(submission);
    }

    @Transactional
    public SpeakingSubmission applyCloudinaryUpload(Long submissionId, Map<String, Object> uploadResult, Integer durationSeconds) {
        SpeakingSubmission sub = repository.findById(submissionId).orElse(null);
        if (sub == null) return null;
        try {
            sub.setCloudinaryPublicId(uploadResult.get("public_id") != null ? uploadResult.get("public_id").toString() : null);
            String url = uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : (uploadResult.get("url") != null ? uploadResult.get("url").toString() : null);
            if (url == null || url.isEmpty()) {
                log.warn("[CloudinaryApply] Missing URL for submissionId={}", submissionId);
            }
            sub.setCloudinaryUrl(url);
            sub.setAudioPath(url); // unify: audioPath holds cloud URL
            if (durationSeconds != null) sub.setDurationSeconds(durationSeconds);
            Object durObj = uploadResult.get("duration");
            if (sub.getDurationSeconds() == null && durObj instanceof Number) sub.setDurationSeconds(((Number) durObj).intValue());
            sub.setStatus("UPLOADED_CLOUD");
            sub.setUpdatedDate(Timestamp.from(Instant.now()));
            SpeakingSubmission savedSub = repository.save(sub);

            // Persist audio link into result_exam_detail (ResultExam) and store in answerText
            if (sub.getExamId() != null && sub.getUserId() != null && sub.getQuestionId() != null && url != null && !url.isEmpty()) {
                resultRepository.findByUserAndExam(sub.getUserId(), sub.getExamId()).ifPresentOrElse(res -> {
                    ResultExam re = resultExamRepository.findByResultIdAndQuestionId(res.getId(), sub.getQuestionId());
                    if (re != null) {
                        re.setAnswerText(url);
                        re.setSpeakingAudioPublicId(sub.getCloudinaryPublicId());
                        resultExamRepository.save(re);
                    } else {
                        // Create new ResultExam for this speaking question if it does not exist yet
                        Question q = questionRepository.findById(sub.getQuestionId()).orElse(null);
                        if (q != null) {
                            ResultExam newRe = new ResultExam();
                            newRe.setResult(res);
                            newRe.setQuestion(q);
                            newRe.setAnswerText(url);
                            newRe.setSpeakingAudioPublicId(sub.getCloudinaryPublicId());
                            resultExamRepository.save(newRe);
                        }
                    }
                }, () -> {
                    log.warn("[CloudinaryApply] No Result found for userId={}, examId={}", sub.getUserId(), sub.getExamId());
                });
            }

            // Practice session speaking: also persist into practice_session_question
            if (sub.getPracticeSessionId() != null && sub.getQuestionId() != null && url != null && !url.isEmpty()) {
                PracticeSessionQuestion psq = practiceSessionQuestionRepository.findBySessionAndQuestion(sub.getPracticeSessionId(), sub.getQuestionId());
                if (psq != null) {
                    psq.setSpeakingAudio(url);
                    psq.setAnswerText(url); // unify usage: answerText holds audio URL for practice
                    Integer attempts = psq.getSpeakingAttempts() == null ? 0 : psq.getSpeakingAttempts();
                    psq.setSpeakingAttempts(attempts + 1);
                    practiceSessionQuestionRepository.save(psq);
                    log.info("[CloudinaryApply] Updated practiceSessionQuestionId={} with audio URL (answerText)", psq.getId());
                } else {
                    log.warn("[CloudinaryApply] PracticeSessionQuestion not found sessionId={}, questionId={}", sub.getPracticeSessionId(), sub.getQuestionId());
                }
            }

            return savedSub;
        } catch (Exception e) {
            log.error("[CloudinaryApply] submissionId={} error={}", submissionId, e.getMessage(), e);

            sub.setUpdatedDate(Timestamp.from(Instant.now()));
            return repository.save(sub);
        }
    }

    public List<SpeakingSubmission> listByUser(Long userId) { return repository.findByUserId(userId); }
    public List<SpeakingSubmission> listByExamAndUser(Long examId, Long userId) { return repository.findByExamIdAndUserId(examId, userId); }
    public List<SpeakingSubmission> listByPracticeSessionAndUser(Long practiceSessionId, Long userId){ return repository.findByPracticeSessionIdAndUserIdOrderByCreatedDateDesc(practiceSessionId, userId); }
    public SpeakingSubmission find(Long id) { return repository.findById(id).orElse(null); }

    public SpeakingSubmissionDto toDto(SpeakingSubmission sub){
        if(sub==null) return null;
        SpeakingSubmissionDto dto = new SpeakingSubmissionDto();
        dto.setId(sub.getId());
        dto.setExamId(sub.getExamId());
        dto.setQuestionId(sub.getQuestionId());
        dto.setUserId(sub.getUserId());
        dto.setPracticeSessionId(sub.getPracticeSessionId());
        dto.setAudioPath(sub.getAudioPath());
        dto.setCloudinaryUrl(sub.getCloudinaryUrl());
        dto.setCloudinaryPublicId(sub.getCloudinaryPublicId());
        dto.setDurationSeconds(sub.getDurationSeconds());
        dto.setStatus(sub.getStatus());
        dto.setCreatedDate(sub.getCreatedDate());
        dto.setUpdatedDate(sub.getUpdatedDate());
        if(sub.getQuestionId()!=null){
            Question q = questionRepository.findById(sub.getQuestionId()).orElse(null);
            if(q!=null){
                dto.setQuestionTitle(q.getTitle());
                dto.setQuestionLinkAudio(q.getLinkAudio());
                dto.setSpeakingNote(q.getSpeakingNote());
            }
        }
        return dto;
    }

    public SpeakingSubmissionDto getEnriched(Long id){
        SpeakingSubmission sub = repository.findById(id).orElse(null);
        return toDto(sub);
    }
}
