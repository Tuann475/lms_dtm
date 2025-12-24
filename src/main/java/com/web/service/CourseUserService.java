package com.web.service;

import com.web.entity.Course;
import com.web.entity.CourseUser;
import com.web.entity.User;
import com.web.repository.CourseRepository;
import com.web.repository.CourseUserRepository;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class CourseUserService {

    @Autowired
    private CourseUserRepository courseUserRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    public void updateCC(Long courseId, Long userId, String level) {
        Optional<CourseUser> opt = courseUserRepository.findByCourseAndUser(courseId, userId);
        if (!opt.isPresent()) {
            throw new RuntimeException("Không tìm thấy học viên trong khóa học (courseId=" + courseId + ", userId=" + userId + ")");
        }
        CourseUser courseUser = opt.get();
        courseUser.setLevel(level);
        courseUserRepository.save(courseUser);
    }

    // add user vào khóa học
    public void addUserToCourse(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học với ID: " + courseId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + userId));

        // Tạo đối tượng CourseUser mới
        CourseUser courseUser = new CourseUser();
        courseUser.setCourse(course);
        courseUser.setUser(user);
        courseUser.setCreatedDate(LocalDateTime.now());
        courseUser.setEmail(user.getEmail());
        courseUser.setFullName(user.getFullName());
        courseUser.setPhone(user.getPhone());
        // Lưu vào database
        courseUserRepository.save(courseUser);
    }

    @Transactional
    public void addListUsersToCourse(Long courseId, List<Long> userIds) {
        // Duyệt qua danh sách userIds và gọi addUserToCourse
        for (Long userId : userIds) {
            addUserToCourse(courseId, userId);
        }
    }

}
