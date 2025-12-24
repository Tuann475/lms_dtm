package com.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller

public class ControllerUser {

    @RequestMapping(value = {"/baihoc"}, method = RequestMethod.GET)
    public String baihoc(Model model) {
        return "user/baihoc.html";
    }

    @RequestMapping(value = {"/baiviet"}, method = RequestMethod.GET)
    public String baiviet(Model model) {
        return "user/baiviet.html";
    }

    @RequestMapping(value = {"/chitietbaiviet"}, method = RequestMethod.GET)
    public String account() {
        return "user/chitietbaiviet.html";
    }

    @RequestMapping(value = {"/chitietkhoahoc"}, method = RequestMethod.GET)
    public String chitietkhoahoc() {
        return "user/chitietkhoahoc.html";
    }

    @RequestMapping(value = {"/chungchi"}, method = RequestMethod.GET)
    public String chungchi() {
        return "user/chungchi.html";
    }

    @RequestMapping(value = {"/confirm"}, method = RequestMethod.GET)
    public String confirm() {
        return "user/confirm.html";
    }

    @RequestMapping(value = {"/danhsachdethi"}, method = RequestMethod.GET)
    public String danhsachdethi() {
        return "user/danhsachdethi.html";
    }

    @RequestMapping(value = {"/datlaimatkhau"}, method = RequestMethod.GET)
    public String datlaimatkhau() {
        return "user/datlaimatkhau.html";
    }

    @RequestMapping(value = {"/dethi"}, method = RequestMethod.GET)
    public String dethi() {
        return "user/dethi.html";
    }

    @RequestMapping(value = {"/dethionline"}, method = RequestMethod.GET)
    public String dethionline() {
        return "user/dethionline.html";
    }

    @RequestMapping(value = {"/forgot"}, method = RequestMethod.GET)
    public String forgot() {
        return "user/forgot.html";
    }

    @RequestMapping(value = {"/index", "/"}, method = RequestMethod.GET)
    public String index() {
        return "user/index.html";
    }

    @RequestMapping(value = {"/lambaithi"}, method = RequestMethod.GET)
    public String lambaithi() {
        return "user/lambaithi.html";
    }

    @RequestMapping(value = {"/ketqua"}, method = RequestMethod.GET)
    public String ketqua() {
        return "user/ketqua.html";
    }

    @RequestMapping(value = {"/onluyen"}, method = RequestMethod.GET)
    public String onluyen() {
        return "user/onluyen.html";
    }

    @RequestMapping(value = {"/login"}, method = RequestMethod.GET)
    public String login() {
        return "user/login.html";
    }

    @RequestMapping(value = {"/regis"}, method = RequestMethod.GET)
    public String regis() {
        return "user/regis.html";
    }

    @RequestMapping(value = {"/taikhoan"}, method = RequestMethod.GET)
    public String taikhoan() {
        return "user/taikhoan.html";
    }

    @RequestMapping(value = {"/thanhcong"}, method = RequestMethod.GET)
    public String thanhcong() {
        return "user/thanhcong.html";
    }

    @RequestMapping(value = {"/timkhoahoc"}, method = RequestMethod.GET)
    public String timkhoahoc() {
        return "user/timkhoahoc.html";
    }

    @RequestMapping(value = {"/xacnhan"}, method = RequestMethod.GET)
    public String xacnhan() {
        return "user/xacnhan.html";
    }


    @RequestMapping(value = {"/notfound"}, method = RequestMethod.GET)
    public String notfound() {
        return "user/404.html";
    }

    @RequestMapping(value = {"/joinkhoahoc"}, method = RequestMethod.GET)
    public String jhnkh() {
        return "user/joinkhoahoc.html";
    }

    @RequestMapping(value = {"/lichsuonluyen"}, method = RequestMethod.GET)
    public String lichsuonluyen() {
        return "user/lichsuonluyen.html";
    }

    @RequestMapping(value = {"/ketquaonluyen"}, method = RequestMethod.GET)
    public String ketquaonluyen(){
        return "user/ketquaonluyen.html";
    }

    @RequestMapping(value = {"/luyende"}, method = RequestMethod.GET)
    public String luyende(){
        return "user/luyende.html";
    }

    @RequestMapping(value = {"/thongke"}, method = RequestMethod.GET)
    public String thongkeUser() {
        return "user/thongke.html";
    }
}
