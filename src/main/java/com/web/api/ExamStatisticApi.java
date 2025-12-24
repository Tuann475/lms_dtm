package com.web.api;

import com.web.dto.ExamAverageByDateDto;
import com.web.service.ResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam/statistic")
@CrossOrigin
public class ExamStatisticApi {

    @Autowired
    private ResultService resultService;

    /**
     * Lấy dữ liệu điểm trung bình bài thi theo ngày cho biểu đồ đường.
     * Nếu không truyền courseId sẽ thống kê trên toàn hệ thống.
     */
    @GetMapping("/avg-by-date")
    public Map<String, Object> averageScoreByDate(@RequestParam(value = "courseId", required = false) Long courseId) {
        List<ExamAverageByDateDto> list = resultService.getAverageExamScoreByDate(courseId);
        String[] labels = list.stream().map(ExamAverageByDateDto::getDate).toArray(String[]::new);
        Double[] data = list.stream().map(ExamAverageByDateDto::getAverage).toArray(Double[]::new);
        Long[] counts = list.stream().map(ExamAverageByDateDto::getCount).toArray(Long[]::new);

        Map<String, Object> res = new HashMap<>();
        res.put("labels", labels);
        res.put("data", data);
        res.put("counts", counts);
        return res;
    }
}
