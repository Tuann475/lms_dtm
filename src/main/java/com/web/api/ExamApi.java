package com.web.api;

import com.web.dto.CreateExamRequest;
import com.web.dto.ExamDto;
import com.web.dto.HocVienDto;
import com.web.entity.Exam;
import com.web.entity.User;
import com.web.enums.TrangThai;
import com.web.service.ExamService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin
public class ExamApi {

    @Autowired
    private ExamService examService;

    @Autowired
    private UserUtils userUtils;

    @GetMapping("/public/findAll")
    public ResponseEntity<?> findAll(@RequestParam(value = "course", required = false) Long course) {
        List<Exam> result = examService.findAll(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }


    @GetMapping("/public/find-all-page")
    public ResponseEntity<?> findAll(Pageable pageable) {
        Page<Exam> result = examService.findAll(pageable);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }


    @GetMapping("/public/find-by-param")
    public ResponseEntity<?> search(@RequestParam(value = "search", required = false) String search,
                                    @RequestParam(value = "category", required = false) Long category, Pageable pageable) {
        Page<Exam> result = examService.search(category, search, pageable);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/create-update")
    public ResponseEntity<?> save(@RequestBody ExamDto examDto) {
        Exam result = examService.createUpdate(examDto);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        examService.deleteExam(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Exam result = examService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/public/find-by-id")
    public ResponseEntity<?> findByIdUser(@RequestParam("id") Long id) {
        Exam result = examService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/user/find-by-id")
    public ResponseEntity<?> findByIdAndUser(@RequestParam("id") Long id) {
        Exam result = examService.findByIdAndUser(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }


    @GetMapping("/user/find-by-course-and-user")
    public ResponseEntity<?> findByCourseAndUser(@RequestParam("course") Long course) {
        List<Exam> result = examService.findByCourseAndUser(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/admin/thong-tin-hoc-vien")
    public ResponseEntity<?> findByCourseAndUserId(@RequestParam("course") Long course, @RequestParam("user") Long userId) {
        HocVienDto result = examService.getByCourseAndUserId(userId, course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/user/thong-tin-hoc-vien")
    public ResponseEntity<?> findByCourseAndUserId(@RequestParam("course") Long course) {
        User user = userUtils.getUserWithAuthority();
        HocVienDto result = examService.getByCourseAndUserId(user.getId(), course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/update-trangthai")
    public ResponseEntity<?> save(@RequestParam("id") Long id, @RequestParam("trangthai") TrangThai trangThai) {
        examService.updateTrangThai(id, trangThai);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PostMapping("/teacher/create")
    public ResponseEntity<?> createByTeacher(@RequestBody CreateExamRequest request) {
        User teacher = userUtils.getUserWithAuthority();
        try {
            Exam exam = examService.createByTeacher(teacher, request);
            return new ResponseEntity<>(exam, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (SecurityException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/teacher/find-own")
    public ResponseEntity<?> findOwn(@RequestParam(value="course", required=false) Long course){
        User teacher = userUtils.getUserWithAuthority();
        List<Exam> all = examService.findAll(course); // filter later by teacher
        List<Exam> mine = all.stream().filter(e -> e.getCourse()!=null && e.getCourse().getTeacher()!=null && e.getCourse().getTeacher().getId().equals(teacher.getId())).toList();
        return new ResponseEntity<>(mine, HttpStatus.OK);
    }

    @PostMapping("/teacher/update-trangthai")
    public ResponseEntity<?> updateTrangThaiTeacher(@RequestParam("id") Long id, @RequestParam("trangthai") TrangThai trangThai){
        User teacher = userUtils.getUserWithAuthority();
        try {
            Exam exam = examService.updateTrangThaiByTeacher(teacher, id, trangThai);
            return new ResponseEntity<>(exam, HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (SecurityException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/teacher/thong-tin-hoc-vien")
    public ResponseEntity<?> teacherThongTinHocVien(@RequestParam("course") Long course, @RequestParam("user") Long userId){
        User teacher = userUtils.getUserWithAuthority();
        try {
            HocVienDto result = examService.getByCourseAndUserIdTeacher(teacher, userId, course);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (SecurityException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> teacherDelete(@RequestParam("id") Long id){
        User teacher = userUtils.getUserWithAuthority();
        try {
            examService.deleteExamByTeacher(teacher, id);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (SecurityException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}
