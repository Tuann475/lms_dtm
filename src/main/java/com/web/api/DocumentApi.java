package com.web.api;

import com.web.entity.Blog;
import com.web.entity.Document;
import com.web.service.BlogService;
import com.web.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.print.Doc;
import java.util.List;

@RestController
@RequestMapping("/api/document")
@CrossOrigin
public class DocumentApi {

    @Autowired
    private DocumentService documentService;

    @PostMapping("/teacher/create-update")
    public ResponseEntity<?> save(@RequestBody Document document) {
        Document result = documentService.save(document);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/teacher/delete")
    public ResponseEntity<?> delete(@RequestParam("id") Long id) {
        documentService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/all/find-by-course")
    public ResponseEntity<?> findByCourse(@RequestParam(value = "course", required = false) Long course) {
        List<Document> result = documentService.findByCourse(course);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/all/findById")
    public ResponseEntity<?> findById(@RequestParam("id") Long id) {
        Document result = documentService.findById(id);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

}
