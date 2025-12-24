package com.web.service;

import com.web.entity.PracticeSessionQuestion;
import com.web.repository.PracticeSessionQuestionRepository;
import org.springframework.stereotype.Service;

@Service
public class PracticeSessionQuestionService {

    private final PracticeSessionQuestionRepository repository;

    public PracticeSessionQuestionService(PracticeSessionQuestionRepository repository) {
        this.repository = repository;
    }

    public PracticeSessionQuestion updateSpeakingAnswer(Long questionId,
                                                        Long userId,
                                                        String audioUrl,
                                                        String answerText,
                                                        Integer durationSeconds) {
        PracticeSessionQuestion psq = repository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy practice_session_question"));

        // TODO: nếu PracticeSession có user, có thể kiểm tra quyền userId ở đây.

        // Yêu cầu: thay vì lưu vào speakingAudio, sẽ lưu URL audio vào answerText
        if (audioUrl != null && !audioUrl.isBlank()) {
            psq.setAnswerText(audioUrl); // primary storage in answerText
            psq.setSpeakingAudio(audioUrl); // mirror into speakingAudio for backward compatibility/UI
        }
        if (answerText != null && !answerText.isBlank()) {
            // If API provided additional text answer separate from audio URL, decide storage (append or ignore)
            // Here we ignore to avoid overwriting audio URL; could concatenate if needed.
        }
        Integer attempts = psq.getSpeakingAttempts();
        if (attempts == null) attempts = 0;
        psq.setSpeakingAttempts(attempts + 1);

        // Duration: if entity has field durationSeconds, set it (not present now, requires schema update)
        // if (durationSeconds != null) { psq.setSpeakingDurationSeconds(durationSeconds); }

        return repository.save(psq);
    }
}
