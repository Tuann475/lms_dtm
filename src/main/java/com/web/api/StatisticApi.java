package com.web.api;

import com.web.repository.CourseRepository;
import com.web.repository.ExamRepository;
import com.web.repository.HistoryPayRepository;
import com.web.repository.UserRepository;
import com.web.utils.Contains;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/statistic")
@CrossOrigin
public class StatisticApi {

    @Autowired
    private HistoryPayRepository historyPayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ExamRepository examRepository;

    @GetMapping("/admin/revenue-year")
    public List<Double> doanhThu(@RequestParam("year") Integer year) {
        List<Double> list = new ArrayList<>();
        for (int i = 1; i < 13; i++) {
            Double sum = historyPayRepository.calDt(i, year);
            if (sum == null) {
                sum = 0D;
            }
            list.add(sum);
        }
        return list;
    }

    @GetMapping("/admin/revenue-this-month")
    public Double doanhThuThangNay() {
        Date date = new Date(System.currentTimeMillis());
        String[] str = date.toString().split("-");
        Integer year = Integer.valueOf(str[0]);
        Integer month = Integer.valueOf(str[1]);
        return historyPayRepository.calDt(month, year);
    }

    @GetMapping("/admin/number-user")
    public Long numberUser() {
        return userRepository.count();
    }

    @GetMapping("/admin/number-course")
    public Long numberCourse() {
        return courseRepository.count();
    }

    @GetMapping("/admin/number-exam")
    public Long numberExam() {
        return examRepository.count();
    }

    @GetMapping("/admin/number-teacher")
    public Long numberTeacher() {
        return userRepository.countByRole("ROLE_TEACHER");
    }

    @GetMapping("/admin/number-user-this-month")
    public Long userThisMonth() {
        Date date = new Date(System.currentTimeMillis());
        String[] str = date.toString().split("-");
        Integer year = Integer.valueOf(str[0]);
        Integer month = Integer.valueOf(str[1]);
        return userRepository.countUserThisMonth(month, year);
    }
}
