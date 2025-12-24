package com.web.service;

import com.web.entity.Promise;
import com.web.repository.PromiseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PromiseService {

    @Autowired
    PromiseRepository promiseRepository;

    public void delete(Long id) {
        promiseRepository.deleteById(id);
    }

    public Promise findById(Long id) {
        return promiseRepository.findById(id).get();
    }

    public void save(Promise promise) {
        Promise p = promiseRepository.findById(promise.getId()).get();
        promise.setCourse(p.getCourse());
        promiseRepository.save(promise);
    }
}
