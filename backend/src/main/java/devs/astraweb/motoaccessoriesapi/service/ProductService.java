package devs.astraweb.motoaccessoriesapi.service;

import devs.astraweb.motoaccessoriesapi.Dto.ProductRequest;
import devs.astraweb.motoaccessoriesapi.Dto.ProductResponse;
import devs.astraweb.motoaccessoriesapi.model.Category;
import devs.astraweb.motoaccessoriesapi.model.Product;
import devs.astraweb.motoaccessoriesapi.repository.CategoryRepository;
import devs.astraweb.motoaccessoriesapi.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          FileStorageService fileStorageService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.fileStorageService = fileStorageService;
    }

    public Page<ProductResponse> search(Long categoryId, String search, Pageable pageable) {
        return productRepository.search(categoryId, search, pageable)
                .map(ProductResponse::new);
    }

    public ProductResponse getById(Long id) {
        return new ProductResponse(findEntityById(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request, List<MultipartFile> images) {
        Category category = findCategoryById(request.getCategoryId());

        Product product = new Product();
        applyRequest(product, request, category);

        List<String> newImageUrls = null;
        if (images != null && !images.isEmpty()) {
            newImageUrls = fileStorageService.storeAll(images);
            product.setImageUrls(newImageUrls);
        }

        try {
            Product saved = productRepository.saveAndFlush(product);
            return new ProductResponse(saved);
        } catch (RuntimeException ex) {
            if (newImageUrls != null) {
                fileStorageService.deleteAll(newImageUrls);
            }
            throw ex;
        }
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request, List<MultipartFile> images) {
        Product product = findEntityById(id);
        Category category = findCategoryById(request.getCategoryId());
        applyRequest(product, request, category);

        List<String> oldImageUrls = null;
        List<String> newImageUrls = null;
        if (images != null && !images.isEmpty()) {
            oldImageUrls = List.copyOf(product.getImageUrls());
            newImageUrls = fileStorageService.storeAll(images);
            product.setImageUrls(newImageUrls);
        }

        try {
            Product saved = productRepository.saveAndFlush(product);
            if (oldImageUrls != null) {
                fileStorageService.deleteAll(oldImageUrls);
            }
            return new ProductResponse(saved);
        } catch (RuntimeException ex) {
            if (newImageUrls != null) {
                fileStorageService.deleteAll(newImageUrls);
            }
            throw ex;
        }
    }

    @Transactional
    public void delete(Long id) {
        Product product = findEntityById(id);
        // Archive instead of physically deleting so carts and historical orders remain valid.
        product.setActive(false);
        productRepository.save(product);
    }

    private void applyRequest(Product product, ProductRequest request, Category category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setSalePrice(request.getSalePrice());
        product.setBrand(request.getBrand());
        product.setCategory(category);
        product.setStockQuantity(request.getStockQuantity());
    }

    private Product findEntityById(Long id) {
        return productRepository.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    private Category findCategoryById(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));
    }
}
