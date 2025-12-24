package com.web.repository;

import com.web.entity.Result;
import com.web.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UnitRepository extends JpaRepository<Unit, Long> {

    @Query("select u from Unit u where u.chapter.id = ?1")
    List<Unit> findByChapter(Long chapterId);

    @Query("select u from Unit u where u.chapter.course.id = ?1")
    List<Unit> findByCourse(Long courseId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Unit u WHERE u.id IN :unitIds")
    void deleteUnitsByIds(@Param("unitIds") List<Long> unitIds);

    @Query("SELECT u.id FROM Unit u WHERE u.chapter.id IN :chapterIds")
    List<Long> findUnitIdsByChapterIds(@Param("chapterIds") List<Long> chapterIds);

}
