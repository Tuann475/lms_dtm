package com.web.service;

import com.web.dto.*;
import com.web.entity.*;
import com.web.enums.Skill;
import com.web.exception.MessageException;
import com.web.mapper.ResultExamMapper;
import com.web.repository.AnswerRepository;
import com.web.repository.ExamRepository;
import com.web.repository.ResultExamRepository;
import com.web.repository.ResultRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class ResultService {

    @Autowired
    private ResultRepository resultRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ResultExamRepository resultExamRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private com.web.repository.ExamGradeHistoryRepository examGradeHistoryRepository;
    @Autowired
    private com.web.repository.QuestionRepository questionRepository;
    @Autowired
    private com.web.repository.SpeakingSubmissionRepository speakingSubmissionRepository;


    public void save(Result result) {
        result.setCreatedDate(LocalDateTime.now());
        result.setUser(userUtils.getUserWithAuthority());
        resultRepository.save(result);
    }

    public List<Result> findByUser() {
        return resultRepository.findByUser(userUtils.getUserWithAuthority().getId());
    }

    public ResultResponse create(Long examId, List<Long> answer, String thoiGianht) {
        User user = userUtils.getUserWithAuthority();
        Optional<Result> result = resultRepository.findByUserAndExam(user.getId(), examId);
        // Idempotent: if already has a result for this exam, just return existing response
        if (result.isPresent()) {
            Result existing = result.get();
            syncSpeakingSubmissions(existing);
            List<Question> tongCauHoi = new ArrayList<>();
            for (Lesson lesson : existing.getExam().getLessons()) {
                tongCauHoi.addAll(lesson.getQuestions());
            }
            return buildResultResponse(existing, tongCauHoi);
        }
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new MessageException("Exam not found"));
        List<Answer> daTraLoi = answerRepository.findAllById(answer);
        List<Question> tongCauHoi = new ArrayList<>();
        for (Lesson lesson : exam.getLessons()) {
            tongCauHoi.addAll(lesson.getQuestions());
        }
        Result re = new Result();
        Integer tongChuaTl = tongCauHoi.size() - daTraLoi.size();
        re.setUser(user);
        re.setCreatedDate(LocalDateTime.now());
        re.setExam(exam);
        re.setFinishTime(thoiGianht);
        re.setNumNotWork(tongChuaTl);

        Integer tongDung = 0;
        Integer tongSai = 0;
        for (Answer a : daTraLoi) {
            if (a.getIsTrue() == true) {
                ++tongDung;
            } else {
                ++tongSai;
            }
        }
        re.setNumFalse(tongSai);
        re.setNumTrue(tongDung);
        resultRepository.save(re);
        for (Answer a : daTraLoi) {
            ResultExam resultExam = new ResultExam();
            resultExam.setResult(re);
            resultExam.setAnswer(a);
            resultExam.setQuestion(a.getQuestion());
            resultExamRepository.save(resultExam);
        }
        syncSpeakingSubmissions(re);
        ResultResponse resultResponse = buildResultResponse(re, tongCauHoi);
        return resultResponse;
    }

    public ResultResponse createWithWriting(ExamSubmissionDto submission) {
        User user = userUtils.getUserWithAuthority();
        Optional<Result> existingOpt = resultRepository.findByUserAndExam(user.getId(), submission.getExamId());
        if (existingOpt.isPresent()) {
            // Idempotent re-submit: attach any new writing answers not yet stored
            Result existing = existingOpt.get();
            Exam exam = existing.getExam();
            if (submission.getWritings() != null && !submission.getWritings().isEmpty()) {
                List<ResultExam> currentWriting = resultExamRepository.findWritingByResult(existing.getId());
                java.util.Set<Long> writtenQuestionIds = new java.util.HashSet<>();
                for (ResultExam we : currentWriting) {
                    if (we.getQuestion() != null) {
                        writtenQuestionIds.add(we.getQuestion().getId());
                    }
                }
                for (WritingSubmissionDto w : submission.getWritings()) {
                    if (w.getQuestionId() != null && !writtenQuestionIds.contains(w.getQuestionId())) {
                        // find question
                        Question qFound = null;
                        for (Lesson lesson : exam.getLessons()) {
                            for (Question question : lesson.getQuestions()) {
                                if (question.getId().equals(w.getQuestionId())) { qFound = question; break; }
                            }
                            if (qFound != null) break;
                        }
                        if (qFound != null) {
                            ResultExam we = new ResultExam();
                            we.setResult(existing);
                            we.setQuestion(qFound);
                            we.setAnswerText(w.getAnswerText());
                            resultExamRepository.save(we);
                        }
                    }
                }
            }
            syncSpeakingSubmissions(existing);
            List<Question> tongCauHoi = new ArrayList<>();
            for (Lesson lesson : exam.getLessons()) { tongCauHoi.addAll(lesson.getQuestions()); }
            return buildResultResponse(existing, tongCauHoi);
        }
        Exam exam = examRepository.findById(submission.getExamId()).orElseThrow(() -> new MessageException("Exam not found"));
        List<Answer> daTraLoi = answerRepository.findAllById(submission.getAnswerIds());
        List<Question> tongCauHoi = new ArrayList<>();
        for (Lesson lesson : exam.getLessons()) {
            tongCauHoi.addAll(lesson.getQuestions());
        }
        Result re = new Result();
        re.setUser(user);
        re.setCreatedDate(LocalDateTime.now());
        re.setExam(exam);
        re.setFinishTime(submission.getTime());

        int answeredCount = daTraLoi.size();
        if (submission.getWritings() != null) {
            answeredCount += submission.getWritings().size();
        }
        re.setNumNotWork(tongCauHoi.size() - answeredCount);

        int tongDung = 0;
        int tongSai = 0;
        for (Answer a : daTraLoi) {
            if (Boolean.TRUE.equals(a.getIsTrue())) {
                ++tongDung;
            } else {
                ++tongSai;
            }
        }
        re.setNumFalse(tongSai);
        re.setNumTrue(tongDung);
        resultRepository.save(re);

        for (Answer a : daTraLoi) {
            ResultExam resultExam = new ResultExam();
            resultExam.setResult(re);
            resultExam.setAnswer(a);
            resultExam.setQuestion(a.getQuestion());
            resultExamRepository.save(resultExam);
        }
        if (submission.getWritings() != null) {
            for (WritingSubmissionDto w : submission.getWritings()) {
                Question q = null;
                for (Lesson lesson : exam.getLessons()) {
                    for (Question question : lesson.getQuestions()) {
                        if (question.getId().equals(w.getQuestionId())) {
                            q = question;
                            break;
                        }
                    }
                    if (q != null) break;
                }
                if (q == null) {
                    throw new MessageException("Question writing not in exam");
                }
                ResultExam we = new ResultExam();
                we.setResult(re);
                we.setQuestion(q);
                we.setAnswerText(w.getAnswerText());
                resultExamRepository.save(we);
            }
        }
        syncSpeakingSubmissions(re);
        return buildResultResponse(re, tongCauHoi);
    }

    public ResultResponse createWithWritingAndFills(ExamSubmissionDto submission) {
        User user = userUtils.getUserWithAuthority();
        Optional<Result> existingOpt = resultRepository.findByUserAndExam(user.getId(), submission.getExamId());
        Result re;
        Exam exam = examRepository.findById(submission.getExamId()).orElseThrow(() -> new MessageException("Exam not found"));
        if (existingOpt.isPresent()) {
            re = existingOpt.get();
        } else {
            re = new Result();
            re.setUser(user);
            re.setCreatedDate(LocalDateTime.now());
            re.setExam(exam);
            re.setFinishTime(submission.getTime());
            resultRepository.save(re);
        }
        // persist MCQ answers
        if (submission.getAnswerIds() != null) {
            List<Answer> daTraLoi = answerRepository.findAllById(submission.getAnswerIds());
            for (Answer a : daTraLoi) {
                ResultExam resultExam = new ResultExam();
                resultExam.setResult(re);
                resultExam.setAnswer(a);
                resultExam.setQuestion(a.getQuestion());
                resultExamRepository.save(resultExam);
            }
        }
        // persist Writing
        if (submission.getWritings() != null) {
            for (WritingSubmissionDto w : submission.getWritings()) {
                Question q = questionRepository.findById(w.getQuestionId()).orElse(null);
                if (q == null) continue;
                ResultExam existingRe = resultExamRepository.findByResultIdAndQuestionId(re.getId(), q.getId());
                if (existingRe != null) {
                    existingRe.setAnswerText(w.getAnswerText());
                    resultExamRepository.save(existingRe);
                } else {
                    ResultExam we = new ResultExam();
                    we.setResult(re);
                    we.setQuestion(q);
                    we.setAnswerText(w.getAnswerText());
                    resultExamRepository.save(we);
                }
            }
        }
        // persist FILL answers into answerText
        if (submission.getFills() != null) {
            for (FillSubmissionDto f : submission.getFills()) {
                Question q = questionRepository.findById(f.getQuestionId()).orElse(null);
                if (q == null) continue;
                ResultExam existingRe = resultExamRepository.findByResultIdAndQuestionId(re.getId(), q.getId());
                if (existingRe != null) {
                    existingRe.setAnswerText(f.getAnswerText());
                    resultExamRepository.save(existingRe);
                } else {
                    ResultExam fe = new ResultExam();
                    fe.setResult(re);
                    fe.setQuestion(q);
                    fe.setAnswerText(f.getAnswerText());
                    resultExamRepository.save(fe);
                }
            }
        }
        syncSpeakingSubmissions(re);
        // rebuild response stats
        List<Question> tongCauHoi = new ArrayList<>();
        for (Lesson lesson : exam.getLessons()) { tongCauHoi.addAll(lesson.getQuestions()); }
        return buildResultResponse(re, tongCauHoi);
    }

    private boolean isFillType(String qType){
        if(qType == null) return false;
        String t = qType.trim().toUpperCase();
        return t.equals("FILL") || t.equals("INPUT") || t.equals("SHORT_ANSWER");
    }
    private String normalize(String s){
        if(s == null) return "";
        return s.trim().replaceAll("\\s+"," ").toLowerCase();
    }

    private ResultResponse buildResultResponse(Result re, List<Question> tongCauHoi) {
        // Recompute counters (auto grading including FILL) always for consistency
        int trueCount = 0;
        int falseCount = 0;
        int notWork = 0;
        List<ResultExam> answered = resultExamRepository.findByResult_Id(re.getId());
        java.util.Map<Long, ResultExam> byQuestion = new java.util.HashMap<>();
        if(answered!=null){ for(ResultExam rx: answered){ if(rx.getQuestion()!=null) byQuestion.put(rx.getQuestion().getId(), rx); } }
        for(Question q : tongCauHoi){
            if(q.getLesson().getSkill() == Skill.WRITING) continue; // writing excluded from auto tally
            ResultExam rx = byQuestion.get(q.getId());
            String qType = q.getQuestionType();
            if(rx == null){ // no submission
                notWork++; continue;
            }
            // If MCQ (has Answer linked) use isTrue flag
            if(rx.getAnswer()!=null){
                if(Boolean.TRUE.equals(rx.getAnswer().getIsTrue())) trueCount++; else falseCount++;
                continue;
            }
            // FILL type: compare answerText vs expected answer templates
            if(isFillType(qType)){
                String userAns = normalize(rx.getAnswerText());
                if(userAns.isEmpty()){ notWork++; continue; }
                // fetch expected answers (answerType = FILL)
                List<Answer> templates = answerRepository.findByQuestion(q.getId());
                boolean matched = false;
                for(Answer a : templates){
                    if(a!=null){
                        String expect = normalize(a.getTitle());
                        boolean isFill = expect.contains("___") || expect.contains("blank");
                        if(isFill && !expect.isEmpty() && expect.equals(userAns)){
                            matched = true; break;
                        }
                    }
                }
                if(matched) trueCount++; else falseCount++;
            } else {
                // Non-writing non-MCQ without answer object and not FILL: treat as not worked
                notWork++;
            }
        }
        re.setNumTrue(trueCount);
        re.setNumFalse(falseCount);
        re.setNumNotWork(notWork);
        resultRepository.save(re);
        ResultResponse resultResponse = new ResultResponse();
        resultResponse.setSoCauBo(notWork);
        resultResponse.setTongCauHoi(tongCauHoi.size());
        resultResponse.setSoTLDung(trueCount);
        resultResponse.setSoTLSai(falseCount);
        resultResponse.setResult(re);
        int totalAuto = 0; // total auto-graded (non-writing)
        for(Question q: tongCauHoi){ if(q.getLesson().getSkill()!=Skill.WRITING) totalAuto++; }
        float tongCh = totalAuto == 0 ? 1 : totalAuto;
        resultResponse.setPhanTram((float)trueCount / tongCh * 100f);
        // Thêm điểm thang 10 (điểm số tuyệt đối dựa trên số câu đúng / tổng số câu tự chấm)
        resultResponse.setDiemThangMuoi(totalAuto == 0 ? 0f : roundHalf(((float) trueCount / (float) totalAuto) * 9f));

        // Writing stats
        List<ResultExam> writings = resultExamRepository.findWritingByResult(re.getId());
        int pending = 0;
        int graded = 0;
        Float totalScore = 0f; // giữ full .5
        Float task1Score = null;
        Float task2Score = null;
        for (ResultExam w : writings) {
            if (Boolean.TRUE.equals(w.getGraded())) {
                graded++;
                if (w.getManualScore() != null) {
                    Float ms = w.getManualScore();
                    totalScore += ms;
                    if (w.getQuestion() != null) {
                        String wt = w.getQuestion().getQuestionType();
                        if (wt != null) {
                            if (wt.equalsIgnoreCase("TASK1") && task1Score == null) task1Score = ms;
                            if (wt.equalsIgnoreCase("TASK2") && task2Score == null) task2Score = ms;
                        }
                    }
                }
            } else {
                pending++;
            }
        }
        resultResponse.setWritingPending(pending);
        resultResponse.setWritingGraded(graded);
        resultResponse.setTask1Score(task1Score);
        resultResponse.setTask2Score(task2Score);
        if (graded > 0) {
            float avgBand = totalScore / graded;
            resultResponse.setFinalWritingBand(roundHalf(avgBand));
        }

        // Reading band: dựa trên số câu đúng / (đúng + sai) trong các câu đã trả lời
        List<ResultExam> readings = resultExamRepository.findReadingByResult(re.getId());
        int readingCorrect = 0, readingWrong = 0;
        boolean readingHasPendingFill = false;
        for (ResultExam reExam : readings) {
            boolean ansR = false, corrR = false;
            // Detect fill-type by questionType when no MCQ answer is linked
            String qType = reExam.getQuestion() != null ? reExam.getQuestion().getQuestionType() : null;
            boolean isFill = isFillType(qType);
            // If this is a FILL question: check pending state based on graded/manualScore and presence of answerText
            if (isFill) {
                String userAns = normalize(reExam.getAnswerText());
                if (!userAns.isEmpty()) {
                    // learner has submitted something for this FILL
                    if (reExam.getGraded() == null || !reExam.getGraded()) {
                        readingHasPendingFill = true;
                    } else if (reExam.getManualScore() != null) {
                        ansR = true;
                        corrR = reExam.getManualScore() >= 1f; // manualScore: 1=đúng, 0=sai
                    }
                }
            } else {
                if (reExam.getAnswer() != null) {
                    ansR = true;
                    corrR = Boolean.TRUE.equals(reExam.getAnswer().getIsTrue());
                } else if (reExam.getManualScore() != null) {
                    ansR = true;
                    corrR = reExam.getManualScore() >= 1f; // manualScore: 1=đúng, 0=sai
                }
            }
            if (ansR) {
                if (corrR) readingCorrect++; else readingWrong++;
            }
        }
        int readingAnswered = readingCorrect + readingWrong;
        if (readingHasPendingFill) {
            resultResponse.setReadingBand("chờ chấm");
        } else if (readingAnswered > 0) {
            float readingBandVal = (readingCorrect / (float) readingAnswered) * 9f;
            resultResponse.setReadingBand(String.valueOf(roundHalf(readingBandVal)));
        } else {
            resultResponse.setReadingBand("chờ chấm");
        }

        // Listening band: dựa trên số câu đúng / (đúng + sai) trong các câu đã trả lời
        List<ResultExam> listenings = resultExamRepository.findListeningByResult(re.getId());
        int listeningCorrect = 0, listeningWrong = 0;
        boolean listeningHasPendingFill = false;
        for (ResultExam reExam : listenings) {
            boolean ansL = false, corrL = false;
            String qType = reExam.getQuestion() != null ? reExam.getQuestion().getQuestionType() : null;
            boolean isFill = isFillType(qType);
            if (isFill) {
                String userAns = normalize(reExam.getAnswerText());
                if (!userAns.isEmpty()) {
                    if (reExam.getGraded() == null || !reExam.getGraded()) {
                        listeningHasPendingFill = true;
                    } else if (reExam.getManualScore() != null) {
                        ansL = true;
                        corrL = reExam.getManualScore() >= 1f; // manualScore: 1=đúng, 0=sai
                    }
                }
            } else {
                if (reExam.getAnswer() != null) {
                    ansL = true;
                    corrL = Boolean.TRUE.equals(reExam.getAnswer().getIsTrue());
                } else if (reExam.getManualScore() != null) {
                    ansL = true;
                    corrL = reExam.getManualScore() >= 1f; // manualScore: 1=đúng, 0=sai
                }
            }
            if (ansL) {
                if (corrL) listeningCorrect++; else listeningWrong++;
            }
        }
        int listeningAnswered = listeningCorrect + listeningWrong;
        if (listeningHasPendingFill) {
            resultResponse.setListeningBand("chờ chấm");
        } else if (listeningAnswered > 0) {
            float listeningBandVal = (listeningCorrect / (float) listeningAnswered) * 9f;
            resultResponse.setListeningBand(String.valueOf(roundHalf(listeningBandVal)));
        } else {
            resultResponse.setListeningBand("chờ chấm");
        }

        // Speaking band: average of ExamGradeHistory score for this exam+user
        List<SpeakingSubmission> speakingSubmissions = speakingSubmissionRepository.findByExamIdAndUserIdOrderByCreatedDateDesc(re.getExam().getId(), re.getUser().getId());
        float speakingSum = 0f; int speakingCount = 0;
        for (SpeakingSubmission sub : speakingSubmissions) {
            ResultExam resultExam = resultExamRepository.findByResultIdAndQuestionId(re.getId(), sub.getQuestionId());
            Float latestScore = resultExam != null ? getLatestScoreFromExamGradeHistory(resultExam.getId(), Skill.SPEAKING) : null;
            if (latestScore != null) { speakingSum += latestScore; speakingCount++; }
        }
        if (speakingCount > 0) {
            String speakingBandStr = (speakingCount > 0) ? String.valueOf(roundHalf(speakingSum / speakingCount)) : "chờ chấm";
            resultResponse.setSpeakingBand(speakingBandStr);
        }
        // Overall band: only when all four present
        Float writingBand = resultResponse.getFinalWritingBand();
        String reading = resultResponse.getReadingBand();
        String listening = resultResponse.getListeningBand();
        String speaking = resultResponse.getSpeakingBand();
        if (writingBand != null && reading != null && !"chờ chấm".equals(reading) && listening != null && !"chờ chấm".equals(listening) && speaking != null && !"chờ chấm".equals(speaking)) {
            float overallRaw = (writingBand + Float.parseFloat(reading) + Float.parseFloat(listening) + Float.parseFloat(speaking)) / 4f;
            resultResponse.setOverallBand(String.valueOf(roundHalf(overallRaw)));
        } else {
            resultResponse.setOverallBand("chờ chấm");
        }

        return resultResponse;
    }

    private Float roundHalf(Float v) {
        if (v == null) return null;
        return Math.round(v * 2f) / 2f;
    }

    public List<ResultExam> getPendingWriting(Long examId) {
        return resultExamRepository.findPendingWritingByExam(examId);
    }

    @Transactional
    public ResultExam gradeWriting(Long resultExamId, Integer score, String feedback) {
        ResultExam re = resultExamRepository.findById(resultExamId).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.WRITING) {
            throw new MessageException("Not a writing answer");
        }
        if (score == null || score < 0 || score > 9) {
            throw new MessageException("Điểm writing phải trong khoảng 0 - 9");
        }
        re.setManualScore(score.floatValue());
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        // save history
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.WRITING);
        hist.setScore(score.floatValue());
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        return saved;
    }

    public WritingAnswerDto gradeWritingDto(Long resultExamId, Float score, String feedback) {
        ResultExam re = resultExamRepository.findById(resultExamId).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.WRITING) {
            throw new MessageException("Not a writing answer");
        }
        if (score == null || score < 0 || score > 9) {
            throw new MessageException("Điểm writing phải trong khoảng 0 - 9");
        }
        // Allow regrade multiple times
        re.setManualScore(score);
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        // Lưu lịch sử bằng ExamGradeHistory
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.WRITING);
        hist.setScore(score);
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        return toWritingDto(saved);
    }

    private WritingAnswerDto toWritingDto(ResultExam re) {
        WritingAnswerDto dto = new WritingAnswerDto();
        dto.setId(re.getId());
        if (re.getQuestion() != null) {
            dto.setQuestionId(re.getQuestion().getId());
            dto.setQuestionTitle(re.getQuestion().getTitle());
            dto.setWritingType(re.getQuestion().getQuestionType());
        }
        dto.setAnswerText(re.getAnswerText());
        // trả đúng Float manualScore (ví dụ 8.5) cho client, không làm tròn
        dto.setManualScore(re.getManualScore());
        dto.setFeedback(re.getFeedback());
        dto.setGraded(re.getGraded());
        return dto;
    }

    public ResultResponse getByExamAndUser(Long examId, Long userId) {
        Optional<Result> result = resultRepository.findByUserAndExam(userId, examId);
        if (result.isEmpty()) {
            throw new MessageException("Không tìm thấy kết quả");
        }
        Result re = result.get();
        List<Question> tongCauHoi = new ArrayList<>();
        for (Lesson lesson : re.getExam().getLessons()) {
            tongCauHoi.addAll(lesson.getQuestions());
        }
        return buildResultResponse(re, tongCauHoi);
    }

    public List<ResultResponse> findByExam(Long examId) {
        List<Result> list = resultRepository.findByExam(examId);
        List<ResultResponse> result = new ArrayList<>();
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new MessageException("Exam not found"));
        List<Question> tongCauHoi = new ArrayList<>();
        for (Lesson lesson : exam.getLessons()) {
            tongCauHoi.addAll(lesson.getQuestions());
        }
        for (Result re : list) {
            result.add(buildResultResponse(re, tongCauHoi));
        }
        return result;
    }

    @Transactional
    public void deleteByExamId(Long examId) {
        // fetch all results of exam then delete histories then results
        List<Result> results = resultRepository.findByExam(examId);
        // Đã xoá writingGradeHistoryRepository.deleteByResultId(r.getId());
        resultRepository.deleteByExamId(examId);
    }



    /**
     * Lấy danh sách điểm chấm từ lịch sử chấm điểm ExamGradeHistory cho một bài thi và kỹ năng.
     */
    public List<Float> getScoreFromExamGradeHistory(Long resultExamId, Skill skill) {
        List<ExamGradeHistory> histories = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, skill);
        List<Float> scores = new ArrayList<>();
        for (ExamGradeHistory h : histories) {
            if (h.getScore() != null) {
                scores.add(h.getScore());
            }
        }
        return scores;
    }

    /**
     * Lấy điểm chấm mới nhất từ lịch sử chấm điểm ExamGradeHistory cho m���t bài thi và kỹ năng.
     */
    public Float getLatestScoreFromExamGradeHistory(Long resultExamId, Skill skill) {
        List<ExamGradeHistory> histories = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, skill);
        if (!histories.isEmpty() && histories.get(0).getScore() != null) {
            return histories.get(0).getScore();
        }
        return null;
    }

    /**
     * Lấy điểm trung bình từ lịch s�� chấm điểm ExamGradeHistory cho một bài thi và kỹ năng.
     */
    public Float getAverageScoreFromExamGradeHistory(Long resultExamId, Skill skill) {
        List<ExamGradeHistory> histories = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, skill);
        float sum = 0f;
        int count = 0;
        for (ExamGradeHistory h : histories) {
            if (h.getScore() != null) {
                sum += h.getScore();
                count++;
            }
        }
        return count > 0 ? sum / count : null;
    }

    private ExamGradeHistory getLatestHistory(Long resultExamId, Skill skill) {
        List<ExamGradeHistory> histories = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, skill);
        return histories != null && !histories.isEmpty() ? histories.get(0) : null;
    }

    // ===== Added methods to satisfy ResultApi endpoints =====
    public List<WritingAnswerDto> getWritingDtosByResult(Long resultId){
        List<ResultExam> list = resultExamRepository.findWritingByResult(resultId);
        List<WritingAnswerDto> out = new ArrayList<>();
        for(ResultExam re : list){ out.add(toWritingDto(re)); }
        return out;
    }
    public List<WritingAnswerDto> getWritingDtosByResultForUser(Long resultId){
        return getWritingDtosByResult(resultId);
    }
    public List<java.util.Map<String,Object>> getWritingHistory(Long resultExamId){
        List<ExamGradeHistory> list = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, Skill.WRITING);
        List<java.util.Map<String,Object>> out = new ArrayList<>();
        for(ExamGradeHistory h : list){
            java.util.Map<String,Object> item = new java.util.HashMap<>();
            item.put("score", h.getScore());
            item.put("feedback", h.getFeedback());
            item.put("gradedAt", h.getGradedAt()!=null ? h.getGradedAt().toString() : null);
            String graderName = null;
            try{ if(h.getGrader()!=null){ graderName = h.getGrader().getFullName()!=null? h.getGrader().getFullName() : h.getGrader().getUsername(); } }catch(Exception ignored){}
            item.put("graderName", graderName);
            out.add(item);
        }
        return out;
    }
    public List<java.util.Map<String,Object>> getWritingHistoryByResult(Long resultId){
        List<ResultExam> list = resultExamRepository.findWritingByResult(resultId);
        List<java.util.Map<String,Object>> out = new ArrayList<>();
        for(ResultExam re : list){
            List<java.util.Map<String,Object>> hist = getWritingHistory(re.getId());
            if(hist!=null){ out.addAll(hist); }
        }
        return out;
    }
    public List<com.web.dto.SkillAnswerDto> getReadingByResultForUser(Long resultId){ return ResultExamMapper.buildSkillAnswerDtos(resultExamRepository.findReadingByResult(resultId)); }
    public List<com.web.dto.SkillAnswerDto> getListeningByResultForUser(Long resultId){ return ResultExamMapper.buildSkillAnswerDtos(resultExamRepository.findListeningByResult(resultId)); }
    public List<com.web.dto.SpeakingAnswerDto> getSpeakingsByResultForUser(Long resultId){
        return getSpeakingsByResult(resultId);
    }
    public List<com.web.dto.SkillAnswerDto> getReadingByResult(Long resultId){ return ResultExamMapper.buildSkillAnswerDtos(resultExamRepository.findReadingByResult(resultId)); }
    public com.web.dto.SkillAnswerDto gradeReading(Long id, Float score, String feedback, String userAnswer){
        ResultExam re = resultExamRepository.findById(id).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.READING) {
            throw new MessageException("Not a reading answer");
        }
        if (score == null || (score != 0 && score != 1)) {
            throw new MessageException("Điểm reading phải là 0 hoặc 1");
        }
        re.setManualScore(score);
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.READING);
        hist.setScore(score);
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        return ResultExamMapper.toSkillAnswerDto(saved);
    }
    public List<java.util.Map<String,Object>> getReadingHistory(Long resultExamId){ return new ArrayList<>(); }
    public List<com.web.dto.SkillAnswerDto> getListeningByResult(Long resultId){
        return ResultExamMapper.buildSkillAnswerDtos(resultExamRepository.findListeningByResult(resultId));
    }
    public com.web.dto.SkillAnswerDto gradeListening(Long id, Float score, String feedback){
        ResultExam re = resultExamRepository.findById(id).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.LISTENING) {
            throw new MessageException("Not a listening answer");
        }
        if (score == null || score < 0 || score > 9) {
            throw new MessageException("Điểm listening phải trong khoảng 0 - 9");
        }
        re.setManualScore(score);
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.LISTENING);
        hist.setScore(score);
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        return ResultExamMapper.toSkillAnswerDto(saved);
    }
    public List<java.util.Map<String,Object>> getListeningHistory(Long resultExamId){
        List<ExamGradeHistory> list = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, Skill.LISTENING);
        List<java.util.Map<String,Object>> out = new ArrayList<>();
        for(ExamGradeHistory h : list){
            java.util.Map<String,Object> item = new java.util.LinkedHashMap<>();
            item.put("score", h.getScore());
            item.put("feedback", h.getFeedback());
            item.put("gradedAt", h.getGradedAt()!=null ? h.getGradedAt().toString() : null);
            String graderName = null;
            try{ if(h.getGrader()!=null){ graderName = h.getGrader().getFullName()!=null? h.getGrader().getFullName() : h.getGrader().getUsername(); } }catch(Exception ignored){}
            item.put("graderName", graderName);
            out.add(item);
        }
        return out;
    }

    private void syncSpeakingSubmissions(Result result) {
        if (result == null || result.getUser() == null || result.getExam() == null) {
            return;
        }
        List<Question> speakingQuestions = new ArrayList<>();
        for (Lesson lesson : result.getExam().getLessons()) {
            if (lesson.getSkill() == Skill.SPEAKING) {
                speakingQuestions.addAll(lesson.getQuestions());
            }
        }
        for (Question question : speakingQuestions) {
            Long questionId = question.getId();
            speakingSubmissionRepository.findFirstByExamIdAndUserIdAndQuestionIdOrderByCreatedDateDesc(
                    result.getExam().getId(), result.getUser().getId(), questionId)
                .ifPresent(sub -> {
                    String url = sub.getCloudinaryUrl();
                    if (url == null || url.isBlank()) {
                        return;
                    }
                    ResultExam target = resultExamRepository.findByResultIdAndQuestionId(result.getId(), questionId);
                    if (target == null) {
                        target = new ResultExam();
                        target.setResult(result);
                        target.setQuestion(question);
                    }
                    // Store audio only in answerText; keep public id for later usage
                    target.setAnswerText(url);
                    target.setSpeakingAudioPublicId(sub.getCloudinaryPublicId());
                    resultExamRepository.save(target);
                });
        }
     }

    // --- Ensure public speaking methods for ResultApi ---
    public List<com.web.dto.SpeakingAnswerDto> getSpeakingsByResult(Long resultId) {
        List<ResultExam> speakingAnswers = resultExamRepository.findSpeakingByResult(resultId);
        List<com.web.dto.SpeakingAnswerDto> dtoList = new ArrayList<>();
        for (ResultExam re : speakingAnswers) {
            if (re.getResult() == null || re.getResult().getExam() == null || re.getResult().getUser() == null || re.getQuestion() == null) {
                continue;
            }
            long attempts = speakingSubmissionRepository.countByExamIdAndUserIdAndQuestionId(
                    re.getResult().getExam().getId(),
                    re.getResult().getUser().getId(),
                    re.getQuestion().getId()
            );
            String audioUrl = (re.getAnswerText() != null && !re.getAnswerText().trim().isEmpty()) ? re.getAnswerText().trim() : null;
            com.web.dto.SpeakingAnswerDto dto = new com.web.dto.SpeakingAnswerDto();
            dto.setId(re.getId());
            dto.setExamId(re.getResult().getExam().getId());
            dto.setUserId(re.getResult().getUser().getId());
            dto.setQuestionId(re.getQuestion().getId());
            dto.setQuestionTitle(re.getQuestion().getTitle());
            dto.setQuestionLinkAudio(re.getQuestion().getLinkAudio());
            dto.setSpeakingNote(re.getQuestion().getSpeakingNote());
            dto.setAudioPath(audioUrl);
            dto.setCloudinaryUrl(audioUrl);
            dto.setScore(re.getManualScore());
            dto.setFeedback(re.getFeedback());
            dto.setStatus(Boolean.TRUE.equals(re.getGraded()) ? "GRADED" : "PENDING");
            dto.setGraded(re.getGraded());
            dto.setSpeakingAttempts((int) attempts);
            dtoList.add(dto);
        }
        return dtoList;
    }

    public com.web.dto.SpeakingAnswerDto gradeSpeaking(Long id, Float score, String feedback) {
        ResultExam re = resultExamRepository.findById(id).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.SPEAKING) {
            throw new MessageException("Not a speaking answer");
        }
        if (score == null || score < 0 || score > 9) {
            throw new MessageException("Điểm speaking phải trong khoảng 0 - 9");
        }
        // Allow regrade multiple times
        re.setManualScore(score);
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        // Save grading history
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.SPEAKING);
        hist.setScore(score);
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        // Return DTO
        com.web.dto.SpeakingAnswerDto dto = new com.web.dto.SpeakingAnswerDto();
        dto.setId(saved.getId());
        dto.setExamId(saved.getResult().getExam().getId());
        dto.setUserId(saved.getResult().getUser().getId());
        dto.setQuestionId(saved.getQuestion().getId());
        dto.setQuestionTitle(saved.getQuestion().getTitle());
        dto.setQuestionLinkAudio(saved.getQuestion().getLinkAudio());
        dto.setSpeakingNote(saved.getQuestion().getSpeakingNote());
        // Prefer answerText for audio
        String audioUrl = (saved.getAnswerText() != null && !saved.getAnswerText().trim().isEmpty()) ? saved.getAnswerText().trim() : null;
        dto.setAudioPath(audioUrl);
        dto.setCloudinaryUrl(audioUrl);
        dto.setScore(saved.getManualScore());
        dto.setFeedback(saved.getFeedback());
        dto.setStatus(Boolean.TRUE.equals(saved.getGraded()) ? "GRADED" : "PENDING");
        dto.setGraded(saved.getGraded());
        return dto;
    }

    public List<java.util.Map<String, Object>> getSpeakingHistoryBySubmission(Long submissionId) {
        List<ExamGradeHistory> histories = examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(submissionId, Skill.SPEAKING);
        List<java.util.Map<String, Object>> out = new ArrayList<>();
        for (ExamGradeHistory h : histories) {
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("score", h.getScore());
            item.put("feedback", h.getFeedback());
            item.put("gradedAt", h.getGradedAt() != null ? h.getGradedAt().toString() : null);
            String graderName = null;
            try {
                if (h.getGrader() != null) {
                    graderName = h.getGrader().getFullName() != null ? h.getGrader().getFullName() : h.getGrader().getUsername();
                }
            } catch (Exception ignored) {}
            item.put("graderName", graderName);
            out.add(item);
        }
        return out;
    }

    private Float normalizeObjectiveBand(Float rawScore){
        if(rawScore == null) return null;
        if(rawScore <= 1f && rawScore >= 0f){
            return rawScore * 9f;
        }
        if(rawScore > 9f) {
            return 9f;
        }
        if(rawScore < 0f){
            return 0f;
        }
        return rawScore;
    }

    public com.web.dto.SkillAnswerDto gradeReading(Long id, Float score, String feedback){
        ResultExam re = resultExamRepository.findById(id).orElseThrow(() -> new MessageException("ResultExam not found"));
        if (re.getQuestion() == null || re.getQuestion().getLesson().getSkill() != Skill.READING) {
            throw new MessageException("Not a reading answer");
        }
        if (score == null || (score != 0 && score != 1)) {
            throw new MessageException("Điểm reading phải là 0 hoặc 1");
        }
        re.setManualScore(score);
        re.setFeedback(feedback);
        re.setGraded(true);
        ResultExam saved = resultExamRepository.save(re);
        ExamGradeHistory hist = new ExamGradeHistory();
        hist.setResultExam(saved);
        hist.setSkill(Skill.READING);
        hist.setScore(score);
        hist.setFeedback(feedback);
        hist.setGradedAt(LocalDateTime.now());
        hist.setGrader(userUtils.getUserWithAuthority());
        examGradeHistoryRepository.save(hist);
        return ResultExamMapper.toSkillAnswerDto(saved);
    }

    /**
     * Thống kê điểm trung bình bài thi theo ngày dựa trên ExamGradeHistory.
     * Nếu courseId null -> toàn bộ khoá học, ngược lại lọc theo khoá học.
     */
    public List<ExamAverageByDateDto> getAverageExamScoreByDate(Long courseId) {
        List<Object[]> raw;
        if (courseId == null) {
            raw = examGradeHistoryRepository.findAverageScoreByDate(Skill.WRITING);
        } else {
            raw = examGradeHistoryRepository.findAverageScoreByDateAndCourse(Skill.WRITING, courseId);
        }
        List<ExamAverageByDateDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            Object dateObj = row[0];
            Object avgObj = row[1];
            Object cntObj = row[2];
            String dateStr;
            if (dateObj instanceof LocalDate) {
                dateStr = ((LocalDate) dateObj).toString();
            } else {
                dateStr = String.valueOf(dateObj);
            }
            Double avg = avgObj == null ? null : ((Number) avgObj).doubleValue();
            Long cnt = cntObj == null ? 0L : ((Number) cntObj).longValue();
            result.add(new ExamAverageByDateDto(dateStr, avg, cnt));
        }
        return result;
    }
}
