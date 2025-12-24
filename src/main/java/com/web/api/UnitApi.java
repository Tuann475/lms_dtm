package com.web.api;

import com.web.entity.Chapter;
import com.web.entity.Unit;
import com.web.service.ChapterService;
import com.web.service.UnitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unit")
@CrossOrigin
public class UnitApi {

    @Autowired
    private UnitService unitService;

    @PostMapping("/teacher/create-update")
    public ResponseEntity<?> save(@RequestBody Unit unit) {
        Unit result = unitService.save(unit);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        unitService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/all/find-by-chapter")
    public ResponseEntity<?> findByChapter(@RequestParam(value = "chapter") Long chapter) {
        List<Unit> result = unitService.findByChapter(chapter);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/all/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Unit result = unitService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
