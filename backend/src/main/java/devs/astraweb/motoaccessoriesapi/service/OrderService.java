package devs.astraweb.motoaccessoriesapi.service;

import devs.astraweb.motoaccessoriesapi.Dto.CheckoutItemRequest;
import devs.astraweb.motoaccessoriesapi.Dto.CheckoutRequest;
import devs.astraweb.motoaccessoriesapi.Dto.OrderResponse;
import devs.astraweb.motoaccessoriesapi.model.*;
import devs.astraweb.motoaccessoriesapi.repository.CartItemRepository;
import devs.astraweb.motoaccessoriesapi.repository.OrderRepository;
import devs.astraweb.motoaccessoriesapi.repository.ProductRepository;
import devs.astraweb.motoaccessoriesapi.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository,
                        CartItemRepository cartItemRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse checkout(String userEmail, CheckoutRequest request) {
        Order existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey()).orElse(null);
        if (existing != null) {
            return new OrderResponse(existing);
        }

        User user = userEmail == null ? null : findUserByEmail(userEmail);

        // A sorted map locks products in a stable order, reducing deadlock risk when two
        // customers buy several of the same products at the same time.
        Map<Long, Integer> requestedQuantities = new TreeMap<>();
        for (CheckoutItemRequest item : request.getItems()) {
            int quantity = requestedQuantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
            if (quantity > 99) {
                throw new IllegalArgumentException("A product quantity cannot exceed 99");
            }
        }

        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(request.getCustomerName().trim());
        String requestedEmail = request.getCustomerEmail();
        order.setCustomerEmail(requestedEmail != null && !requestedEmail.isBlank()
                ? requestedEmail.trim().toLowerCase()
                : user != null ? user.getEmail() : null);
        order.setPhone(request.getPhone());
        order.setAddress(request.getAddress());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setIdempotencyKey(request.getIdempotencyKey());

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : requestedQuantities.entrySet()) {
            Product product = productRepository.findActiveByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + entry.getKey()));
            int quantity = entry.getValue();

            if (product.getStockQuantity() < quantity) {
                throw new IllegalArgumentException(
                        "Insufficient stock for " + product.getName() +
                                " (requested " + quantity + ", available " + product.getStockQuantity() + ")");
            }

            BigDecimal unitPrice = effectivePrice(product);

            OrderItem orderItem = new OrderItem(product, quantity, unitPrice);
            order.addItem(orderItem);

            total = total.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));

            product.setStockQuantity(product.getStockQuantity() - quantity);
        }

        order.setTotalAmount(total);
        order.setStatus(Order.Status.PLACED);

        Order saved = orderRepository.saveAndFlush(order);
        if (user != null) {
            cartItemRepository.deleteByUserId(user.getId());
        }

        return new OrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrderHistory(String userEmail) {
        User user = findUserByEmail(userEmail);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String userEmail, Long orderId) {
        User user = findUserByEmail(userEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Order not found with id: " + orderId);
        }

        return new OrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, Order.Status status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));
        Order.Status current = order.getStatus() == Order.Status.Order_placed
                ? Order.Status.PLACED
                : order.getStatus();

        if (current == status) {
            return new OrderResponse(order);
        }

        boolean allowed = switch (current) {
            case PLACED -> status == Order.Status.CONFIRMED || status == Order.Status.CANCELLED;
            case CONFIRMED -> status == Order.Status.SHIPPED || status == Order.Status.CANCELLED;
            case SHIPPED -> status == Order.Status.DELIVERED;
            case DELIVERED, CANCELLED -> false;
            case Order_placed -> false;
        };
        if (!allowed) {
            throw new IllegalArgumentException("Order cannot move from " + current + " to " + status);
        }
        if (status == Order.Status.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(status);
        return new OrderResponse(orderRepository.save(order));
    }

    private void restoreStock(Order order) {
        Map<Long, Integer> quantitiesByProduct = new TreeMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                quantitiesByProduct.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
            }
        }

        for (Map.Entry<Long, Integer> entry : quantitiesByProduct.entrySet()) {
            productRepository.findByIdForUpdate(entry.getKey()).ifPresent(product ->
                    product.setStockQuantity(product.getStockQuantity() + entry.getValue()));
        }
    }

    // Returns the sale price when the product is actually on sale (sale price set and lower
    // than the regular price), otherwise the regular price. Mirrors ProductResponse's onSale logic
    // so the price charged always matches what the customer saw on screen.
    private BigDecimal effectivePrice(Product product) {
        BigDecimal salePrice = product.getSalePrice();
        if (salePrice != null && salePrice.compareTo(product.getPrice()) < 0) {
            return salePrice;
        }
        return product.getPrice();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }
}
