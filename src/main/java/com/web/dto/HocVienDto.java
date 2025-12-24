package com.web.dto;

import com.web.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class HocVienDto {

    private User user;

    private Course course;

    private List<ResultResponse> results = new ArrayList<>();

    private List<Exam> exams;

    private CourseUser courseUser;

}
