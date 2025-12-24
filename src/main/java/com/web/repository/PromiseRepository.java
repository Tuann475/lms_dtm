package com.web.repository;

import com.web.entity.Promise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PromiseRepository extends JpaRepository<Promise, Long> {
    @Query("DELETE FROM Promise p WHERE p.course.id = :courseId")
    void deleteByCourse_iId(@Param("courseId") Long courseId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Promise p WHERE p.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}
