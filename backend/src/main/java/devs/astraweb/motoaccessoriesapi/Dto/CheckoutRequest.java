package devs.astraweb.motoaccessoriesapi.Dto;

import devs.astraweb.motoaccessoriesapi.model.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CheckoutRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 120)
    private String customerName;

    @Size(max = 254)
    @Email
    private String customerEmail;

    @NotBlank(message = "رقم التليفون مطلوب")
    @Pattern(regexp = "^01[0125][0-9]{8}$", message = "رقم التليفون غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم")
    private String phone;

    @NotBlank(message = "العنوان مطلوب")
    @Size(max = 500)
    private String address;

    @NotNull(message = "طريقة الدفع مطلوبة")
    private Order.PaymentMethod paymentMethod;

    @NotBlank(message = "Checkout request key is required")
    @Size(max = 64)
    private String idempotencyKey;

    @NotNull(message = "Cart items are required")
    @Size(min = 1, max = 50, message = "Cart must contain between 1 and 50 items")
    private List<@Valid CheckoutItemRequest> items;

    public CheckoutRequest() {
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

    public Order.PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(Order.PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public List<CheckoutItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItemRequest> items) {
        this.items = items;
    }
}
