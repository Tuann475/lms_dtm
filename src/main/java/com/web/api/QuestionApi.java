package com.web.api;

import com.web.entity.Lesson;
import com.web.entity.Question;
import com.web.entity.User;
import com.web.repository.LessonRepository;
import com.web.service.QuestionService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question")
@CrossOrigin
public class QuestionApi {

    @Autowired
    private QuestionService questionService;
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private UserUtils userUtils;

    @GetMapping("/public/find-by-lesson")
    public ResponseEntity<List<Question>> findByExam(@RequestParam Long id) {
        List<Question> result = questionService.findByLesson(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/create-update")
    public ResponseEntity<String> update(@RequestBody Question question) {
        questionService.save(question);
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<Void> delete(@RequestParam("id") Long id) {
        questionService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<Question> findById(@RequestParam("id") Long id) {
        Question result = questionService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/teacher/create-update")
    public ResponseEntity<String> teacherSave(@RequestBody Question question){
        if(question.getLesson()==null || question.getLesson().getId()==null){
            return new ResponseEntity<>("Thiếu lesson", HttpStatus.BAD_REQUEST);
        }
        Lesson lesson = lessonRepository.findById(question.getLesson().getId()).orElse(null);
        if(lesson==null || lesson.getExam()==null){
            return new ResponseEntity<>("Exam không tồn tại", HttpStatus.BAD_REQUEST);
        }
        User teacherUser = lesson.getExam().getCourse()!=null? lesson.getExam().getCourse().getTeacher(): null;
        if(teacherUser==null){
            return new ResponseEntity<>("Không xác định giáo viên", HttpStatus.FORBIDDEN);
        }
        User current = userUtils.getUserWithAuthority();
        if(!teacherUser.getId().equals(current.getId())){
            return new ResponseEntity<>("Không có quyền", HttpStatus.FORBIDDEN);
        }
        question.setLesson(lesson);
        questionService.save(question); // rely on internal validation
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<Void> teacherDelete(@RequestParam("id") Long id){
        Question q = questionService.findById(id);
        Lesson lesson = q.getLesson();
        if(lesson==null || lesson.getExam()==null){
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        User teacherUser = lesson.getExam().getCourse()!=null? lesson.getExam().getCourse().getTeacher(): null;
        if(teacherUser==null){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        User current = userUtils.getUserWithAuthority();
        if(!teacherUser.getId().equals(current.getId())){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        questionService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
