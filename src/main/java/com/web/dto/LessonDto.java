package com.web.dto;

import com.web.entity.Category;
import com.web.enums.Skill;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Getter
@Setter
public class LessonDto {

    private String name;

    private String content;

    private String linkFile;

    private Skill skill;

    private Category category;
}
