package com.web.utils;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinaryConfig;

    public String uploadFile(MultipartFile file) {
        try {
            File uploadedFile = convertMultiPartToFile(file);
            Map<String, Object> uploadResult = cloudinaryConfig.uploader().upload(uploadedFile, ObjectUtils.asMap("resource_type", "auto"));
            boolean deleted = uploadedFile.delete();
            if (!deleted) uploadedFile.deleteOnExit();
            return uploadResult.get("url").toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> uploadAudio(MultipartFile file, String folder, String publicId) {
        try {
            File uploadedFile = convertMultiPartToFile(file);
            Map<String, Object> params = ObjectUtils.asMap(
                    "resource_type", "video", // Cloudinary treats many audio codecs reliably under video resource type
                    "folder", folder,
                    "public_id", publicId,
                    "overwrite", true,
                    "use_filename", false,
                    "unique_filename", true,
                    "secure", true
            );
            Map<String, Object> uploadResult = cloudinaryConfig.uploader().upload(uploadedFile, params);
            boolean deleted = uploadedFile.delete();
            if (!deleted) uploadedFile.deleteOnExit();
            return uploadResult; // includes secure_url, public_id, bytes, duration
        } catch (Exception e) {
            throw new RuntimeException("Cloudinary audio upload failed: " + e.getMessage(), e);
        }
    }

    private File convertMultiPartToFile(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String safeName = (original == null || original.isBlank()) ? ("upload_" + UUID.randomUUID() + ".tmp") : original;
        // Use temp directory to avoid cluttering working dir
        File convFile = Files.createTempFile("cloud_up_", safeName).toFile();
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }
}
