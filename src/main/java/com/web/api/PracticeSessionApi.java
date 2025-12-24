package com.web.api;

import com.web.dto.PracticeQuestionDto;
import com.web.dto.PracticeSessionDto;
import com.web.service.PracticeSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice")
@CrossOrigin
public class PracticeSessionApi {

    @Autowired
    private PracticeSessionService practiceSessionService;

    @PostMapping("/user/start")
    public ResponseEntity<?> start(@RequestParam("resultId") Long resultId,
                                   @RequestParam(value = "mode", required = false, defaultValue = "WRONG_ONLY") String mode) {
        PracticeSessionDto session = practiceSessionService.startDto(resultId, mode);
        return new ResponseEntity<>(session, HttpStatus.CREATED);
    }

    @GetMapping("/user/questions")
    public ResponseEntity<?> getQuestions(@RequestParam("sessionId") Long sessionId) {
        List<PracticeQuestionDto> list = practiceSessionService.getQuestions(sessionId);
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    @PostMapping("/user/answer")
    public ResponseEntity<?> answer(@RequestParam("psqId") Long psqId, @RequestParam("answerId") Long answerId) {
        PracticeQuestionDto dto = practiceSessionService.answer(psqId, answerId);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PostMapping("/user/answer-writing")
    public ResponseEntity<?> answerWriting(@RequestParam("psqId") Long psqId, @RequestParam("answerText") String answerText) {
        PracticeQuestionDto dto = practiceSessionService.answerWriting(psqId, answerText);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PostMapping("/user/answer-fill")
    public ResponseEntity<?> answerFill(@RequestParam("psqId") Long psqId, @RequestParam("answerText") String answerText){
        PracticeQuestionDto dto = practiceSessionService.answerFill(psqId, answerText);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PostMapping("/user/finish")
    public ResponseEntity<?> finish(@RequestParam("sessionId") Long sessionId,
                                     @RequestBody(required = false) Map<String,Object> body) {
        List<Map<String,Object>> fills = null;
        if(body!=null && body.get("fills") instanceof List){
            fills = (List<Map<String,Object>>) body.get("fills");
        }
        PracticeSessionDto session = practiceSessionService.finishDto(sessionId, fills);
        return new ResponseEntity<>(session, HttpStatus.OK);
    }

    @GetMapping("/user/session")
    public ResponseEntity<?> getSession(@RequestParam("sessionId") Long sessionId) {
        PracticeSessionDto session = practiceSessionService.getSessionDto(sessionId);
        return new ResponseEntity<>(session, HttpStatus.OK);
    }

    @GetMapping("/user/sessions")
    public ResponseEntity<?> listSessions() {
        return new ResponseEntity<>(practiceSessionService.listUserSessions(), HttpStatus.OK);
    }

    @PostMapping("/admin/grade-writing")
    public ResponseEntity<?> gradeWriting(@RequestParam("psqId") Long psqId,
                                          @RequestParam(value = "score", required = false) Integer score,
                                          @RequestParam(value = "feedback", required = false) String feedback) {
        PracticeQuestionDto dto = practiceSessionService.gradeWriting(psqId, score, feedback);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @GetMapping("/admin/writing-answers")
    public ResponseEntity<?> listWritingAnswers(@RequestParam("examId") Long examId){
        List<PracticeQuestionDto> list = practiceSessionService.listWritingAnswersByExam(examId);
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    @GetMapping("/admin/exam-sessions")
    public ResponseEntity<?> listSessionsByExam(@RequestParam("examId") Long examId){
        List<PracticeSessionDto> list = practiceSessionService.listSessionsByExam(examId);
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    @GetMapping("/admin/exam-user-summaries")
    public ResponseEntity<?> listUserSummaries(@RequestParam("examId") Long examId){
        return new ResponseEntity<>(practiceSessionService.listUserSummariesByExam(examId), HttpStatus.OK);
    }

    @GetMapping("/admin/skill-answers")
    public ResponseEntity<?> listSkillAnswers(@RequestParam("examId") Long examId,
                                              @RequestParam("skill") String skill){
        return new ResponseEntity<>(practiceSessionService.listSkillAnswersByExam(examId, skill), HttpStatus.OK);
    }

    @PostMapping("/admin/grade-skill")
    public ResponseEntity<?> gradeSkill(@RequestParam("psqId") Long psqId,
                                        @RequestParam(value = "score", required = false) Integer score,
                                        @RequestParam(value="feedback", required=false) String feedback){
        return new ResponseEntity<>(practiceSessionService.gradeSkill(psqId, score, feedback), HttpStatus.OK);
    }

    @GetMapping("/admin/skill-history")
    public ResponseEntity<?> listSkillHistory(@RequestParam("psqId") Long psqId){
        return new ResponseEntity<>(practiceSessionService.listSkillHistory(psqId), HttpStatus.OK);
    }

    @PostMapping("/user/answer-speaking")
    public ResponseEntity<?> answerSpeaking(@RequestParam("psqId") Long psqId,
                                            @RequestParam("file") MultipartFile file){
        PracticeQuestionDto dto = practiceSessionService.answerSpeaking(psqId, file);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PostMapping("/user/answer-speaking-url")
    public ResponseEntity<?> answerSpeakingUrl(@RequestParam("psqId") Long psqId,
                                               @RequestParam("audioUrl") String audioUrl){
        PracticeQuestionDto dto = practiceSessionService.answerSpeakingUrl(psqId, audioUrl);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @GetMapping("/user/total-sessions")
    public ResponseEntity<?> getTotalUserPracticeSessions() {
        long total = practiceSessionService.countUserPracticeSessions();
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("total", total);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @GetMapping("/user/stats-by-day")
    public ResponseEntity<?> getUserPracticeStatsByDay() {
        return new ResponseEntity<>(practiceSessionService.getUserPracticeStatsByDay(), HttpStatus.OK);
    }

    @GetMapping("/user/overall-average")
    public ResponseEntity<?> getUserPracticeOverallAverage() {
        double avg = practiceSessionService.getUserPracticeOverallAverage();
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("average", avg);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }
}
