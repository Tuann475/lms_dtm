package com.web.repository;

import com.web.entity.Unit;
import com.web.entity.UnitUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UnitUserRepository extends JpaRepository<UnitUser, Long> {

    @Query("select u from UnitUser u where u.user.id = ?1 and u.unit.chapter.course.id = ?2 order by u.unit.id desc")
    public List<UnitUser> findByUserAndCourse(Long userId, Long courseId);

    @Query("select u from UnitUser u where u.user.id = ?1 and u.unit.id = ?2")
    Optional<UnitUser> findByUserAndUnit(Long userId, Long unitId);

    void deleteByUnit_Id(Long unitId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UnitUser uu WHERE uu.unit.id IN :unitIds")
    void deleteByUnitIds(@Param("unitIds") List<Long> unitIds);
}
