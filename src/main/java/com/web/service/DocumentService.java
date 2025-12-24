package com.web.service;

import com.web.entity.Blog;
import com.web.entity.Document;
import com.web.entity.User;
import com.web.repository.DocumentRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;

@Component
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserUtils userUtils;

    public Document save(Document document) {
        document.setCreatedDate(new Timestamp(System.currentTimeMillis()));
        documentRepository.save(document);
        return document;
    }

    public void delete(Long id) {
        documentRepository.deleteById(id);
    }

    public Document findById(Long id) {
        return documentRepository.findById(id).get();
    }

    public List<Document> findByCourse(Long courseId) {
        List<Document> list = null;
        if (courseId == null) {
            User user = userUtils.getUserWithAuthority();
            list = documentRepository.findByTeacher(user.getId());
        } else {
            list = documentRepository.findByCourse(courseId);
        }
        return list;
    }

}
