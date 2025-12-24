package com.web.service;

import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class ElevenLabsService {
    @Value("${elevenlabs.apiKey:}")
    private String apiKey;

    @Value("${elevenlabs.modelId:eleven_turbo_v2}")
    private String modelId; // configurable model id (free-tier default)

    private static final String DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // sample voice id
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private final OkHttpClient client = new OkHttpClient();

    public byte[] generateSpeech(String text, String voiceId) throws IOException {
        if(text == null || text.trim().isEmpty()){
            throw new IllegalArgumentException("Text rỗng");
        }
        if(apiKey == null || apiKey.isEmpty()){
            throw new IllegalStateException("Chưa cấu hình elevenlabs.apiKey trong application.properties");
        }
        if(voiceId == null || voiceId.isEmpty()){
            voiceId = DEFAULT_VOICE;
        }
        if(modelId == null || modelId.isEmpty()){
            modelId = "eleven_turbo_v2"; // fallback free-tier model
        }
        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId;
        String bodyJson = "{\"text\": " + toJsonString(text) + ", \"model_id\": \"" + modelId + "\"}";
        RequestBody body = RequestBody.create(JSON, bodyJson);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("xi-api-key", apiKey)
                .addHeader("Accept", "audio/mpeg")
                .build();
        try(Response response = client.newCall(request).execute()){
            if(!response.isSuccessful()){
                String errBody = response.body()!=null? response.body().string(): "";
                throw new IOException("Gọi ElevenLabs thất bại: HTTP " + response.code() + " - " + errBody);
            }
            return response.body() != null ? response.body().bytes() : new byte[0];
        }
    }

    private String toJsonString(String raw){
        // simple escape quotes and newlines
        String esc = raw.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return "\"" + esc + "\"";
    }
}
