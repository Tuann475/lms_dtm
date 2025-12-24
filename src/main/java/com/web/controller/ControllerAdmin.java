package com.web.controller;

import com.web.entity.ExamGradeHistory;
import com.web.enums.Skill;
import com.web.repository.ExamGradeHistoryRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ControllerAdmin {
    private final ExamGradeHistoryRepository examGradeHistoryRepository;

    @Autowired
    public ControllerAdmin(ExamGradeHistoryRepository examGradeHistoryRepository) {
        this.examGradeHistoryRepository = examGradeHistoryRepository;
    }

    @RequestMapping(value = {"/admin/addbaithi"}, method = RequestMethod.GET)
    public String addbaithi() {
        return "admin/addbaithi";
    }

    @RequestMapping(value = {"/admin/addblog"}, method = RequestMethod.GET)
    public String addblog() {
        return "admin/addblog";
    }

    @RequestMapping(value = {"/admin/addkhoahoc"}, method = RequestMethod.GET)
    public String addkhoahoc() {
        return "admin/addkhoahoc";
    }

    @RequestMapping(value = {"/admin/baihoc"}, method = RequestMethod.GET)
    public String baihoc() {
        return "admin/baihoc";
    }

    @RequestMapping(value = {"/admin/baithi"}, method = RequestMethod.GET)
    public String baithi() {
        return "admin/baithi";
    }

    @RequestMapping(value = {"/admin/blog"}, method = RequestMethod.GET)
    public String blog() {
        return "admin/blog";
    }

    @RequestMapping(value = {"/admin/cauhoi"}, method = RequestMethod.GET)
    public String cauhoi() {
        return "admin/cauhoi";
    }

    @RequestMapping(value = {"/admin/danhmuc"}, method = RequestMethod.GET)
    public String danhmuc() {
        return "admin/danhmuc";
    }

    @RequestMapping(value = {"/admin/doanhthu"}, method = RequestMethod.GET)
    public String doanhthu() {
        return "admin/doanhthu";
    }

    @RequestMapping(value = {"/admin/doimatkhau"}, method = RequestMethod.GET)
    public String doimatkhau() {
        return "admin/doimatkhau";
    }

    @RequestMapping(value = {"/admin/hocvien"}, method = RequestMethod.GET)
    public String hocvien() {
        return "admin/hocvien";
    }

    @RequestMapping(value = {"/admin/index"}, method = RequestMethod.GET)
    public String index() {


        return "admin/index";
    }

    @RequestMapping(value = {"/admin/ketqua"}, method = RequestMethod.GET)
    public String ketqua() {
        return "admin/ketqua";
    }


    @RequestMapping(value = {"/admin/ketquaonluyen"}, method = RequestMethod.GET)
    public String ketquaonluyen() {
        return "admin/ketquaonluyen";
    }

    @RequestMapping(value = {"/admin/khoahoc"}, method = RequestMethod.GET)
    public String khoahoc() {
        return "admin/khoahoc";
    }

    @RequestMapping(value = {"/admin/taikhoan"}, method = RequestMethod.GET)
    public String taikhoan() {
        return "admin/taikhoan";
    }

    @RequestMapping(value = {"/admin/taochungchi"}, method = RequestMethod.GET)
    public String taochungchi() {
        return "admin/taochungchi";
    }

    @RequestMapping(value = {"/admin/addthanhvien"}, method = RequestMethod.GET)
    public String addhocvien() {
        return "admin/addthanhvien";
    }

    @GetMapping("/api/result/admin/history")
    @ResponseBody
    public List<ExamGradeHistoryDto> getHistory(@RequestParam("resultExamId") Long resultExamId,
                                                @RequestParam(value = "skill", required = false) Skill skill) {
        List<ExamGradeHistory> list = (skill == null)
                ? examGradeHistoryRepository.findByResultExam_IdOrderByGradedAtDesc(resultExamId)
                : examGradeHistoryRepository.findByResultExam_IdAndSkillOrderByGradedAtDesc(resultExamId, skill);
        return list.stream().map(ExamGradeHistoryDto::fromEntity).collect(Collectors.toList());
    }

    @Data
    public static class ExamGradeHistoryDto {
        private Long id;
        private Float score;
        private String feedback;
        private String gradedAt;
        private String skill;
        private Long graderId;
        private String graderName;

        // Getters and setters

        public static ExamGradeHistoryDto fromEntity(ExamGradeHistory e) {
            ExamGradeHistoryDto dto = new ExamGradeHistoryDto();
            dto.id = e.getId();
            dto.score = e.getScore();
            dto.feedback = e.getFeedback();
            dto.gradedAt = e.getGradedAt() != null ? e.getGradedAt().toString() : null;
            dto.skill = e.getSkill() != null ? e.getSkill().name() : null;
            if (e.getGrader() != null) {
                dto.graderId = e.getGrader().getId();
                dto.graderName = e.getGrader().getFullName() != null ? e.getGrader().getFullName() : e.getGrader().getUsername();
            }
            return dto;
        }
    }
}
