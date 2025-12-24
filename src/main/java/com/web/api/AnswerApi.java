package com.web.api;

import com.web.entity.Answer;
import com.web.entity.Lesson;
import com.web.entity.Question;
import com.web.entity.User;
import com.web.service.AnswerService;
import com.web.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answer")
@CrossOrigin
public class AnswerApi {

    @Autowired
    private AnswerService answerService;

    @Autowired
    private QuestionService questionService;

    @GetMapping("/public/find-by-question")
    public ResponseEntity<?> findByQuestion(@RequestParam Long id) {
        List<Answer> result = answerService.findByQuestion(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/create-update")
    public ResponseEntity<?> update(@RequestBody Answer answer) {
        answerService.save(answer);
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        answerService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Answer result = answerService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/teacher/create-update")
    public ResponseEntity<?> teacherSave(@RequestBody Answer answer){
        if(answer.getQuestion()==null || answer.getQuestion().getId()==null){
            return new ResponseEntity<>("Thiếu question", HttpStatus.BAD_REQUEST);
        }
        Question q = questionService.findById(answer.getQuestion().getId());
        Lesson lesson = q.getLesson();
        if(lesson==null || lesson.getExam()==null || lesson.getExam().getCourse()==null || lesson.getExam().getCourse().getTeacher()==null){
            return new ResponseEntity<>("Không xác định giáo viên", HttpStatus.FORBIDDEN);
        }
        User current = questionService.getCurrentUser();
        if(!lesson.getExam().getCourse().getTeacher().getId().equals(current.getId())){
            return new ResponseEntity<>("Không có quyền", HttpStatus.FORBIDDEN);
        }
        answerService.save(answer);
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> teacherDelete(@RequestParam("id") Long id){
        Answer a = answerService.findById(id);
        Question q = a.getQuestion();
        Lesson lesson = q.getLesson();
        if(lesson==null || lesson.getExam()==null || lesson.getExam().getCourse()==null || lesson.getExam().getCourse().getTeacher()==null){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        User current = questionService.getCurrentUser();
        if(!lesson.getExam().getCourse().getTeacher().getId().equals(current.getId())){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        answerService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
