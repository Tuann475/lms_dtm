package com.web.api;

import com.web.entity.SpeakingSubmission;
import com.web.entity.PracticeSessionQuestion;
import com.web.service.SpeakingSubmissionService;
import com.web.service.PracticeSessionQuestionService;
import com.web.jwt.JwtTokenProvider;
import com.web.utils.CloudinaryService;
import com.web.dto.SpeakingSubmissionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/speaking")
@CrossOrigin
public class SpeakingSubmissionApi {

    private final SpeakingSubmissionService service;
    private final JwtTokenProvider jwtTokenProvider;
    private final CloudinaryService cloudinaryService;
    private final PracticeSessionQuestionService practiceSessionQuestionService;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SpeakingSubmissionApi.class);

    @Value("${cloudinary.audio.folder:exam_audio}")
    private String cloudAudioFolder;

    public SpeakingSubmissionApi(SpeakingSubmissionService service,
                                 JwtTokenProvider jwtTokenProvider,
                                 CloudinaryService cloudinaryService,
                                 PracticeSessionQuestionService practiceSessionQuestionService) {
        this.service = service;
        this.jwtTokenProvider = jwtTokenProvider;
        this.cloudinaryService = cloudinaryService;
        this.practiceSessionQuestionService = practiceSessionQuestionService;
    }

    private Long resolveUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try { return jwtTokenProvider.getUserIdFromJWT(token); } catch (Exception e) { return null; }
        }
        return null;
    }

    @PostMapping("/upload-cloud")
    public ResponseEntity<?> uploadCloud(@RequestParam("examId") Long examId,
                                         @RequestParam(value = "questionId", required = false) Long questionId,
                                         @RequestParam("audio") MultipartFile audio,
                                         @RequestParam(value = "duration", required = false) Integer durationSeconds,
                                         HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không xác thực được người dùng"));
        }
        if (examId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu examId"));
        }
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File audio rỗng"));
        }
        try {
            SpeakingSubmission saved = service.storeCloud(userId, examId, questionId, audio);
            String publicId = "exam_" + examId + "_u_" + userId + "_" + UUID.randomUUID();
            Map<String,Object> uploadResult = cloudinaryService.uploadAudio(audio, cloudAudioFolder, publicId);
            SpeakingSubmission updated = service.applyCloudinaryUpload(saved.getId(), uploadResult, durationSeconds);
            log.info("[SpeakingUploadCloud] userId={} examId={} questionId={} size={} type={} -> id={} cloudinaryPublicId={} url={}",
                    userId, examId, questionId, audio.getSize(), audio.getContentType(), saved.getId(), updated.getCloudinaryPublicId(), updated.getCloudinaryUrl());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException iae) {
            log.warn("[SpeakingUploadCloud][VALIDATION] userId={} examId={} questionId={} msg={}", userId, examId, questionId, iae.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            log.error("[SpeakingUploadCloud][UNKNOWN] userId={} examId={} questionId={} msg={}", userId, examId, questionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Lỗi không xác định"));
        }
    }

    @PostMapping("/upload-cloud-practice")
    public ResponseEntity<?> uploadCloudPractice(@RequestParam("practiceSessionId") Long practiceSessionId,
                                                 @RequestParam("examId") Long examId,
                                                 @RequestParam(value = "questionId", required = false) Long questionId,
                                                 @RequestParam("audio") MultipartFile audio,
                                                 @RequestParam(value = "duration", required = false) Integer durationSeconds,
                                                 HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không xác thực được người dùng"));
        }
        if (practiceSessionId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu practiceSessionId"));
        }
        if (examId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu examId"));
        }
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File audio rỗng"));
        }
        try {
            SpeakingSubmission saved = service.storeCloudPractice(userId, practiceSessionId, examId, questionId, audio);
            String publicId = "practice_" + practiceSessionId + "_u_" + userId + "_" + UUID.randomUUID();
            Map<String,Object> uploadResult = cloudinaryService.uploadAudio(audio, cloudAudioFolder, publicId);
            SpeakingSubmission updated = service.applyCloudinaryUpload(saved.getId(), uploadResult, durationSeconds);
            log.info("[SpeakingUploadCloudPractice] userId={} sessionId={} examId={} questionId={} size={} type={} -> id={} cloudinaryPublicId={} url={}",
                    userId, practiceSessionId, examId, questionId, audio.getSize(), audio.getContentType(), saved.getId(), updated.getCloudinaryPublicId(), updated.getCloudinaryUrl());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            log.error("[SpeakingUploadCloudPractice][UNKNOWN] userId={} sessionId={} examId={} questionId={} msg={}", userId, practiceSessionId, examId, questionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Lỗi không xác định"));
        }
    }

    @GetMapping("/audio/{id}")
    public ResponseEntity<?> redirectAudio(@PathVariable Long id, HttpServletRequest request) {
        SpeakingSubmission sub = service.find(id);
        if (sub == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy"));
        }
        Long userId = resolveUserId(request);
        if (userId != null && !userId.equals(sub.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Không có quyền"));
        }
        String url = sub.getCloudinaryUrl();
        if (url == null || url.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Chưa có URL Cloudinary"));
        }
        return ResponseEntity.status(HttpStatus.FOUND).header("Location", url).build();
    }

    @GetMapping("/my")
    public ResponseEntity<?> listMine(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không xác thực được người dùng"));
        }
        List<SpeakingSubmission> list = service.listByUser(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my/exam/{examId}")
    public ResponseEntity<?> listMineExam(@PathVariable Long examId, HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không xác thực được người dùng"));
        }
        return ResponseEntity.ok(service.listByExamAndUser(examId, userId));
    }

    @GetMapping("/my/practice/{sessionId}")
    public ResponseEntity<?> listMinePractice(@PathVariable Long sessionId, HttpServletRequest request){
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không xác thực được người dùng"));
        }
        return ResponseEntity.ok(service.listByPracticeSessionAndUser(sessionId, userId));
    }

    @PostMapping("/upload-cloud-practice-question")
    public ResponseEntity<?> uploadCloudPracticeQuestion(@RequestParam("practiceSessionQuestionId") Long practiceSessionQuestionId,
                                                         @RequestParam("audio") MultipartFile audio,
                                                         @RequestParam(value = "answerText", required = false) String answerText,
                                                         @RequestParam(value = "duration", required = false) Integer durationSeconds,
                                                         HttpServletRequest request) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Không xác thực được người dùng"));
        }
        if (practiceSessionQuestionId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu practiceSessionQuestionId"));
        }
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File audio rỗng"));
        }
        try {
            String publicId = "practice_q_" + practiceSessionQuestionId + "_u_" + userId + "_" + UUID.randomUUID();
            Map<String, Object> uploadResult = cloudinaryService.uploadAudio(audio, cloudAudioFolder, publicId);
            String url = (String) uploadResult.getOrDefault("secure_url", uploadResult.get("url"));

            PracticeSessionQuestion updated = practiceSessionQuestionService
                    .updateSpeakingAnswer(practiceSessionQuestionId, userId, url, answerText, durationSeconds);

            // Also create a SpeakingSubmission record for practice to track attempts and persist audioPath
            Long practiceSessionId = updated.getSession() != null ? updated.getSession().getId() : null;
            Long examId = (updated.getSession() != null && updated.getSession().getResult() != null && updated.getSession().getResult().getExam() != null)
                    ? updated.getSession().getResult().getExam().getId() : null;
            Long questionId = updated.getQuestion() != null ? updated.getQuestion().getId() : null;
            if (practiceSessionId != null && examId != null && questionId != null) {
                SpeakingSubmission saved = service.storeCloudPractice(userId, practiceSessionId, examId, questionId, audio);
                SpeakingSubmission updatedSub = service.applyCloudinaryUpload(saved.getId(), uploadResult, durationSeconds);
                log.info("[SpeakingUploadCloudPracticeQuestion] speakingSubmissionId={} url={}", updatedSub.getId(), updatedSub.getCloudinaryUrl());
            } else {
                log.warn("[SpeakingUploadCloudPracticeQuestion] Missing linkage to create SpeakingSubmission: sessionId={} examId={} questionId={}",
                        practiceSessionId, examId, questionId);
            }

            log.info("[SpeakingUploadCloudPracticeQuestion] userId={} psqId={} size={} type={} url={}",
                    userId, practiceSessionQuestionId, audio.getSize(), audio.getContentType(), url);

            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            log.error("[SpeakingUploadCloudPracticeQuestion][UNKNOWN] userId={} psqId={} msg={}",
                    userId, practiceSessionQuestionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi không xác định"));
        }
    }

    @GetMapping("/enriched/{id}")
    public ResponseEntity<?> getEnriched(@PathVariable Long id, HttpServletRequest request){
        Long userId = resolveUserId(request);
        SpeakingSubmission sub = service.find(id);
        if(sub==null){ return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error","Không tìm thấy")); }
        // Allow owner or proceed if no auth (could restrict further based on roles)
        if(userId!=null && !userId.equals(sub.getUserId())){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error","Không có quyền")); }
        SpeakingSubmissionDto dto = service.getEnriched(id);
        return ResponseEntity.ok(dto);
    }
}
