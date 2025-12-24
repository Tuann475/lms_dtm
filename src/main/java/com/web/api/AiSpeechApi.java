package com.web.api;

import com.web.service.ElevenLabsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/speech")
@CrossOrigin
public class AiSpeechApi {
    private final ElevenLabsService elevenLabsService;

    public AiSpeechApi(ElevenLabsService elevenLabsService) {
        this.elevenLabsService = elevenLabsService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestParam("text") String text,
                                      @RequestParam(value="voiceId", required=false) String voiceId){
        try {
            byte[] data = elevenLabsService.generateSpeech(text, voiceId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.set("Content-Disposition", "attachment; filename=spoken.mp3");
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}

