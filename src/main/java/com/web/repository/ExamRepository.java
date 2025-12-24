package com.web.repository;

import com.web.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.sql.Date;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {

    @Query("select e from Exam e where e.name like ?1 or e.course.name like ?1")
    public Page<Exam> search(String s, Pageable pageable);

    @Query("select e from Exam e where (e.name like ?1 or e.course.name like ?1) and e.course.id = ?2")
    public Page<Exam> search(String s, Long categoryId, Pageable pageable);

    // Order ascending by date then time
    @Query("select e from Exam e where e.course.id = ?1 order by e.examDate asc, e.examTime asc")
    public List<Exam> findByCourse(Long courseId);

    // Exams on or before a given date and not yet notified
    @Query("select e from Exam e where e.examDate <= ?1 and (e.notificationSent = false or e.notificationSent is null)")
    public List<Exam> findDueExams(Date currentDate);
}
