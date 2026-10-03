package devs.astraweb.motoaccessoriesapi.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_orders_idempotency_key", columnNames = "idempotency_key")
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Nullable for compatibility with orders created before guest checkout snapshots existed.
    @Column(name = "customer_name", length = 120)
    private String customerName;

    @Column(name = "customer_email", length = 254)
    private String customerEmail;

    // Existing orders have no key. New checkout requests always provide one.
    @Column(name = "idempotency_key", updatable = false, length = 64)
    private String idempotencyKey;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PLACED;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public enum Status {
        PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED,
        // Kept temporarily so existing database rows can still be read.
        Order_placed;

        public String apiValue() {
            return this == Order_placed ? PLACED.name() : name();
        }
    }

    public enum PaymentMethod {
        instapay, vodafone_cash, cash_on_delivery;

        @JsonCreator
        public static PaymentMethod fromApiValue(String value) {
            if (value == null) {
                return null;
            }
            return switch (value.trim().toUpperCase()) {
                case "INSTAPAY" -> instapay;
                case "MOBILE_WALLET", "VODAFONE_CASH" -> vodafone_cash;
                case "CASH_ON_DELIVERY" -> cash_on_delivery;
                default -> throw new IllegalArgumentException("Unsupported payment method: " + value);
            };
        }

        public String apiValue() {
            return switch (this) {
                case instapay -> "INSTAPAY";
                case vodafone_cash -> "MOBILE_WALLET";
                case cash_on_delivery -> "CASH_ON_DELIVERY";
            };
        }
    }
}
