package com.web.utils;

import com.web.entity.User;
import com.web.enums.UserType;
import com.web.repository.AuthorityRepository;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.sql.Date;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthorityRepository authorityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String username = "admin@gmail.com";
        String password = "admin";
        String email = "admin@gmail.com";

        if (!userRepository.findByUsername(username).isPresent()) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setUserType(UserType.EMAIL);
            user.setActived(true);
            user.setCreatedDate(new Date(System.currentTimeMillis()));
            user.setFullName("ADMIN");
            user.setAuthorities(authorityRepository.findByName(Contains.ROLE_ADMIN));
            userRepository.save(user);
        }
    }
}
