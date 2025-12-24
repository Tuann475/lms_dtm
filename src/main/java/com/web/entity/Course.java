package com.web.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.sql.Date;
import java.sql.Time;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "course")
@Getter
@Setter
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    private String name;

    private String image;

    private String banner;

    private Double price;

    private Double oldPrice;

    private String description;

    private String instruct;

    private String dayOfWeek;

    private String studyTime;

    private Date startDate;

    private Date endDate;

    private Date createdDate;

    private Boolean isfree = false;

    @ManyToOne
    @JoinColumn(name = "teacher")
    private User teacher;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "course", cascade = CascadeType.REMOVE)
    @JsonManagedReference
    private List<Promise> promises = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.REMOVE)
    @JsonBackReference
    private Set<CourseUser> courseUsers;

    private Integer numUser = 0;


}
