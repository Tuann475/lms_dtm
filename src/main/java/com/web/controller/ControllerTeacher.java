package com.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/teacher")
public class ControllerTeacher {

    @RequestMapping(value = {"/addbaihoc"}, method = RequestMethod.GET)
    public String addbaihoc() {
        return "teacher/addbaihoc";
    }

    @RequestMapping(value = {"/addtailieu"}, method = RequestMethod.GET)
    public String addtailieu() {
        return "teacher/addtailieu";
    }

    @RequestMapping(value = {"/baihoc"}, method = RequestMethod.GET)
    public String baihoc() {
        return "teacher/baihoc";
    }

    @RequestMapping(value = {"/chapter"}, method = RequestMethod.GET)
    public String chapter() {
        return "teacher/chapter";
    }

    @RequestMapping(value = {"/doimatkhau"}, method = RequestMethod.GET)
    public String doimatkhau() {
        return "teacher/doimatkhau";
    }

    @RequestMapping(value = {"/khoahoccuatoi"}, method = RequestMethod.GET)
    public String khoahoccuatoi() {
        return "teacher/khoahoccuatoi";
    }

    @RequestMapping(value = {"/tailieu"}, method = RequestMethod.GET)
    public String tailieu() {
        return "teacher/tailieu";
    }

    @RequestMapping(value = {"/thongke"}, method = RequestMethod.GET)
    public String thongke() {
        return "teacher/thongke";
    }


    @RequestMapping(value = {"/thongtincanhan"}, method = RequestMethod.GET)
    public String taikhoan() {
        return "teacher/taikhoan";
    }

    @RequestMapping(value = {"/addbaithi"}, method = RequestMethod.GET)
    public String addbaithi() {
        return "teacher/addbaithi";
    }

    @RequestMapping(value = {"/baithi"}, method = RequestMethod.GET)
    public String baithiList() {
        return "teacher/baithi";
    }

    @RequestMapping(value = {"/cauhoi"}, method = RequestMethod.GET)
    public String cauhoi() {
        return "teacher/cauhoi";
    }

    @RequestMapping(value = {"/ketqua"}, method = RequestMethod.GET)
    public String ketqua() {
        return "teacher/ketqua";
    }

    @RequestMapping(value = {"/ketquaonluyen"}, method = RequestMethod.GET)
    public String ketquaonluyen() {
        return "teacher/ketquaonluyen";
    }
}
