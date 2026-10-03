package devs.astraweb.motoaccessoriesapi.controller;

import devs.astraweb.motoaccessoriesapi.Dto.OrderResponse;
import devs.astraweb.motoaccessoriesapi.Dto.UserResponse;
import devs.astraweb.motoaccessoriesapi.model.Order;
import devs.astraweb.motoaccessoriesapi.model.User;
import devs.astraweb.motoaccessoriesapi.repository.OrderRepository;
import devs.astraweb.motoaccessoriesapi.repository.UserRepository;
import devs.astraweb.motoaccessoriesapi.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public AdminController(OrderService orderService, UserRepository userRepository, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateStatusRequest request) {
        Order.Status status = Order.Status.valueOf(request.status().toUpperCase());
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .filter(User::isActive)
                .map(u -> new UserResponse(u, orderRepository.countByUserId(u.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/role")
    @Transactional
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateRoleRequest request,
                                                       Authentication authentication) {
        User currentUser = findByEmail(authentication.getName());
        if (currentUser.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't change your own role");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));

        User.Role newRole = User.Role.valueOf(request.role().toUpperCase());
        if (target.getRole() == User.Role.ADMIN && newRole != User.Role.ADMIN
                && target.isActive() && userRepository.countActiveByRole(User.Role.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one active administrator is required");
        }
        target.setRole(newRole);
        User saved = userRepository.save(target);

        return ResponseEntity.ok(new UserResponse(saved, orderRepository.countByUserId(saved.getId())));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        User currentUser = findByEmail(authentication.getName());
        if (currentUser.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't delete your own account");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));

        if (target.getRole() == User.Role.ADMIN && target.isActive()
                && userRepository.countActiveByRole(User.Role.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one active administrator is required");
        }

        target.setActive(false);
        userRepository.save(target);
        return ResponseEntity.noContent().build();
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    public record UpdateStatusRequest(@NotBlank String status) {}
    public record UpdateRoleRequest(@NotBlank String role) {}
}
