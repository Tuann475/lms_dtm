package com.web.service;

import com.web.entity.*;
import com.web.repository.ChapterRepository;
import com.web.repository.DocumentRepository;
import com.web.repository.UnitUserRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Component
public class ChapterService {

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private UnitUserRepository unitUserRepository;

    public Chapter save(Chapter chapter) {
        chapterRepository.save(chapter);
        return chapter;
    }

    public void delete(Long id) {
        chapterRepository.deleteById(id);
    }

    public Chapter findById(Long id) {
        return chapterRepository.findById(id).get();
    }

    public List<Chapter> findByCourse(Long courseId) {
        List<Chapter> list = chapterRepository.findByCourse(courseId);
        return list;
    }

    public List<Chapter> findByCourseAndUser(Long courseId) {
        User user = userUtils.getUserWithAuthority();
        List<Chapter> list = chapterRepository.findByCourse(courseId);
        if (list.size() > 0) {
            if (list.get(0).getUnits().size() > 0) {
                list.get(0).getUnits().get(0).setLocked(false);
                System.out.println("false");
            }
        } else {
            return list;
        }

        List<UnitUser> unitUsers = unitUserRepository.findByUserAndCourse(user.getId(), courseId);
        if (unitUsers.size() == 0) {
            return list;
        }
        Unit unitCurrent = unitUsers.get(0).getUnit();

        List<Unit> uni = new ArrayList<>();
        for (Chapter c : list) {
            for (int i = 0; i < c.getUnits().size(); i++) {
                uni.add(c.getUnits().get(i));
            }
        }
        for (int i = 0; i < uni.size(); i++) {
            uni.get(i).setLocked(false);
            if (uni.get(i).getId() == unitCurrent.getId()) {
                if (i < uni.size() - 1) {
                    uni.get(i + 1).setLocked(false);
                    return list;
                }
            }
        }
        return list;
    }
}
