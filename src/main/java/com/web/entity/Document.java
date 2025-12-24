package com.web.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.sql.Date;
import java.sql.Timestamp;

@Entity
@Table(name = "document")
@Getter
@Setter
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    private String name;

    private String fileType;

    private String linkFile;

    private String storage;

    private Timestamp createdDate;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
}
