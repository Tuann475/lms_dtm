package com.web.api;

import com.web.entity.Blog;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.web.entity.Category;
import com.web.service.BlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin
public class BlogApi {

    @Autowired
    private BlogService blogService;

    @PostMapping("/admin/create-update")
    public ResponseEntity<?> save(@RequestBody Blog blog) {
        Blog result = blogService.save(blog);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        blogService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/public/findAll")
    public ResponseEntity<?> findAll(@RequestParam(value = "search", required = false) String search, Pageable pageable) {
        Page<Blog> result = blogService.findAll(search, pageable);
        // Page<Blog> result = blogService.findAll(search,pageable);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    //    @GetMapping("/public/findAll")
//    public ResponseEntity<String> crawlBlogs() {
//        try {
//            blogService.crawl();
//            return ResponseEntity.ok("Crawl completed successfully!");
//        } catch (IOException e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body("Error occurred while crawling: " + e.getMessage());
//        }
//    }
    @GetMapping("/public/findAllList")
    public ResponseEntity<?> findAllList() {
        List<Blog> result = blogService.findAll();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/public/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Blog result = blogService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

}
