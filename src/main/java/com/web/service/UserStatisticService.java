package com.web.service;

import com.web.dto.UserExamPracticeStatsDto;
import com.web.entity.User;
import com.web.repository.PracticeSessionRepository;
import com.web.repository.ResultRepository;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserStatisticService {

    @Autowired
    private ResultRepository resultRepository;

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    @Autowired
    private UserUtils userUtils;

    public UserExamPracticeStatsDto getStatsForLoggedUser() {
        User user = userUtils.getUserWithAuthority();
        Long userId = user.getId();

        long examCount = resultRepository.countByUser_Id(userId);
        long practiceCount = practiceSessionRepository.countByUser_Id(userId);

        UserExamPracticeStatsDto dto = new UserExamPracticeStatsDto();
        dto.setTotalExamsDone(examCount);
        dto.setTotalPracticesDone(practiceCount);
        dto.setAvgExamScore(null);
        return dto;
    }
}
