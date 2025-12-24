package com.web.dto;

import com.web.entity.Unit;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UnitDto {

    private Unit unit;

    private Boolean daHoc;

    private LocalDateTime createdDate;
}
