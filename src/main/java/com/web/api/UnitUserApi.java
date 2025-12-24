package com.web.api;

import com.web.dto.UnitUserDto;
import com.web.entity.Category;
import com.web.service.UnitUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-unit")
@CrossOrigin
public class UnitUserApi {

    @Autowired
    private UnitUserService unitUserService;

    @PostMapping("/user/create")
    public ResponseEntity<?> save(@RequestParam Long id) {
        unitUserService.save(id);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @GetMapping("/teacher/thong-ke")
    public ResponseEntity<?> thongKe(@RequestParam Long course) {
        List<UnitUserDto> result = unitUserService.thongKe(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/admin/thong-ke")
    public ResponseEntity<?> thongKeByAdmin(@RequestParam Long course, @RequestParam("userId") Long userId) {
        List<UnitUserDto> result = unitUserService.thongKeByUserId(course, userId);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
