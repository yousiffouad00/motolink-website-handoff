package devs.astraweb.motoaccessoriesapi.repository;

import devs.astraweb.motoaccessoriesapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND (u.active IS NULL OR u.active = true)")
    long countActiveByRole(@Param("role") User.Role role);
}
