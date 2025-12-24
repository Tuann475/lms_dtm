package com.web.api;

import com.web.dto.ExamSubmissionDto;
import com.web.dto.ResultResponse;
import com.web.dto.WritingAnswerDto;
import com.web.entity.Result;
import com.web.entity.ResultExam;
import com.web.entity.User;
import com.web.service.ResultService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/result")
@CrossOrigin
public class ResultApi {

    @Autowired
    private ResultService resultService;

    @Autowired
    private UserUtils userUtils;

    @PostMapping("/user/create")
    public ResponseEntity<?> save(@RequestBody List<Long> answer, @RequestParam("examId") Long examId, @RequestParam("time") String time) {
        ResultResponse resultResponse = resultService.create(examId, answer, time);
        return new ResponseEntity<>(resultResponse, HttpStatus.CREATED);
    }

    @GetMapping("/user/find-by-user")
    public ResponseEntity<?> findAll() {
        List<Result> result = resultService.findByUser();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/user/find-by-user-exam")
    public ResponseEntity<?> findByUserAndExam(@RequestParam("examId") Long examId) {
        User user = userUtils.getUserWithAuthority();
        ResultResponse result = resultService.getByExamAndUser(examId, user.getId());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/admin/find-by-exam")
    public ResponseEntity<?> findByExam(@RequestParam("examId") Long examId) {
        List<ResultResponse> result = resultService.findByExam(examId);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/user/create-with-writing")
    public ResponseEntity<?> saveWithWriting(@RequestBody ExamSubmissionDto submission) {
        ResultResponse resultResponse = resultService.createWithWriting(submission);
        return new ResponseEntity<>(resultResponse, HttpStatus.CREATED);
    }

    @PostMapping("/user/create-with-fills")
    public ResponseEntity<?> saveWithFills(@RequestBody ExamSubmissionDto submission) {
        ResultResponse resultResponse = resultService.createWithWritingAndFills(submission);
        return new ResponseEntity<>(resultResponse, HttpStatus.CREATED);
    }

    @GetMapping("/admin/writing/pending")
    public ResponseEntity<?> pendingWriting(@RequestParam("examId") Long examId) {
        List<ResultExam> pending = resultService.getPendingWriting(examId);
        return new ResponseEntity<>(pending, HttpStatus.OK);
    }

    @PostMapping("/admin/writing/grade")
    public ResponseEntity<?> gradeWriting(@RequestParam("id") Long id,
                                          @RequestParam("score") Float score,
                                          @RequestParam(value = "feedback", required = false) String feedback) {
        WritingAnswerDto graded = resultService.gradeWritingDto(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/admin/writing/by-result")
    public ResponseEntity<?> writingByResult(@RequestParam("resultId") Long resultId) {
        List<WritingAnswerDto> writings = resultService.getWritingDtosByResult(resultId);
        return new ResponseEntity<>(writings, HttpStatus.OK);
    }

    @GetMapping("/user/writing/by-result")
    public ResponseEntity<?> writingByResultUser(@RequestParam("resultId") Long resultId) {
        List<WritingAnswerDto> writings = resultService.getWritingDtosByResultForUser(resultId);
        return new ResponseEntity<>(writings, HttpStatus.OK);
    }

    @GetMapping("/admin/writing/history")
    public ResponseEntity<?> writingHistory(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getWritingHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/admin/writing/history/by-result")
    public ResponseEntity<?> writingHistoryByResult(@RequestParam("resultId") Long resultId) {
        return new ResponseEntity<>(resultService.getWritingHistoryByResult(resultId), HttpStatus.OK);
    }

    @GetMapping("/admin/speaking/by-result")
    public ResponseEntity<?> speakingByResult(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SpeakingAnswerDto> speakings = resultService.getSpeakingsByResult(resultId);
        return new ResponseEntity<>(speakings, HttpStatus.OK);
    }

    @PostMapping("/admin/speaking/grade")
    public ResponseEntity<?> gradeSpeaking(@RequestParam("id") Long id, @RequestParam("score") Float score, @RequestParam(value = "feedback", required = false) String feedback) {
        com.web.dto.SpeakingAnswerDto graded = resultService.gradeSpeaking(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/admin/speaking/history")
    public ResponseEntity<?> speakingHistory(@RequestParam("submissionId") Long submissionId) {
        return new ResponseEntity<>(resultService.getSpeakingHistoryBySubmission(submissionId), HttpStatus.OK);
    }

    @GetMapping("/user/reading/by-result")
    public ResponseEntity<?> readingByResultUser(@RequestParam("resultId") Long resultId) {
        return new ResponseEntity<>(resultService.getReadingByResultForUser(resultId), HttpStatus.OK);
    }

    @GetMapping("/user/listening/by-result")
    public ResponseEntity<?> listeningByResultUser(@RequestParam("resultId") Long resultId) {
        return new ResponseEntity<>(resultService.getListeningByResultForUser(resultId), HttpStatus.OK);
    }

    @GetMapping("/user/speaking/by-result")
    public ResponseEntity<?> speakingByResultUser(@RequestParam("resultId") Long resultId) {
        return new ResponseEntity<>(resultService.getSpeakingsByResultForUser(resultId), HttpStatus.OK);
    }

    @GetMapping("/admin/reading/by-result")
    public ResponseEntity<?> readingByResult(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SkillAnswerDto> readings = resultService.getReadingByResult(resultId);
        return new ResponseEntity<>(readings, HttpStatus.OK);
    }

    @PostMapping("/admin/reading/grade")
    public ResponseEntity<?> gradeReading(@RequestParam("id") Long id, @RequestParam("score") Float score, @RequestParam(value = "feedback", required = false) String feedback, @RequestParam(value = "userAnswer", required = false) String userAnswer) {
        com.web.dto.SkillAnswerDto graded = resultService.gradeReading(id, score, feedback, userAnswer);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/admin/reading/history")
    public ResponseEntity<?> readingHistory(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getReadingHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/admin/listening/by-result")
    public ResponseEntity<?> listeningByResult(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SkillAnswerDto> listenings = resultService.getListeningByResult(resultId);
        return new ResponseEntity<>(listenings, HttpStatus.OK);
    }

    @PostMapping("/admin/listening/grade")
    public ResponseEntity<?> gradeListening(@RequestParam("id") Long id, @RequestParam("score") Float score, @RequestParam(value = "feedback", required = false) String feedback) {
        com.web.dto.SkillAnswerDto graded = resultService.gradeListening(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/admin/listening/history")
    public ResponseEntity<?> listeningHistory(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getListeningHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/teacher/find-by-exam")
    public ResponseEntity<?> findByExamForTeacher(@RequestParam("examId") Long examId) {
        List<ResultResponse> result = resultService.findByExam(examId);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/teacher/writing/by-result")
    public ResponseEntity<?> writingByResultForTeacher(@RequestParam("resultId") Long resultId) {
        List<WritingAnswerDto> writings = resultService.getWritingDtosByResult(resultId);
        return new ResponseEntity<>(writings, HttpStatus.OK);
    }

    @PostMapping("/teacher/writing/grade")
    public ResponseEntity<?> gradeWritingForTeacher(@RequestParam("id") Long id,
                                                    @RequestParam("score") Float score,
                                                    @RequestParam(value = "feedback", required = false) String feedback) {
        WritingAnswerDto graded = resultService.gradeWritingDto(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/teacher/speaking/by-result")
    public ResponseEntity<?> speakingByResultForTeacher(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SpeakingAnswerDto> speakings = resultService.getSpeakingsByResult(resultId);
        return new ResponseEntity<>(speakings, HttpStatus.OK);
    }

    @PostMapping("/teacher/speaking/grade")
    public ResponseEntity<?> gradeSpeakingForTeacher(@RequestParam("id") Long id, @RequestParam("score") Float score, @RequestParam(value = "feedback", required = false) String feedback) {
        com.web.dto.SpeakingAnswerDto graded = resultService.gradeSpeaking(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/teacher/reading/by-result")
    public ResponseEntity<?> readingByResultForTeacher(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SkillAnswerDto> readings = resultService.getReadingByResult(resultId);
        return new ResponseEntity<>(readings, HttpStatus.OK);
    }

    @PostMapping("/teacher/reading/grade")
    public ResponseEntity<?> gradeReadingForTeacher(
            @RequestParam("id") Long id,
            @RequestParam("score") Float score,
            @RequestParam(value = "feedback", required = false) String feedback,
            @RequestParam(value = "userAnswer", required = false) String userAnswer) {
        com.web.dto.SkillAnswerDto graded = resultService.gradeReading(id, score, feedback, userAnswer);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/teacher/listening/by-result")
    public ResponseEntity<?> listeningByResultForTeacher(@RequestParam("resultId") Long resultId) {
        List<com.web.dto.SkillAnswerDto> listenings = resultService.getListeningByResult(resultId);
        return new ResponseEntity<>(listenings, HttpStatus.OK);
    }

    @PostMapping("/teacher/listening/grade")
    public ResponseEntity<?> gradeListeningForTeacher(
            @RequestParam("id") Long id,
            @RequestParam("score") Float score,
            @RequestParam(value = "feedback", required = false) String feedback) {
        com.web.dto.SkillAnswerDto graded = resultService.gradeListening(id, score, feedback);
        return new ResponseEntity<>(graded, HttpStatus.OK);
    }

    @GetMapping("/teacher/writing/history")
    public ResponseEntity<?> writingHistoryForTeacher(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getWritingHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/teacher/reading/history")
    public ResponseEntity<?> readingHistoryForTeacher(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getReadingHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/teacher/listening/history")
    public ResponseEntity<?> listeningHistoryForTeacher(@RequestParam("resultExamId") Long resultExamId) {
        return new ResponseEntity<>(resultService.getListeningHistory(resultExamId), HttpStatus.OK);
    }

    @GetMapping("/teacher/speaking/history")
    public ResponseEntity<?> speakingHistoryForTeacher(@RequestParam("submissionId") Long submissionId) {
        return new ResponseEntity<>(resultService.getSpeakingHistoryBySubmission(submissionId), HttpStatus.OK);
    }
}
