package com.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đơn giản cho thống kê điểm trung bình bài thi theo ngày.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAverageByDateDto {
    private String date;       // yyyy-MM-dd
    private Double average;    // điểm trung bình (thang 10)
    private Long count;        // số bài thi đã chấm trong ngày
}

