package com.web.service;

import com.web.dto.UnitDto;
import com.web.dto.UnitUserDto;
import com.web.entity.CourseUser;
import com.web.entity.Unit;
import com.web.entity.UnitUser;
import com.web.entity.User;
import com.web.exception.MessageException;
import com.web.repository.CourseUserRepository;
import com.web.repository.UnitRepository;
import com.web.repository.UnitUserRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class UnitUserService {


    @Autowired
    private UnitUserRepository unitUserRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private CourseUserRepository courseUserRepository;

    @Autowired
    private UnitRepository unitRepository;

    public void save(Long unitId) {
        User user = userUtils.getUserWithAuthority();
        if (unitUserRepository.findByUserAndUnit(user.getId(), unitId).isPresent()) {
            throw new MessageException("Bai hoc da duoc them", 202);
        }
        Unit unit = new Unit();
        unit.setId(unitId);
        UnitUser unitUser = new UnitUser();
        unitUser.setUnit(unit);
        unitUser.setUser(user);
        unitUser.setCreatedDate(LocalDateTime.now());
        unitUserRepository.save(unitUser);
    }

    public List<UnitUserDto> thongKe(Long courseId) {
        List<CourseUser> courseUsers = courseUserRepository.findByCourse(courseId);
        List<UnitUserDto> result = new ArrayList<>();
        List<Unit> units = unitRepository.findByCourse(courseId);
        for (CourseUser c : courseUsers) {
            UnitUserDto dto = new UnitUserDto();
            dto.setUser(c.getUser());
            List<UnitUser> unitUsers = unitUserRepository.findByUserAndCourse(c.getUser().getId(), courseId);
            for (Unit u : units) {
                UnitUser unitUser = null;
                for (UnitUser uuer : unitUsers) {
                    if (u.getId() == uuer.getUnit().getId()) {
                        unitUser = uuer;
                        break;
                    }
                }
                UnitDto unitDto = new UnitDto();
                unitDto.setUnit(u);
                unitDto.setDaHoc(false);
                if (unitUser != null) {
                    unitDto.setCreatedDate(unitUser.getCreatedDate());
                    unitDto.setDaHoc(true);
                }
                dto.getUnits().add(unitDto);
            }
            result.add(dto);
        }
        return result;
    }


    public List<UnitUserDto> thongKeByUserId(Long courseId, Long userId) {
        List<CourseUser> courseUsers = courseUserRepository.findByCourseAndUsers(courseId, userId);
        List<UnitUserDto> result = new ArrayList<>();
        List<Unit> units = unitRepository.findByCourse(courseId);
        for (CourseUser c : courseUsers) {
            UnitUserDto dto = new UnitUserDto();
            dto.setUser(c.getUser());
            List<UnitUser> unitUsers = unitUserRepository.findByUserAndCourse(c.getUser().getId(), courseId);
            for (Unit u : units) {
                UnitUser unitUser = null;
                for (UnitUser uuer : unitUsers) {
                    if (u.getId() == uuer.getUnit().getId()) {
                        unitUser = uuer;
                        break;
                    }
                }
                UnitDto unitDto = new UnitDto();
                unitDto.setUnit(u);
                unitDto.setDaHoc(false);
                if (unitUser != null) {
                    unitDto.setCreatedDate(unitUser.getCreatedDate());
                    unitDto.setDaHoc(true);
                }
                dto.getUnits().add(unitDto);
            }
            result.add(dto);
        }
        return result;
    }
}
