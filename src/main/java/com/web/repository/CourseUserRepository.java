package com.web.repository;

import com.web.entity.Course;
import com.web.entity.CourseUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseUserRepository extends JpaRepository<CourseUser, Long> {

    @Query("select c from CourseUser c where c.course.id = ?1 and c.user.id = ?2")
    public Optional<CourseUser> findByCourseAndUser(Long courseId, Long userId);

    @Query("select c from CourseUser c where c.user.id = ?1")
    public List<CourseUser> findByUser(Long userId);

    @Query("select c from CourseUser c where c.course.id = ?1")
    public List<CourseUser> findByCourse(Long courseId);

    @Query("select c from CourseUser c where c.course.id = ?1 and c.user.id = ?2")
    public List<CourseUser> findByCourseAndUsers(Long courseId, Long userId);
}
