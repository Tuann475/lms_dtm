package com.web.service;

import com.web.dto.PracticeAnswerDto;
import com.web.dto.PracticeQuestionDto;
import com.web.dto.PracticeSessionDto;
import com.web.dto.PracticeUserSummaryDto;
import com.web.entity.*;
import com.web.enums.PracticeMode;
import com.web.enums.WritingStatus;
import com.web.exception.MessageException;
import com.web.repository.*;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class PracticeSessionService {

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;
    @Autowired
    private PracticeSessionQuestionRepository practiceSessionQuestionRepository;
    @Autowired
    private ResultRepository resultRepository;
    @Autowired
    private UserUtils userUtils;
    @Autowired
    private CourseUserRepository courseUserRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private PracticeGradeHistoryRepository practiceGradeHistoryRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private com.web.repository.ExamGradeHistoryRepository examGradeHistoryRepository;

    public PracticeSession start(Long resultId, PracticeMode mode) {
        User user = userUtils.getUserWithAuthority();
        Result result = resultRepository.findById(resultId).orElseThrow(() -> new MessageException("Không tìm thấy kết quả"));
        if (!result.getUser().getId().equals(user.getId())) {
            throw new MessageException("Không có quyền");
        }
        Optional<PracticeSession> active = practiceSessionRepository.findActiveByUserAndResult(user.getId(), resultId);
        if (active.isPresent()) {
            return active.get();
        }
        PracticeSession session = new PracticeSession();
        session.setCreatedDate(LocalDateTime.now());
        session.setUser(user);
        session.setResult(result);
        session.setMode(mode);

        List<Question> questionsToAdd = new ArrayList<>();

        if (mode == PracticeMode.ALL_RANDOM) {
            // Lấy tất cả câu hỏi từ exam và random
            for (Lesson lesson : result.getExam().getLessons()) {
                questionsToAdd.addAll(lesson.getQuestions());
            }
            Collections.shuffle(questionsToAdd);
        } else {
            // Chỉ lấy câu sai (WRONG_ONLY)
            List<ResultExam> answered = result.getResultExams();
            for (ResultExam re : answered) {
                Answer ans = re.getAnswer();
                if (Boolean.FALSE.equals(ans.getIsTrue())) {
                    questionsToAdd.add(ans.getQuestion());
                }
            }
        }

        List<PracticeSessionQuestion> psqList = new ArrayList<>();
        for (Question q : questionsToAdd) {
            PracticeSessionQuestion psq = new PracticeSessionQuestion();
            psq.setSession(session);
            psq.setQuestion(q);
            psqList.add(psq);
        }
        session.setQuestions(psqList);
        session.setTotalQuestions(psqList.size());
        practiceSessionRepository.save(session);
        return session;
    }

    // Overload để tương thích với code cũ
    public PracticeSession start(Long resultId) {
        return start(resultId, PracticeMode.WRONG_ONLY);
    }

    public List<PracticeQuestionDto> getQuestions(Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId).orElseThrow(() -> new MessageException("Không tìm thấy phiên"));
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        List<PracticeSessionQuestion> list = practiceSessionQuestionRepository.findBySession(sessionId);
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private PracticeQuestionDto mapToDto(PracticeSessionQuestion psq) {
        PracticeQuestionDto dto = new PracticeQuestionDto();
        dto.setId(psq.getId());
        dto.setTitle(psq.getQuestion().getTitle());
        dto.setQuestionType(psq.getQuestion().getQuestionType());
        List<PracticeAnswerDto> answers = psq.getQuestion().getAnswers().stream().map(a -> {
            PracticeAnswerDto adto = new PracticeAnswerDto();
            adto.setId(a.getId());
            adto.setTitle(a.getTitle());
            adto.setIsTrue(a.getIsTrue());
            return adto;
        }).collect(Collectors.toList());
        Collections.shuffle(answers); // xáo thứ tự
        dto.setAnswers(answers);
        dto.setAnswered(psq.getAnswer() != null);
        // For writing questions treat answered if answerText present
        if(psq.getQuestion()!=null && psq.getQuestion().getLesson()!=null && psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.WRITING){
            if(psq.getAnswerText()!=null){ dto.setAnswered(true); }
        }
        // For FILL (non-writing) treat answered if answerText present
        if(psq.getQuestion()!=null && psq.getQuestion().getLesson()!=null && psq.getQuestion().getLesson().getSkill()!=com.web.enums.Skill.WRITING){
            String qt = psq.getQuestion().getQuestionType();
            if(isFillVariant(qt) && psq.getAnswerText()!=null && psq.getAnswerText().trim().length()>0){
                dto.setAnswered(true);
                dto.setAnswerText(psq.getAnswerText());
            }
        }
        dto.setCorrect(psq.getCorrect());
        if (psq.getAnswer() != null) {
            dto.setSelectedAnswerId(psq.getAnswer().getId());
        }
        if (psq.getQuestion().getLesson() != null) {
            dto.setLessonId(psq.getQuestion().getLesson().getId());
            dto.setLessonName(psq.getQuestion().getLesson().getName());
            if(psq.getQuestion().getLesson().getSkill()!=null){
                dto.setSkill(psq.getQuestion().getLesson().getSkill().name());
                if(psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.SPEAKING){
                    dto.setLinkAudio(psq.getQuestion().getLinkAudio());
                    dto.setSpeakingNote(psq.getQuestion().getSpeakingNote());
                }
            }

            // NEW: expose lesson content/media for practice UI
            dto.setLessonContent(psq.getQuestion().getLesson().getContent());
            dto.setLessonLinkFile(psq.getQuestion().getLesson().getLinkFile());
        }
        if(psq.getSession()!=null && psq.getSession().getUser()!=null){
            dto.setUserId(psq.getSession().getUser().getId());
            dto.setUsername(psq.getSession().getUser().getUsername());
        }
        // writing support
        if(psq.getQuestion()!=null && psq.getQuestion().getLesson()!=null && psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.WRITING){
            dto.setWritingType(psq.getQuestion().getQuestionType());
            dto.setAnswerText(psq.getAnswerText());
            dto.setManualScore(psq.getManualScore());
            dto.setFeedback(psq.getFeedback());
            dto.setGraded(psq.getGraded());
            dto.setWritingAttempts(psq.getWritingAttempts());
            // expose status
            String status = psq.getWritingStatus()!=null?psq.getWritingStatus().name():WritingStatus.PENDING.name();
            dto.setWritingStatus(status);
        } else {
            // Non-writing manual grading fields
            dto.setPracticeScore(psq.getPracticeScore());
            dto.setPracticeFeedback(psq.getPracticeFeedback());
            dto.setPracticeGraded(psq.getPracticeGraded());
        }
        if(psq.getQuestion().getLesson() != null && psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.SPEAKING){
            if(psq.getSpeakingAudio()!=null){ dto.setUserAudio(psq.getSpeakingAudio()); dto.setAnswered(true); }
            // Expose accumulated audio history (each attempt) stored in answerText. If history absent, fall back to latest audio.
            if(psq.getAnswerText()!=null && !psq.getAnswerText().isBlank()){
                dto.setAnswerText(psq.getAnswerText());
            } else if(psq.getSpeakingAudio()!=null){
                dto.setAnswerText(psq.getSpeakingAudio());
            }
        }
        return dto;
    }

    private boolean isFillVariant(String qt){
        if(qt==null) return false;
        String u = qt.toUpperCase();
        return u.contains("FILL") || u.contains("TEXTAREA") || u.contains("SHORT") || u.contains("ESSAY") || u.contains("OPEN");
    }

    public PracticeQuestionDto answer(Long psqId, Long answerId) {
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        PracticeSession session = psq.getSession();
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        if (psq.getAnswer() != null) {
            throw new MessageException("Đã trả lời câu này");
        }
        Answer ans = psq.getQuestion().getAnswers().stream().filter(a -> a.getId().equals(answerId)).findFirst()
                .orElseThrow(() -> new MessageException("Không tìm thấy đáp án"));
        psq.setAnswer(ans);
        psq.setCorrect(Boolean.TRUE.equals(ans.getIsTrue()));
        psq.setAnsweredAt(LocalDateTime.now());
        practiceSessionQuestionRepository.save(psq);
        session.setNumAnswered(session.getNumAnswered() + 1);
        if (Boolean.TRUE.equals(ans.getIsTrue())) {
            session.setNumCorrect(session.getNumCorrect() + 1);
        }
        if (session.getNumAnswered().equals(session.getTotalQuestions())) {
            session.setCompleted(true);
            session.setFinishedDate(LocalDateTime.now());
        }
        practiceSessionRepository.save(session);
        return mapToDto(psq);
    }

    public PracticeQuestionDto answerWriting(Long psqId, String answerText){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        PracticeSession session = psq.getSession();
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null || psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.WRITING){
            throw new MessageException("Không phải câu Writing");
        }
        // Allow multiple submissions: store latest text, increment attempts
        boolean first = psq.getAnswerText()==null;
        psq.setAnswerText(answerText);
        psq.setAnsweredAt(LocalDateTime.now());
        psq.setWritingAttempts(psq.getWritingAttempts()==null?1:psq.getWritingAttempts()+1);
        psq.setWritingStatus(WritingStatus.PENDING); // luôn ở trạng thái chờ chấm sau mỗi lần nộp
        practiceSessionQuestionRepository.save(psq);
        if(first){
            session.setNumAnswered(session.getNumAnswered()+1);
            if(session.getNumAnswered().equals(session.getTotalQuestions())){
                session.setCompleted(true);
                session.setFinishedDate(LocalDateTime.now());
            }
            practiceSessionRepository.save(session);
        }
        return mapToDto(psq);
    }

    public PracticeQuestionDto answerSpeaking(Long psqId, MultipartFile file){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        PracticeSession session = psq.getSession();
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null || psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.SPEAKING){
            throw new MessageException("Không phải câu Speaking");
        }
        if(file==null || file.isEmpty()){
            throw new MessageException("Thiếu file âm thanh");
        }
        try{
            String uploadsDir = System.getProperty("user.dir")+"/uploads/speaking";
            Files.createDirectories(Path.of(uploadsDir));
            String original = file.getOriginalFilename();
            String ext = "";
            if(original!=null && original.contains(".")){ ext = original.substring(original.lastIndexOf('.')); }
            String filename = "psq_"+psq.getId()+"_"+System.currentTimeMillis()+ext;
            Path target = Path.of(uploadsDir, filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            // store relative path for frontend to access (adjust if static mapping differs)
            String relative = "/uploads/speaking/"+filename;
            boolean first = psq.getSpeakingAudio()==null;
            psq.setSpeakingAudio(relative);
            // Append audio path to answerText history (newline separated) so all attempts are retained
            String existing = psq.getAnswerText();
            if(existing!=null && !existing.isBlank()){
                psq.setAnswerText(existing + "\n" + relative);
            } else {
                psq.setAnswerText(relative);
            }
            psq.setSpeakingAttempts(psq.getSpeakingAttempts()==null?1:psq.getSpeakingAttempts()+1);
            psq.setAnsweredAt(LocalDateTime.now());
            practiceSessionQuestionRepository.save(psq);
            if(first){
                session.setNumAnswered(session.getNumAnswered()+1);
                if(session.getNumAnswered().equals(session.getTotalQuestions())){
                    session.setCompleted(true);
                    session.setFinishedDate(LocalDateTime.now());
                }
                practiceSessionRepository.save(session);
            }
        }catch(Exception e){ throw new MessageException("Lưu file thất bại"); }
        return mapToDto(psq);
    }

    public PracticeSession finish(Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId).orElseThrow(() -> new MessageException("Không tìm thấy phiên"));
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        // Cho phép nộp dù chưa làm hết; nếu đã completed thì trả luôn
        if(Boolean.TRUE.equals(session.getCompleted())){
            return session;
        }
        session.setCompleted(true);
        session.setFinishedDate(LocalDateTime.now());
        return practiceSessionRepository.save(session);
    }

    public PracticeSession getSession(Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId).orElseThrow(() -> new MessageException("Không tìm thấy phiên"));
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        return session;
    }

    private Float computeSessionOverallBand(PracticeSession s) {
        if (s == null || s.getQuestions() == null || s.getQuestions().isEmpty()) return null;
        java.util.Map<com.web.enums.Skill, java.util.List<Double>> bySkill = new java.util.EnumMap<>(com.web.enums.Skill.class);
        for (PracticeSessionQuestion q : s.getQuestions()) {
            if (q.getQuestion() == null || q.getQuestion().getLesson() == null) continue;
            com.web.enums.Skill skill = q.getQuestion().getLesson().getSkill();
            if (skill == null) continue;
            Integer score = null;
            // 1. Latest score from history
            java.util.List<PracticeGradeHistory> histories = practiceGradeHistoryRepository.findHistories(q.getId());
            if (histories != null && !histories.isEmpty()) {
                PracticeGradeHistory latest = histories.get(0);
                if (latest.getScore() != null) {
                    score = latest.getScore();
                }
            }
            // 2. Fallback to manualScore/practiceScore
            if (score == null) {
                if (q.getManualScore() != null) {
                    score = q.getManualScore();
                } else if (q.getPracticeScore() != null) {
                    score = q.getPracticeScore();
                }
            }
            if (score == null) continue;
            bySkill.computeIfAbsent(skill, k -> new java.util.ArrayList<>()).add(score.doubleValue());
        }
        if (bySkill.isEmpty()) return null;
        java.util.List<Double> skillBands = new java.util.ArrayList<>();
        for (java.util.Map.Entry<com.web.enums.Skill, java.util.List<Double>> e : bySkill.entrySet()) {
            java.util.List<Double> vals = e.getValue();
            if (vals == null || vals.isEmpty()) continue;
            double sum = 0d;
            for (Double v : vals) sum += v;
            skillBands.add(sum / vals.size());
        }
        if (skillBands.isEmpty()) return null;
        double total = 0d;
        for (Double v : skillBands) total += v;
        double overall = total / skillBands.size();
        return (float) overall;
    }

    private PracticeSessionDto toDto(PracticeSession s) {
        PracticeSessionDto dto = new PracticeSessionDto();
        dto.setId(s.getId());
        dto.setResultId(s.getResult().getId());
        dto.setExamId(s.getResult().getExam().getId());
        if(s.getResult()!=null && s.getResult().getExam()!=null){
            dto.setExamName(s.getResult().getExam().getName());
        }
        dto.setTotalQuestions(s.getTotalQuestions());
        dto.setNumAnswered(s.getNumAnswered());
        dto.setNumCorrect(s.getNumCorrect());
        dto.setCompleted(s.getCompleted());
        dto.setMode(s.getMode() != null ? s.getMode().name() : PracticeMode.WRONG_ONLY.name());
        if (s.getCreatedDate() != null) {
            dto.setCreatedDate(s.getCreatedDate().toString());
        }
        if (s.getFinishedDate() != null) {
            dto.setFinishedDate(s.getFinishedDate().toString());
        }
        if (s.getCreatedDate() != null && s.getFinishedDate() != null) {
            long secs = java.time.Duration.between(s.getCreatedDate(), s.getFinishedDate()).getSeconds();
            dto.setDurationSeconds(secs);
        }
        if (s.getTotalQuestions() != null && s.getTotalQuestions() > 0) {
            dto.setPercentCorrect(s.getNumCorrect() * 100f / s.getTotalQuestions());
        } else {
            dto.setPercentCorrect(0f);
        }
        // writing stats
        int wTotal = 0, wAnswered = 0;
        boolean hasReadingFill = false, readingFillPending = false;
        boolean hasListeningFill = false, listeningFillPending = false;
        if (s.getQuestions() != null) {
            for (PracticeSessionQuestion q : s.getQuestions()) {
                if (q.getQuestion()!=null && q.getQuestion().getLesson()!=null && q.getQuestion().getLesson().getSkill()==com.web.enums.Skill.WRITING) {
                    wTotal++;
                    if(q.getAnswerText()!=null){ wAnswered++; }
                }
                // Detect Reading/Listening FILL questions and pending grading state
                if(q.getQuestion()!=null && q.getQuestion().getLesson()!=null && q.getQuestion().getQuestionType()!=null){
                    com.web.enums.Skill skill = q.getQuestion().getLesson().getSkill();
                    String qt = q.getQuestion().getQuestionType();
                    boolean isFill = isFillVariant(qt);
                    if(isFill && (skill == com.web.enums.Skill.READING || skill == com.web.enums.Skill.LISTENING)){
                        boolean answered = q.getAnswerText()!=null && !q.getAnswerText().trim().isEmpty();
                        boolean graded = Boolean.TRUE.equals(q.getPracticeGraded()) || Boolean.TRUE.equals(q.getGraded()) || q.getCorrect()!=null;
                        boolean pending = answered && !graded; // user đã trả lời nhưng chưa được chấm tay/tự động
                        if(skill == com.web.enums.Skill.READING){
                            hasReadingFill = true;
                            if(pending){ readingFillPending = true; }
                        } else if(skill == com.web.enums.Skill.LISTENING){
                            hasListeningFill = true;
                            if(pending){ listeningFillPending = true; }
                        }
                    }
                }
            }
        }
        dto.setWritingTotal(wTotal);
        dto.setWritingAnswered(wAnswered);
        dto.setWritingPending(wTotal - wAnswered);
        // fill grading completion flags: if no fill for that skill, treat as completed
        dto.setReadingFillGradedCompleted(!hasReadingFill || !readingFillPending);
        dto.setListeningFillGradedCompleted(!hasListeningFill || !listeningFillPending);
        // Bổ sung thông tin người dùng cho DTO để hiển thị ở ketquaonluyen
        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getId());
            dto.setUsername(s.getUser().getUsername());
            // Thêm fullName nếu entity User có
            if (s.getUser().getFullName() != null) {
                dto.setFullName(s.getUser().getFullName());
            }
        }
        // compute overallBand for this session based on per-skill averages
        Float overallBand = computeSessionOverallBand(s);
        dto.setOverallBand(overallBand);
        return dto;
    }

    public PracticeSessionDto startDto(Long resultId, String modeStr) {
        PracticeMode mode = PracticeMode.WRONG_ONLY;
        try {
            if (modeStr != null && !modeStr.isEmpty()) {
                mode = PracticeMode.valueOf(modeStr);
            }
        } catch (Exception e) {
            // Default to WRONG_ONLY nếu parse lỗi
        }
        return toDto(start(resultId, mode));
    }

    // Overload cũ
    public PracticeSessionDto startDto(Long resultId) {
        return toDto(start(resultId));
    }

    public PracticeSessionDto finishDto(Long sessionId) {
        return toDto(finish(sessionId));
    }

    public PracticeSessionDto getSessionDto(Long sessionId) {
        return toDto(getSession(sessionId));
    }

    public List<PracticeSessionDto> listUserSessions() {
        User user = userUtils.getUserWithAuthority();
        List<PracticeSession> list = practiceSessionRepository.findByUser(user.getId());
        return list.stream()
                .sorted((a, b) -> b.getCreatedDate().compareTo(a.getCreatedDate()))
                .map(this::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public PracticeQuestionDto gradeSkill(Long psqId, Integer score, String feedback){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null){ throw new MessageException("Thiếu thông tin câu hỏi"); }
        com.web.enums.Skill sk = psq.getQuestion().getLesson().getSkill();
        if(sk == com.web.enums.Skill.WRITING){ throw new MessageException("Dùng endpoint grade-writing cho Writing"); }
        if(score!=null){
            psq.setPracticeScore(score);
            // Set correct field based on score (1 = correct, 0 = incorrect)
            psq.setCorrect(score == 1);
        }
        psq.setPracticeFeedback(feedback);
        psq.setPracticeGraded(true);
        practiceSessionQuestionRepository.save(psq);
        try{
            PracticeGradeHistory h = new PracticeGradeHistory();
            h.setPsqId(psq.getId());
            h.setScore(score);
            h.setFeedback(feedback);
            h.setGraderId(userUtils.getUserWithAuthority().getId());
            h.setGradedAt(LocalDateTime.now());
            practiceGradeHistoryRepository.save(h);
        }catch(Exception ignore){ }
        return mapToDto(psq);
    }

    public PracticeQuestionDto gradeWriting(Long psqId, Integer score, String feedback){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null || psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.WRITING){
            throw new MessageException("Không phải câu Writing");
        }
        if(psq.getAnswerText()==null){
            throw new MessageException("Chưa có bài viết để chấm");
        }
        // Luôn cập nhật điểm và nhận xét mới nhất
        if(score!=null){ psq.setManualScore(score); }
        psq.setFeedback(feedback);
        psq.setGraded(true);
        psq.setWritingStatus(WritingStatus.GRADED);
        practiceSessionQuestionRepository.save(psq);
        // Lưu lịch sử
        try{
            PracticeGradeHistory h = new PracticeGradeHistory();
            h.setPsqId(psq.getId());
            h.setScore(score);
            h.setFeedback(feedback);
            h.setGraderId(userUtils.getUserWithAuthority().getId());
            h.setGradedAt(LocalDateTime.now());
            practiceGradeHistoryRepository.save(h);
        }catch(Exception ignore){ }
        return mapToDto(psq);
    }

    // Admin listing of writing answers by exam
    public List<PracticeQuestionDto> listWritingAnswersByExam(Long examId){
        List<PracticeSessionQuestion> all = practiceSessionQuestionRepository.findByExam(examId);
        List<PracticeQuestionDto> dtoList = new ArrayList<>();
        for(PracticeSessionQuestion psq : all){
            if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null) continue;
            if(psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.WRITING) continue;
            if(psq.getAnswerText()==null) continue; // only those submitted
            PracticeQuestionDto dto = mapToDto(psq);
            if(psq.getSession()!=null && psq.getSession().getUser()!=null){
                dto.setUserId(psq.getSession().getUser().getId());
                dto.setUsername(psq.getSession().getUser().getUsername());
            }
            dtoList.add(dto);
        }
        // Sort: pending first then graded, then by id descending
        dtoList.sort((a,b)->{
            // We want PENDING before GRADED
            if(!Objects.equals(a.getWritingStatus(), b.getWritingStatus())){
                if("PENDING".equals(a.getWritingStatus()) && "GRADED".equals(b.getWritingStatus())) return -1;
                if("GRADED".equals(a.getWritingStatus()) && "PENDING".equals(b.getWritingStatus())) return 1;
            }
            return b.getId().compareTo(a.getId());
        });
        return dtoList;
    }

    public List<PracticeSessionDto> listSessionsByExam(Long examId){
        List<PracticeSession> list = practiceSessionRepository.findByExam(examId);
        return list.stream().map(s -> {
            PracticeSessionDto dto = toDto(s);
            if(s.getUser()!=null){
                dto.setUserId(s.getUser().getId());
                dto.setUsername(s.getUser().getUsername());
            }
            return dto;
        }).sorted((a,b)->{
            // newest first
            if(a.getCreatedDate()!=null && b.getCreatedDate()!=null){
                return b.getCreatedDate().compareTo(a.getCreatedDate());
            }
            return b.getId().compareTo(a.getId());
        }).collect(Collectors.toList());
    }

    public List<PracticeUserSummaryDto> listUserSummariesByExam(Long examId){
        List<PracticeSession> sessions = practiceSessionRepository.findByExam(examId);
        Map<Long, PracticeUserSummaryDto> map = new HashMap<>();
        for(PracticeSession s : sessions){
            if(s.getUser()==null) continue;
            Long uid = s.getUser().getId();
            PracticeUserSummaryDto dto = map.get(uid);
            if(dto==null){
                dto = new PracticeUserSummaryDto();
                dto.setUserId(uid);
                dto.setUsername(s.getUser().getUsername());
                dto.setFullName(s.getUser().getFullName());
                dto.setNumSessions(0); dto.setTotalQuestions(0); dto.setTotalAnswered(0); dto.setTotalCorrect(0);
                dto.setWritingSubmitted(0); dto.setWritingPending(0); dto.setWritingGraded(0);
                map.put(uid, dto);
            }
            dto.setNumSessions(dto.getNumSessions()+1);
            int tq = s.getTotalQuestions()!=null? s.getTotalQuestions():0;
            int na = s.getNumAnswered()!=null? s.getNumAnswered():0;
            int nc = s.getNumCorrect()!=null? s.getNumCorrect():0;
            dto.setTotalQuestions(dto.getTotalQuestions()+tq);
            dto.setTotalAnswered(dto.getTotalAnswered()+na);
            dto.setTotalCorrect(dto.getTotalCorrect()+nc);
            if(s.getQuestions()!=null){
                for(PracticeSessionQuestion psq : s.getQuestions()){
                    if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null) continue;
                    if(psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.WRITING) continue;
                    if(psq.getAnswerText()!=null){
                        dto.setWritingSubmitted(dto.getWritingSubmitted()+1);
                        if(Boolean.TRUE.equals(psq.getGraded())){ dto.setWritingGraded(dto.getWritingGraded()+1); }
                        else { dto.setWritingPending(dto.getWritingPending()+1); }
                    }
                }
            }
        }
        // Include enrolled users without sessions
        Exam exam = examRepository.findById(examId).orElse(null);
        if(exam!=null && exam.getCourse()!=null){
            List<CourseUser> enrolled = courseUserRepository.findByCourse(exam.getCourse().getId());
            for(CourseUser cu : enrolled){
                if(cu.getUser()==null) continue;
                Long uid = cu.getUser().getId();
                if(!map.containsKey(uid)){
                    PracticeUserSummaryDto dto = new PracticeUserSummaryDto();
                    dto.setUserId(uid);
                    dto.setUsername(cu.getUser().getUsername());
                    dto.setFullName(cu.getUser().getFullName());
                    dto.setNumSessions(0);
                    dto.setTotalQuestions(0); dto.setTotalAnswered(0); dto.setTotalCorrect(0);
                    dto.setPercentCorrectOverall(0f);
                    dto.setWritingSubmitted(0); dto.setWritingPending(0); dto.setWritingGraded(0);
                    map.put(uid, dto);
                }
            }
        }
        // Set skill availability for all summaries from exam lessons
        if(exam != null && exam.getLessons() != null){
            boolean hasR=false, hasL=false, hasS=false, hasW=false;
            for(Lesson lesson : exam.getLessons()){
                if(lesson.getSkill()==com.web.enums.Skill.READING) hasR=true;
                else if(lesson.getSkill()==com.web.enums.Skill.LISTENING) hasL=true;
                else if(lesson.getSkill()==com.web.enums.Skill.SPEAKING) hasS=true;
                else if(lesson.getSkill()==com.web.enums.Skill.WRITING) hasW=true;
            }
            for(PracticeUserSummaryDto dto : map.values()){
                dto.setHasReading(hasR);
                dto.setHasListening(hasL);
                dto.setHasSpeaking(hasS);
                dto.setHasWriting(hasW);
            }
        }
        List<PracticeUserSummaryDto> list = new ArrayList<>(map.values());
        for(PracticeUserSummaryDto d : list){
            if(d.getTotalQuestions()!=null && d.getTotalQuestions()>0){
                d.setPercentCorrectOverall(d.getTotalCorrect()*100f/d.getTotalQuestions());
            } else if(d.getPercentCorrectOverall()==null){ d.setPercentCorrectOverall(0f); }
        }
        list.sort((a,b)->{
            int cmp = b.getNumSessions().compareTo(a.getNumSessions());
            if(cmp!=0) return cmp;
            return Float.compare(b.getPercentCorrectOverall(), a.getPercentCorrectOverall());
        });
        return list;
    }

    public List<PracticeQuestionDto> listSkillAnswersByExam(Long examId, String skill){
        com.web.enums.Skill sk;
        try { sk = com.web.enums.Skill.valueOf(skill.toUpperCase()); } catch(Exception e){ throw new MessageException("Skill không hợp lệ"); }
        List<PracticeSessionQuestion> all = practiceSessionQuestionRepository.findByExam(examId);
        List<PracticeQuestionDto> dtoList = new ArrayList<>();
        for(PracticeSessionQuestion psq : all){
            if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null) continue;
            if(psq.getQuestion().getLesson().getSkill()!= sk) continue;
            // Writing handled by dedicated endpoint
            if(sk == com.web.enums.Skill.WRITING){ continue; }
            boolean include = true;
            // For MCQ we previously required answered; now we include even if chưa trả lời để hiển thị cho giáo viên
            // but keep SPEAKING placeholder logic
            if(sk == com.web.enums.Skill.SPEAKING){
                // speaking: include all speaking practice questions (audio or prompt)
                include = true;
            }
            if(sk == com.web.enums.Skill.READING || sk == com.web.enums.Skill.LISTENING){
                // include regardless of answered state
                include = true;
            }
            if(!include) continue;
            PracticeQuestionDto dto = mapToDto(psq);
            if(psq.getSession()!=null && psq.getSession().getUser()!=null){
                dto.setUserId(psq.getSession().getUser().getId());
                dto.setUsername(psq.getSession().getUser().getUsername());
            }
            dtoList.add(dto);
        }
        dtoList.sort((a,b)-> b.getId().compareTo(a.getId()));
        return dtoList;
    }


    public PracticeSessionDto finishDto(Long sessionId, List<Map<String,Object>> fills){
        if(fills!=null && !fills.isEmpty()){
            // persist fill answers before finishing
            for(Map<String,Object> f : fills){
                try{
                    Long qid = null;
                    if(f.get("questionId") instanceof Number){ qid = ((Number)f.get("questionId")).longValue(); }
                    else if(f.get("questionId") instanceof String){ qid = Long.valueOf((String)f.get("questionId")); }
                    String answerText = f.get("answerText")!=null? String.valueOf(f.get("answerText")) : null;
                    if(qid==null || answerText==null || answerText.trim().isEmpty()) continue;
                    PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(qid).orElse(null);
                    if(psq==null) continue;
                    if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null) continue;
                    // Only allow fill answers for non-writing FILL questions
                    if(psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.WRITING) continue;
                    String qt = psq.getQuestion().getQuestionType();
                    if(qt==null || !qt.equalsIgnoreCase("FILL")) continue;
                    // Save text
                    psq.setAnswerText(answerText.trim());
                    psq.setAnsweredAt(LocalDateTime.now());
                    practiceSessionQuestionRepository.save(psq);
                }catch(Exception ignore){ }
            }
        }
        return toDto(finish(sessionId));
    }

    public PracticeQuestionDto answerFill(Long psqId, String answerText){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        PracticeSession session = psq.getSession();
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        if(psq.getQuestion()==null || psq.getQuestion().getQuestionType()==null){
            throw new MessageException("Thiếu loại câu hỏi");
        }
        String qt = psq.getQuestion().getQuestionType();
        if(!isFillVariant(qt)){
            throw new MessageException("Không phải câu FILL");
        }
        // Writing excluded; handled separately
        if(psq.getQuestion().getLesson()!=null && psq.getQuestion().getLesson().getSkill()==com.web.enums.Skill.WRITING){
            throw new MessageException("Dùng endpoint writing cho Writing");
        }
        String txt = answerText!=null? answerText.trim() : null;
        boolean first = (psq.getAnswerText()==null || psq.getAnswerText().trim().isEmpty()) && txt!=null && !txt.isEmpty();
        if(txt!=null){ psq.setAnswerText(txt); psq.setAnsweredAt(LocalDateTime.now()); }
        practiceSessionQuestionRepository.save(psq);
        if(first){
            session.setNumAnswered(session.getNumAnswered()+1);
            // Auto correctness attempt: compare against FILL template answers
            try{
                List<Answer> templates = psq.getQuestion().getAnswers();
                String normUser = txt.toLowerCase().trim().replaceAll("\\s+"," ");
                boolean matched=false;
                for(Answer a: templates){
                    // Instead of answerType, use title pattern for FILL detection
                    String expect = a.getTitle()!=null? a.getTitle().toLowerCase().trim().replaceAll("\\s+"," ") : "";
                    // If the expected answer contains underscores or 'blank', treat as FILL
                    boolean isFill = expect.contains("___") || expect.contains("blank");
                    if(isFill){
                        if(!expect.isEmpty() && expect.equals(normUser)){
                            matched=true; break;
                        }
                    }
                }
                psq.setCorrect(matched);
                practiceSessionQuestionRepository.save(psq);
                if(matched){ session.setNumCorrect(session.getNumCorrect()+1); }
            }catch(Exception ignore){ }
            if(session.getNumAnswered().equals(session.getTotalQuestions())){
                session.setCompleted(true); session.setFinishedDate(LocalDateTime.now());
            }
            practiceSessionRepository.save(session);
        }
        return mapToDto(psq);
    }

    public List<Map<String,Object>> listSkillHistory(Long psqId){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null){ throw new MessageException("Thiếu thông tin câu hỏi"); }
        List<PracticeGradeHistory> list = practiceGradeHistoryRepository.findByPsqIdOrderByGradedAtDesc(psqId);
        List<Map<String,Object>> out = new ArrayList<>();
        for(PracticeGradeHistory h : list){
            Map<String,Object> item = new HashMap<>();
            item.put("score", h.getScore());
            item.put("feedback", h.getFeedback());
            item.put("gradedAt", h.getGradedAt()!=null? h.getGradedAt().toString(): null);
            String graderName = null;
            try{
                if(h.getGraderId()!=null){
                    User u = userRepository.findById(h.getGraderId()).orElse(null);
                    if(u!=null){ graderName = u.getFullName()!=null? u.getFullName() : u.getUsername(); }
                }
            }catch(Exception e){ }
            item.put("graderName", graderName);
            // expose skill so clients can format 1/0 as Đúng/Sai for Reading/Listening
            String skillName = psq.getQuestion().getLesson().getSkill()!=null
                ? psq.getQuestion().getLesson().getSkill().name()
                : null;
            item.put("skill", skillName);
            item.put("skillName", skillName); // legacy key for older UIs
            out.add(item);
        }
        return out;
    }

    public PracticeQuestionDto answerSpeakingUrl(Long psqId, String audioUrl){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        PracticeSession session = psq.getSession();
        if (!session.getUser().getId().equals(userUtils.getUserWithAuthority().getId())) {
            throw new MessageException("Không có quyền");
        }
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null || psq.getQuestion().getLesson().getSkill()!= com.web.enums.Skill.SPEAKING){
            throw new MessageException("Không phải câu Speaking");
        }
        if(audioUrl==null || audioUrl.trim().isEmpty()){
            throw new MessageException("Thiếu audioUrl");
        }
        boolean first = psq.getSpeakingAudio()==null;
        psq.setSpeakingAudio(audioUrl.trim());
        // Append to answerText history
        String existing = psq.getAnswerText();
        if(existing!=null && !existing.isBlank()){
            psq.setAnswerText(existing + "\n" + audioUrl.trim());
        } else {
            psq.setAnswerText(audioUrl.trim());
        }
        psq.setSpeakingAttempts(psq.getSpeakingAttempts()==null?1:psq.getSpeakingAttempts()+1);
        psq.setAnsweredAt(LocalDateTime.now());
        practiceSessionQuestionRepository.save(psq);
        if(first){
            session.setNumAnswered(session.getNumAnswered()+1);
            if(session.getNumAnswered().equals(session.getTotalQuestions())){
                session.setCompleted(true);
                session.setFinishedDate(LocalDateTime.now());
            }
            practiceSessionRepository.save(session);
        }
        return mapToDto(psq);
    }

    public List<Map<String,Object>> listPracticeHistory(Long psqId){
        PracticeSessionQuestion psq = practiceSessionQuestionRepository.findById(psqId).orElseThrow(() -> new MessageException("Không tìm thấy câu"));
        if(psq.getQuestion()==null || psq.getQuestion().getLesson()==null){ throw new MessageException("Thiếu thông tin câu hỏi"); }
        List<PracticeGradeHistory> list = practiceGradeHistoryRepository.findByPsqIdOrderByGradedAtDesc(psqId);
        List<Map<String,Object>> out = new ArrayList<>();
        for(PracticeGradeHistory h : list){
            Map<String,Object> item = new HashMap<>();
            item.put("score", h.getScore());
            item.put("feedback", h.getFeedback());
            item.put("gradedAt", h.getGradedAt()!=null? h.getGradedAt().toString(): null);
            item.put("graderId", h.getGraderId());
            out.add(item);
        }
        return out;
    }

    public long countUserPracticeSessions() {
        return practiceSessionRepository.countByUser_Id(userUtils.getUserWithAuthority().getId());
    }

    /**
     * Thống kê điểm ôn luyện (thang 0-9) theo ngày cho học viên hiện tại,
     * lấy score mới nhất từ PracticeGradeHistory cho mỗi câu (nếu có),
     * fallback sang manualScore/practiceScore nếu chưa có history, rồi chia trung bình theo ngày.
     * Logic này gần với overallBand trên trang ketquaonluyen: mỗi điểm là band cuối cùng của câu.
     */
    public java.util.Map<String, Object> getUserPracticeStatsByDay() {
        User user = userUtils.getUserWithAuthority();
        java.util.List<PracticeSession> sessions = practiceSessionRepository.findByUser(user.getId());
        java.util.Map<String, java.util.List<Double>> byDate = new java.util.HashMap<>();
        if (sessions != null) {
            for (PracticeSession s : sessions) {
                String day = s.getCreatedDate() != null ? s.getCreatedDate().toLocalDate().toString() : null;
                if (day == null) continue;
                Float overall = computeSessionOverallBand(s);
                if (overall == null) continue;
                byDate.computeIfAbsent(day, k -> new java.util.ArrayList<>()).add(overall.doubleValue());
            }
        }
        java.util.List<String> labels = new java.util.ArrayList<>(byDate.keySet());
        java.util.Collections.sort(labels);
        java.util.List<Double> scores = new java.util.ArrayList<>();
        for (String day : labels) {
            java.util.List<Double> list = byDate.get(day);
            if (list == null || list.isEmpty()) {
                scores.add(0d);
            } else {
                double sum = 0d;
                for (Double v : list) sum += v;
                scores.add(sum / list.size()); // average per-session overall band (chia theo số bài thi)
            }
        }
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("labels", labels);
        res.put("data", scores);
        return res;
    }

    /**
     * Điểm ôn luyện trung bình tổng thể (overall) cho học viên hiện tại,
     * tính trung bình overallBand của từng phiên ôn luyện.
     */
    public double getUserPracticeOverallAverage() {
        User user = userUtils.getUserWithAuthority();
        java.util.List<PracticeSession> sessions = practiceSessionRepository.findByUser(user.getId());
        if (sessions == null || sessions.isEmpty()) return 0d;
        double sum = 0d;
        int count = 0;
        for (PracticeSession s : sessions) {
            // Chỉ tính những phiên đã hoàn thành để tránh kéo lệch
            if (!Boolean.TRUE.equals(s.getCompleted())) continue;
            Float overall = computeSessionOverallBand(s);
            if (overall == null) continue;
            sum += overall;
            count++;
        }
        return count == 0 ? 0d : sum / count;
    }
}
