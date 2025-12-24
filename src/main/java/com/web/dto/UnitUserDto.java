package com.web.dto;

import com.web.entity.Unit;
import com.web.entity.User;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UnitUserDto {

    private User user;

    private List<UnitDto> units = new ArrayList<>();
}
