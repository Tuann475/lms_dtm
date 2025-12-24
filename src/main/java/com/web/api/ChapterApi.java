package com.web.api;

import com.web.entity.Chapter;
import com.web.entity.Document;
import com.web.service.ChapterService;
import com.web.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chapter")
@CrossOrigin
public class ChapterApi {

    @Autowired
    private ChapterService chapterService;

    @PostMapping("/teacher/create-update")
    public ResponseEntity<?> save(@RequestBody Chapter chapter) {
        Chapter result = chapterService.save(chapter);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        chapterService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/all/find-by-course")
    public ResponseEntity<?> findByCourse(@RequestParam(value = "course") Long course) {
        List<Chapter> result = chapterService.findByCourse(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/all/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Chapter result = chapterService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }


    @GetMapping("/user/find-by-course")
    public ResponseEntity<?> findByCourseAndUser(@RequestParam(value = "course") Long course) {
        List<Chapter> result = chapterService.findByCourseAndUser(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
