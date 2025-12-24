package com.web.api;

import com.mservice.config.Environment;
import com.mservice.models.PaymentResponse;
import com.mservice.models.QueryStatusTransactionResponse;
import com.mservice.processor.CreateOrderMoMo;
import com.mservice.processor.QueryTransactionStatus;
import com.mservice.shared.constants.LogUtils;
import com.mservice.shared.constants.RequestType;
import com.web.dto.PaymentDto;
import com.web.dto.ResponsePayment;
import com.web.entity.Course;
import com.web.entity.CourseUser;
import com.web.entity.User;
import com.web.exception.MessageException;
import com.web.repository.CourseRepository;
import com.web.repository.CourseUserRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Date;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class MomoApi {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseUserRepository courseUserRepository;

    @Autowired
    private UserUtils userUtils;


    @PostMapping("/urlpayment")
    public ResponsePayment getUrlPayment(@RequestBody PaymentDto paymentDto) {
        if (courseUserRepository.findByCourseAndUser(paymentDto.getCourseId(), userUtils.getUserWithAuthority().getId()).isPresent()) {
            throw new MessageException("Khóa học đã được đăng ký");
        }
        Course course = courseRepository.findById(paymentDto.getCourseId()).get();
        // Only block registration when endDate is before now (course has ended)
        Date now = new Date(System.currentTimeMillis());
        if (course.getEndDate() != null && course.getEndDate().before(now)) {
            throw new MessageException("Khóa học đã hết hạn đăng ký");
        }

        if (course.getIsfree() != null) {
            if (course.getIsfree() == true) {
                User user = userUtils.getUserWithAuthority();
                CourseUser courseUser = new CourseUser();
                courseUser.setCourse(course);
                courseUser.setUser(user);
                courseUser.setCreatedDate(LocalDateTime.now());
                courseUser.setNote(courseUser.getNote());
                courseUser.setFullName(user.getFullName());
                courseUser.setPhone(user.getPhone());
                courseUser.setEmail(user.getEmail());
                courseUserRepository.save(courseUser);
                return null;
            }
        }

        LogUtils.init();
        String orderId = String.valueOf(System.currentTimeMillis());
        String requestId = String.valueOf(System.currentTimeMillis());
        Environment environment = Environment.selectEnv("dev");
        PaymentResponse captureATMMoMoResponse = null;
        Double amount = courseRepository.findById(paymentDto.getCourseId()).get().getPrice();
        Long td = Math.round(amount);
        try {
            captureATMMoMoResponse = CreateOrderMoMo.process(environment, orderId, requestId, Long.toString(td), paymentDto.getContent(), paymentDto.getReturnUrl(), paymentDto.getNotifyUrl(), "", RequestType.PAY_WITH_ATM, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("url ====: " + captureATMMoMoResponse.getPayUrl());
        ResponsePayment responsePayment = new ResponsePayment(captureATMMoMoResponse.getPayUrl(), orderId, requestId);
        return responsePayment;
    }


    @GetMapping("/checkPayment")
    public Integer checkPayment(@RequestParam("orderId") String orderId, @RequestParam("requestId") String requestId) throws Exception {
        Environment environment = Environment.selectEnv("dev");
        QueryStatusTransactionResponse queryStatusTransactionResponse = QueryTransactionStatus.process(environment, orderId, requestId);
        System.out.println("qqqq-----------------------------------------------------------" + queryStatusTransactionResponse.getMessage());
        if (queryStatusTransactionResponse.getResultCode() == 0) {
            return 0;
        }
        return 1;
    }
}
