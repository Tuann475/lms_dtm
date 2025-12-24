package com.web.api;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.web.dto.*;
import com.web.entity.User;
import com.web.exception.MessageException;
import com.web.jwt.JwtTokenProvider;
import com.web.repository.UserRepository;
import com.web.service.BlogService;
import com.web.service.GoogleOAuth2Service;
import com.web.service.UserService;
import com.web.service.UserStatisticService;
import com.web.utils.CloudinaryService;
import com.web.utils.MailService;
import com.web.utils.UserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class UserApi {

    private final UserRepository userRepository;

    private final JwtTokenProvider jwtTokenProvider;

    private final UserUtils userUtils;

    private final MailService mailService;

    @Autowired
    private UserService userService;

    @Autowired
    BlogService blogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private GoogleOAuth2Service googleOAuth2Service;

    @Autowired
    private UserStatisticService userStatisticService;


    public UserApi(UserRepository userRepository, JwtTokenProvider jwtTokenProvider, UserUtils userUtils, MailService mailService) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userUtils = userUtils;
        this.mailService = mailService;
    }

    @PostMapping("/login")
    public TokenDto authenticate(@RequestBody LoginDto loginDto) throws Exception {
        TokenDto tokenDto = userService.login(loginDto.getUsername(), loginDto.getPassword());
        return tokenDto;
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody String credential) throws Exception {
        GoogleIdToken.Payload payload = googleOAuth2Service.verifyToken(credential);
        if (payload == null) {
            throw new MessageException("Đăng nhập thất bại");
        }
        TokenDto tokenDto = userService.loginWithGoogle(payload);
        return new ResponseEntity(tokenDto, HttpStatus.OK);
    }


    @PostMapping("/regis")
    public ResponseEntity<?> regisUser(@RequestBody User user) throws URISyntaxException {
        User result = userService.regisUser(user);
        return ResponseEntity
                .created(new URI("/api/register-user/" + user.getUsername()))
                .body(result);
    }

    @PostMapping("/active-account")
    public ResponseEntity<?> activeAccount(@RequestParam String email, @RequestParam String key) throws URISyntaxException {
        userService.activeAccount(key, email);
        return new ResponseEntity<>("kích hoạt thành công", HttpStatus.OK);
    }

    @GetMapping("/admin/check-role-admin")
    public void checkRoleAdmin() {
        System.out.println("admin");
    }

    @GetMapping("/user/check-role-user")
    public void checkRoleUser() {
        System.out.println("user");
    }

    @GetMapping("/teacher/check-role-teacher")
    public void checkRoleTeacher() {
        System.out.println("teacher");
    }


    @PostMapping("/user/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordDto passwordDto) {
        userService.changePass(passwordDto.getOldPass(), passwordDto.getNewPass());
        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @PostMapping("/all/change-password")
    public ResponseEntity<?> changePasswordAll(@RequestBody PasswordDto passwordDto) {
        userService.changePass(passwordDto.getOldPass(), passwordDto.getNewPass());
        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> changePassword(@RequestParam String email) {
        userService.forgotPassword(email);
        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @GetMapping("/admin/get-user-by-role")
    public ResponseEntity<?> getUserByRole(@RequestParam(value = "role", required = false) String role) {
        List<User> users = userService.getUserByRole(role);
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PostMapping("/admin/lockOrUnlockUser")
    public void activeOrUnactiveUser(@RequestParam("id") Long id) {
        User user = userRepository.findById(id).get();
        if (user.getActived() == true) {
            user.setActived(false);
            userRepository.save(user);
            return;
        } else {
            user.setActived(true);
            userRepository.save(user);
        }
    }

    @PostMapping("/admin/addaccount")
    public ResponseEntity<?> addaccount(@RequestBody User user) throws URISyntaxException {
        User result = userService.addAccount(user);
        return ResponseEntity
                .created(new URI("/api/register-user/" + user.getUsername()))
                .body(result);
    }

    @GetMapping("/admin/user-not-in-course/{courseId}")
    public ResponseEntity<?> getUserNotInCourse(@PathVariable Long courseId) {
        List<User> users = userService.findUsersNotInCourseUserByCourseId(courseId);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/all/change-avatar")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String s = cloudinaryService.uploadFile(file);
            User user = userUtils.getUserWithAuthority();
            user.setAvatar(s);
            userRepository.save(user);
            return s;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @PostMapping("/public/quen-mat-khau")
    public ResponseEntity<?> quenMatKhau(@RequestParam String email) throws URISyntaxException {
        userService.guiYeuCauQuenMatKhau(email);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/public/dat-lai-mat-khau")
    public ResponseEntity<?> datLaiMatKhau(@RequestParam String email, @RequestParam String key,
                                           @RequestParam String password) throws URISyntaxException {
        userService.xacNhanDatLaiMatKhau(email, password, key);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/user/user-logged")
    public User getUserLogged() {
        return userUtils.getUserWithAuthority();
    }

    @GetMapping("/teacher/logged")
    public User getUserLogged_tc() {
        return userUtils.getUserWithAuthority();
    }

    @PostMapping("/teacher/update-account")
    public User updateteacher(@RequestBody User user) {
        return userService.updateUser(user);
    }

    @PostMapping("/user/update-account")
    public User updateUser(@RequestBody User user) {
        return userService.updateUser(user);
    }

    @GetMapping("/user/exam-practice-stats")
    public ResponseEntity<?> getUserExamPracticeStats() {
        return new ResponseEntity<>(userStatisticService.getStatsForLoggedUser(), HttpStatus.OK);
    }
}
