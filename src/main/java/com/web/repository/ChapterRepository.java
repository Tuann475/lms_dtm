package com.web.repository;

import com.web.entity.Chapter;
import com.web.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    @Query("select c from Chapter c where c.course.id = ?1")
    List<Chapter> findByCourse(Long courseId);

    @Query("DELETE FROM Chapter c WHERE c.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Chapter c WHERE c.id IN :chapterIds")
    void deleteChaptersByIds(@Param("chapterIds") List<Long> chapterIds);

    @Query("SELECT c.id FROM Chapter c WHERE c.course.id = :courseId")
    List<Long> findChapterIdsByCourse_Id(@Param("courseId") Long courseId);
}
