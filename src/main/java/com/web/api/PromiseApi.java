package com.web.api;

import com.web.entity.Course;
import com.web.entity.Promise;
import com.web.service.PromiseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/promise")
@CrossOrigin
public class PromiseApi {

    @Autowired
    PromiseService promiseService;

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        promiseService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Promise result = promiseService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/admin/update")
    public ResponseEntity<?> update(@RequestBody Promise promise) {
        promiseService.save(promise);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
