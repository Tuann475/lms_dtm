package com.web.service;

import com.web.entity.Course;
import com.web.entity.Promise;
import com.web.entity.Question;
import com.web.exception.MessageException;
import com.web.repository.*;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

@Component
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private PromiseRepository promiseRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private UnitUserRepository unitUserRepository;

    public Course save(Course course) {
        if (course.getOldPrice() != null) {
            if (course.getOldPrice() == 0) {
                course.setOldPrice(null);
            }
        }
        if (course.getId() != null) {
            var temp = courseRepository.findById(course.getId());
            if (temp.isPresent()) {
                course.setImage(temp.get().getImage());
            }
        }

        Course result = courseRepository.save(course);
        for (Promise p : course.getPromises()) {
            p.setCourse(result);
            promiseRepository.save(p);
        }
        return result;
    }

    @Transactional
    public void delete(Long id) {
        // Xóa các bản ghi trong bảng document liên quan đến course trước
        documentRepository.deleteByCourseId(id);
        promiseRepository.deleteByCourseId(id);

        // Xóa các chapter và unit liên quan đến course
        List<Long> chapterIds = chapterRepository.findChapterIdsByCourse_Id(id);
        if (chapterIds != null && !chapterIds.isEmpty()) {
            List<Long> unitIds = unitRepository.findUnitIdsByChapterIds(chapterIds);
            if (unitIds != null && !unitIds.isEmpty()) {
                unitUserRepository.deleteByUnitIds(unitIds);
                unitRepository.deleteUnitsByIds(unitIds);
            }
            chapterRepository.deleteChaptersByIds(chapterIds);
        }

        // Cuối cùng xóa course
        courseRepository.deleteById(id);
    }


    public Course findById(Long id) {
        return courseRepository.findById(id).map(course -> {
            course.setNumUser(course.getCourseUsers().size());
            return course;
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    public List<Course> findAll() {
        List<Course> result = courseRepository.findAllByOrderByCreatedDateDesc();
        result.forEach(p -> {
            p.setNumUser(p.getCourseUsers().size());
        });
        return result;
    }

    public Page<Course> findCourseFree(Pageable pageable) {
        Page<Course> result = courseRepository.findByIsfreeTrue(pageable);
        result.forEach(course -> {
            course.setNumUser(course.getCourseUsers().size());
        });
        return result;
    }

    public Page<Course> findCourseNotFree(Pageable pageable) {
        Page<Course> result = courseRepository.findByIsfreeFalse(pageable);
        result.forEach(course -> {
            course.setNumUser(course.getCourseUsers().size());
        });
        var x = result;
        return result;
    }

    public Page<Course> findByStartDate(Pageable pageable) {
//        Page<Course> result = courseRepository.findByStartDate(new Date(System.currentTimeMillis()),pageable);
        Page<Course> result = courseRepository.findAll(pageable);
        result.getContent().forEach(p -> {
            p.setNumUser(p.getCourseUsers().size());
        });
        return result;
    }

    public List<Course> findByUser() {
        List<Course> result = courseRepository.findByUser(userUtils.getUserWithAuthority().getId());
        result.forEach(p -> {
            p.setNumUser(p.getCourseUsers().size());
        });
        return result;
    }

    public List<Course> findByTeacher() {
        List<Course> result = courseRepository.findByTeacher(userUtils.getUserWithAuthority().getId());
        result.forEach(p -> {
            p.setNumUser(p.getCourseUsers().size());
        });
        return result;
    }

    public Page<Course> searchCourse(Long categoryId, String search, Pageable pageable) {
        Page<Course> result = null;
        if (search == null) {
            search = "";
        }
        search = "%" + search + "%";
        if (categoryId == null) {
            result = courseRepository.searchCourse(search, pageable);
        } else {
            result = courseRepository.searchCourse(search, categoryId, pageable);
        }
        result.getContent().forEach(p -> {
            p.setNumUser(p.getCourseUsers().size());
        });
        return result;
    }
}
