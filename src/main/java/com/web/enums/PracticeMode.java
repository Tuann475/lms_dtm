package com.web.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PracticeMode {
    WRONG_ONLY,  // Chỉ câu sai
    ALL_RANDOM   // Tất cả câu hỏi random
}

