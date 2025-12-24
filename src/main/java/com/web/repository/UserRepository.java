package com.web.repository;

import com.web.entity.Authority;
import com.web.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.relational.core.sql.In;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query(value = "select u from User u where u.username = ?1")
    Optional<User> findByUsername(String username);

    @Query(value = "select u from User u where u.email = ?1")
    Optional<User> findByEmail(String email);

    @Query(value = "select u.* from users u where u.id = ?1", nativeQuery = true)
    Optional<User> findById(Long id);

    @Query(value = "select u from User u where u.activation_key = ?1 and u.email = ?2")
    Optional<User> getUserByActivationKeyAndEmail(String key, String email);

    @Query("select u from User u where u.authorities.name = ?1")
    List<User> getUserByRole(String role);

    @Query("select count(u.id) from User u where u.authorities.name = ?1")
    Long countByRole(String role);

    @Query(value = "select count(u.id) from users u where month(u.created_date) = ?1 and year(u.created_date) = ?2", nativeQuery = true)
    Long countUserThisMonth(Integer month, Integer year);

//    List<User> findByActivedAndAuthorityName(String authorityName, boolean actived);

    @Query("SELECT u FROM User u WHERE u.actived = ?1 AND u.authorities = ?2")
    List<User> findByActivedAndAuthorityName(boolean actived, Authority authorityName);


    // Lấy thong tin của các user chưa nằm trong khóa học hiện tại
    @Query("SELECT u FROM User u WHERE u.authorities.name = 'ROLE_USER' AND u.id NOT IN " +
            "(SELECT cu.user.id FROM CourseUser cu WHERE cu.course.id = :courseId)")
    List<User> findUsersNotInCourseUserByCourseId(@Param("courseId") Long courseId);
}
