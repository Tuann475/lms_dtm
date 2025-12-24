package com.web.api;

import com.mservice.config.Environment;
import com.mservice.models.QueryStatusTransactionResponse;
import com.mservice.processor.QueryTransactionStatus;
import com.web.dto.CourseUserDto;
import com.web.entity.*;
import com.web.exception.MessageException;
import com.web.repository.CourseRepository;
import com.web.repository.CourseUserRepository;
import com.web.repository.HistoryPayRepository;
import com.web.service.CourseUserService;
import com.web.utils.MailService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.sql.Time;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/course-user")
@CrossOrigin
public class CourseUserApi {

    @Autowired
    private CourseUserRepository courseUserRepository;

    @Autowired
    private HistoryPayRepository historyPayRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private CourseUserService courseUserService;

    @Autowired
    private MailService mailService;

    @PostMapping("/user/create")
    public CourseUser create(@RequestBody CourseUserDto courseUserDto) {
        System.out.println(courseUserDto.getRequestIdMomo());
        System.out.println(courseUserDto.getOrderIdMomo());
        if (courseUserDto.getRequestIdMomo() == null || courseUserDto.getOrderIdMomo() == null) {
            throw new MessageException("orderid and requestid require");
        }
        if (historyPayRepository.findByOrderIdAndRequestId(courseUserDto.getOrderIdMomo(), courseUserDto.getRequestIdMomo()).isPresent()) {
            throw new MessageException("Đã được thanh toán");
        }
        Environment environment = Environment.selectEnv("dev");
        try {
            QueryStatusTransactionResponse queryStatusTransactionResponse = QueryTransactionStatus.process(environment, courseUserDto.getOrderIdMomo(), courseUserDto.getRequestIdMomo());
            System.out.println("qqqq-----------------------------------------------------------" + queryStatusTransactionResponse.getMessage());
            if (queryStatusTransactionResponse.getResultCode() != 0) {
                throw new MessageException("Chưa được thanh toán");
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new MessageException("Chưa được thanh toán");
        }
        if (courseUserDto.getCourseId() == null) {
            throw new MessageException("course id require");
        }

        Course course = courseRepository.findById(courseUserDto.getCourseId()).get();

        HistoryPay historyPay = new HistoryPay();
        historyPay.setRequestId(courseUserDto.getRequestIdMomo());
        historyPay.setOrderId(courseUserDto.getOrderIdMomo());
        historyPay.setCreatedTime(new Time(System.currentTimeMillis()));
        historyPay.setCreatedDate(new Date(System.currentTimeMillis()));
        historyPay.setTotalAmount(course.getPrice());
        HistoryPay hs = historyPayRepository.save(historyPay);

        User user = userUtils.getUserWithAuthority();
        CourseUser courseUser = new CourseUser();
        courseUser.setCourse(course);
        courseUser.setUser(user);
        courseUser.setCreatedDate(LocalDateTime.now());
        courseUser.setHistoryPay(hs);
        courseUser.setNote(courseUser.getNote());
        courseUser.setFullName(user.getFullName());
        courseUser.setPhone(user.getPhone());
        courseUser.setEmail(user.getEmail());
        courseUserRepository.save(courseUser);

        return courseUser;
    }


    @GetMapping("/user/find-by-user")
    public ResponseEntity<?> findByUser() {
        List<CourseUser> result = courseUserRepository.findByUser(userUtils.getUserWithAuthority().getId());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/admin/find-by-course")
    public ResponseEntity<?> findByCourse(@RequestParam Long id) {
        List<CourseUser> result = courseUserRepository.findByCourse(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        courseUserRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> deleteByTeacher(@RequestParam("idCourse") Long idCourse, @RequestParam("iduser") Long iduser) {
        User user = userUtils.getUserWithAuthority();
        CourseUser courseUser = courseUserRepository.findByCourseAndUser(idCourse, iduser).get();
        mailService.sendEmail(courseUser.getEmail(), "Bạn đã bị xóa khỏi khóa học",
                "Vì lý do bỏ học hoặc bỏ thi nên bạn đã bị xóa khỏi khóa hcoj: " + courseUser.getCourse().getName() + " bởi giảng viên " +
                        user.getFullName() + "<br>Nếu có thắc mắc, hãy liên hệ lại với chúng tôi",
                false, true);
        courseUserRepository.delete(courseUser);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/admin/update-cc")
    public ResponseEntity<?> updateCC(@RequestParam Long courseId, @RequestParam Long userId, @RequestParam String level) {
        courseUserService.updateCC(courseId, userId, level);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

}
