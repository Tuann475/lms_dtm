package com.web.api;

import com.web.entity.Exam;
import com.web.entity.Lesson;
import com.web.entity.User;
import com.web.repository.ExamRepository;
import com.web.service.LessonService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lesson")
@CrossOrigin
public class LessonApi {

    @Autowired
    private LessonService lessonService;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private UserUtils userUtils;

    @GetMapping("/public/find-by-exam")
    public ResponseEntity<?> findByExam(@RequestParam Long id) {
        List<Lesson> result = lessonService.findByExam(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/public/find-by-list-id")
    public ResponseEntity<?> findByExam(@RequestBody List<Long> list) {
        List<Lesson> result = lessonService.findByListId(list);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/update")
    public ResponseEntity<?> update(@RequestBody Lesson lesson) {
        lessonService.update(lesson);
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        lessonService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Lesson result = lessonService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/teacher/update")
    public ResponseEntity<?> teacherUpdate(@RequestBody Lesson lesson){
        if(lesson.getExam()==null || lesson.getExam().getId()==null){
            return new ResponseEntity<>("Exam thiếu", HttpStatus.BAD_REQUEST);
        }
        Exam exam = examRepository.findById(lesson.getExam().getId()).orElse(null);
        if(exam==null || exam.getCourse()==null || exam.getCourse().getTeacher()==null){
            return new ResponseEntity<>("Không xác định giáo viên", HttpStatus.FORBIDDEN);
        }
        User current = userUtils.getUserWithAuthority();
        if(!exam.getCourse().getTeacher().getId().equals(current.getId())){
            return new ResponseEntity<>("Không có quyền", HttpStatus.FORBIDDEN);
        }
        lesson.setExam(exam);
        lessonService.update(lesson);
        return new ResponseEntity<>("success", HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> teacherDelete(@RequestParam("id") Long id){
        Lesson ls = lessonService.findById(id);
        Exam exam = ls.getExam();
        if(exam==null || exam.getCourse()==null || exam.getCourse().getTeacher()==null){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        User current = userUtils.getUserWithAuthority();
        if(!exam.getCourse().getTeacher().getId().equals(current.getId())){
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        lessonService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
