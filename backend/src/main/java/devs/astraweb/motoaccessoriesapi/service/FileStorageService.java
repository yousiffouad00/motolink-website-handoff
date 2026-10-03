package devs.astraweb.motoaccessoriesapi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final int MAX_IMAGES = 5;

    private final Path uploadDir;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDirPath) {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + this.uploadDir, e);
        }
    }

    // Returns the relative URL path (e.g. "/uploads/products/xyz.jpg") to store on the Product entity
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        try {
            byte[] bytes = file.getBytes();
            String extension = detectImageExtension(bytes);
            String filename = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(filename);
            Files.write(target, bytes);
            return "/uploads/products/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded file", e);
        }
    }

    // Stores every non-empty file in the list and returns their relative URLs, in order.
    // If any file fails validation/storage, files already written for this batch are removed.
    public List<String> storeAll(List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();
        if (files == null) {
            return urls;
        }
        if (files.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("A product can have at most " + MAX_IMAGES + " images");
        }
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    urls.add(store(file));
                }
            }
            return urls;
        } catch (RuntimeException ex) {
            deleteAll(urls);
            throw ex;
        }
    }

    // Deletes the old image file when a product's image is replaced - best-effort, does not throw on failure
    public void delete(String relativeUrl) {
        if (relativeUrl == null || relativeUrl.isBlank()) {
            return;
        }
        try {
            String filename = relativeUrl.substring(relativeUrl.lastIndexOf('/') + 1);
            Files.deleteIfExists(uploadDir.resolve(filename));
        } catch (IOException ignored) {
            // Non-critical - an orphaned file on disk is not worth failing the request over
        }
    }

    // Deletes every file in the list - best-effort, same semantics as delete()
    public void deleteAll(List<String> relativeUrls) {
        if (relativeUrls == null) {
            return;
        }
        for (String url : relativeUrls) {
            delete(url);
        }
    }

    private String detectImageExtension(byte[] bytes) {
        if (bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff) {
            return ".jpg";
        }

        byte[] pngSignature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        if (bytes.length >= pngSignature.length
                && Arrays.equals(Arrays.copyOf(bytes, pngSignature.length), pngSignature)) {
            return ".png";
        }

        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return ".webp";
        }

        throw new IllegalArgumentException("Only valid JPEG, PNG, and WEBP images are allowed");
    }
}
