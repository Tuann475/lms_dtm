package com.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.web.config.SqlTimeDeserializer;
import lombok.Getter;
import lombok.Setter;

import java.sql.Date;
import java.sql.Time;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CreateExamRequest {
    private String name;
    private Integer limitTime; // minutes
    private Date examDate;
    @JsonFormat(pattern = "HH:mm")
    @JsonDeserialize(using = SqlTimeDeserializer.class)
    private Time examTime;
    private Long courseId;
    private List<LessonDto> lessons = new ArrayList<>();
    private Long id; // optional for update
}
