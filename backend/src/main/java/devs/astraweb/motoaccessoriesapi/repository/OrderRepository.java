package devs.astraweb.motoaccessoriesapi.repository;

import devs.astraweb.motoaccessoriesapi.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
}
