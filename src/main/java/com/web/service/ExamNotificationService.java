package com.web.service;

import com.web.entity.CourseUser;
import com.web.entity.Exam;
import com.web.repository.CourseUserRepository;
import com.web.repository.ExamRepository;
import com.web.utils.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class ExamNotificationService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private CourseUserRepository courseUserRepository;

    @Autowired
    private MailService mailService;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // Chạy mỗi phút để kiểm tra các bài thi sắp tới giờ thi 30 phút và gửi email nhắc nhở
    @Scheduled(cron = "0 * * * * *")
    public void checkAndSendExamNotifications() {
        LocalDateTime now = LocalDateTime.now(DEFAULT_ZONE);
        LocalDate today = now.toLocalDate();

        // Lấy tất cả bài thi có ngày thi <= hôm nay và chưa gửi email
        List<Exam> candidates = examRepository.findDueExams(Date.valueOf(today));

        for (Exam exam : candidates) {
            if (Boolean.TRUE.equals(exam.getNotificationSent())) {
                continue;
            }

            if (exam.getExamDate() == null || exam.getExamTime() == null) {
                continue;
            }

            LocalDate examDate = exam.getExamDate().toLocalDate();
            LocalTime examTime = exam.getExamTime().toLocalTime();
            LocalDateTime examDateTime = LocalDateTime.of(examDate, examTime);

            // Thời điểm cần gửi nhắc: trước giờ thi 30 phút
            LocalDateTime notifyAt = examDateTime.minusMinutes(30);

            // Nếu đã đến (hoặc quá) thời điểm cần gửi nhắc thì gửi email
            if (!notifyAt.isAfter(now)) {
                sendReminderForExam(exam);
                exam.setNotificationSent(true);
                examRepository.save(exam);
            }
        }
    }

    private void sendReminderForExam(Exam exam) {
        Long courseId = exam.getCourse() != null ? exam.getCourse().getId() : null;
        if (courseId == null) {
            return;
        }

        List<CourseUser> courseUsers = courseUserRepository.findByCourse(courseId);

        for (CourseUser cu : courseUsers) {
            String email = cu.getEmail();
            if (email == null || email.trim().isEmpty()) {
                if (cu.getUser() != null && cu.getUser().getEmail() != null) {
                    email = cu.getUser().getEmail();
                }
            }
            if (email == null || email.trim().isEmpty()) {
                continue;
            }

            String fullName = cu.getFullName();
            if (fullName == null && cu.getUser() != null) {
                fullName = cu.getUser().getFullName();
            }

            String subject = "Nhắc nhở bài thi (trước 30 phút): " + exam.getName();
            StringBuilder content = new StringBuilder();
            content.append("Xin chào ");
            content.append(fullName != null ? fullName : "bạn");
            content.append(",\n");
            content.append("Bài thi ").append(exam.getName()).append(" sẽ diễn ra sau khoảng 30 phút.\n");
            content.append("Khóa học: ")
                    .append(exam.getCourse() != null ? exam.getCourse().getName() : "")
                    .append("\n");
            content.append("Ngày thi: ").append(exam.getExamDate()).append("\n");
            content.append("Giờ thi: ").append(exam.getExamTime()).append("\n");
            content.append("Thời gian làm bài: ").append(exam.getLimitTime()).append(" phút\n");

            mailService.sendEmail(email, subject, content.toString(), false, false);
        }
    }
}
