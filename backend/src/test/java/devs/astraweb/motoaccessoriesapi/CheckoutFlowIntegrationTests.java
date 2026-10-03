package devs.astraweb.motoaccessoriesapi;

import devs.astraweb.motoaccessoriesapi.model.Category;
import devs.astraweb.motoaccessoriesapi.model.Order;
import devs.astraweb.motoaccessoriesapi.model.Product;
import devs.astraweb.motoaccessoriesapi.model.User;
import devs.astraweb.motoaccessoriesapi.repository.CategoryRepository;
import devs.astraweb.motoaccessoriesapi.repository.OrderRepository;
import devs.astraweb.motoaccessoriesapi.repository.ProductRepository;
import devs.astraweb.motoaccessoriesapi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.net.CookieManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:checkout;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "file.upload-dir=target/test-uploads"
})
class CheckoutFlowIntegrationTests {

    @Value("${local.server.port}")
    private int port;

    @Autowired private CategoryRepository categories;
    @Autowired private ProductRepository products;
    @Autowired private OrderRepository orders;
    @Autowired private UserRepository users;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void guestOrderIsIdempotentProtectedByCsrfAndRestockedOnCancellation() throws Exception {
        Category category = categories.save(new Category("Test category", "test-category", "disc"));
        Product product = new Product();
        product.setName("Test helmet");
        product.setCategory(category);
        product.setPrice(new BigDecimal("100.00"));
        product.setStockQuantity(2);
        product = products.saveAndFlush(product);

        HttpClient buyer = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        String key = UUID.randomUUID().toString();
        String orderJson = """
                {"customerName":"Guest Buyer","phone":"01012345678","address":"Cairo",
                 "paymentMethod":"MOBILE_WALLET","idempotencyKey":"%s",
                 "items":[{"productId":%d,"quantity":1}]}
                """.formatted(key, product.getId());

        Csrf csrf = csrf(buyer);
        HttpResponse<String> catalogProduct = send(buyer, "GET", "/api/products/" + product.getId(), null, null);
        assertEquals(200, catalogProduct.statusCode(), catalogProduct.body());
        assertTrue(catalogProduct.body().contains("\"imageUrls\":[]"));

        HttpResponse<String> withoutCsrf = send(buyer, "POST", "/api/orders", orderJson, null);
        assertEquals(401, withoutCsrf.statusCode(), withoutCsrf.body());
        assertTrue(orders.findByIdempotencyKey(key).isEmpty());

        HttpResponse<String> created = send(buyer, "POST", "/api/orders", orderJson, csrf);
        assertEquals(201, created.statusCode(), created.body());
        assertTrue(created.body().contains("\"status\":\"PLACED\""));
        assertTrue(created.body().contains("\"paymentMethod\":\"MOBILE_WALLET\""));

        Order order = orders.findByIdempotencyKey(key).orElseThrow();
        assertEquals(1, products.findById(product.getId()).orElseThrow().getStockQuantity());
        assertEquals(null, order.getUser());

        HttpResponse<String> retry = send(buyer, "POST", "/api/orders", orderJson, csrf);
        assertEquals(201, retry.statusCode(), retry.body());
        assertEquals(1, products.findById(product.getId()).orElseThrow().getStockQuantity());

        String tooMuch = orderJson.replace(key, UUID.randomUUID().toString())
                .replace("\"quantity\":1", "\"quantity\":2");
        HttpResponse<String> oversell = send(buyer, "POST", "/api/orders", tooMuch, csrf);
        assertEquals(400, oversell.statusCode(), oversell.body());

        User admin = new User("Test Admin", "admin-smoke@example.test", passwordEncoder.encode("smoke-password-123"));
        admin.setRole(User.Role.ADMIN);
        users.saveAndFlush(admin);

        HttpClient adminClient = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        Csrf adminCsrf = csrf(adminClient);
        HttpResponse<String> login = send(adminClient, "POST", "/api/auth/login",
                "{\"email\":\"admin-smoke@example.test\",\"password\":\"smoke-password-123\"}", adminCsrf);
        assertEquals(200, login.statusCode(), login.body());
        adminCsrf = csrf(adminClient);

        HttpResponse<String> confirmed = send(adminClient, "PATCH", "/api/admin/orders/" + order.getId() + "/status",
                "{\"status\":\"CONFIRMED\"}", adminCsrf);
        assertEquals(200, confirmed.statusCode(), confirmed.body());
        HttpResponse<String> cancelled = send(adminClient, "PATCH", "/api/admin/orders/" + order.getId() + "/status",
                "{\"status\":\"CANCELLED\"}", adminCsrf);
        assertEquals(200, cancelled.statusCode(), cancelled.body());
        assertEquals(2, products.findById(product.getId()).orElseThrow().getStockQuantity());
        assertEquals(Order.Status.CANCELLED, orders.findById(order.getId()).orElseThrow().getStatus());
    }

    @Test
    void concurrentBuyersCannotOversellTheLastItem() throws Exception {
        Category category = categories.save(new Category("Race category", "race-category", "disc"));
        Product product = new Product();
        product.setName("Last helmet");
        product.setCategory(category);
        product.setPrice(new BigDecimal("100.00"));
        product.setStockQuantity(1);
        long productId = products.saveAndFlush(product).getId();
        long initialOrders = orders.count();

        HttpClient firstBuyer = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        HttpClient secondBuyer = HttpClient.newBuilder().cookieHandler(new CookieManager()).build();
        Csrf firstCsrf = csrf(firstBuyer);
        Csrf secondCsrf = csrf(secondBuyer);
        String firstOrder = orderJson(productId);
        String secondOrder = orderJson(productId);
        CountDownLatch start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            var first = pool.submit(() -> {
                start.await();
                return send(firstBuyer, "POST", "/api/orders", firstOrder, firstCsrf).statusCode();
            });
            var second = pool.submit(() -> {
                start.await();
                return send(secondBuyer, "POST", "/api/orders", secondOrder, secondCsrf).statusCode();
            });
            start.countDown();
            int firstStatus = first.get(10, TimeUnit.SECONDS);
            int secondStatus = second.get(10, TimeUnit.SECONDS);
            assertTrue((firstStatus == 201 && secondStatus == 400)
                    || (firstStatus == 400 && secondStatus == 201),
                    "Expected one accepted and one rejected order; got " + firstStatus + ", " + secondStatus);
        } finally {
            pool.shutdownNow();
        }
        assertEquals(0, products.findById(productId).orElseThrow().getStockQuantity());
        assertEquals(initialOrders + 1, orders.count());
    }

    private String orderJson(long productId) {
        return """
                {"customerName":"Race Buyer","phone":"01012345678","address":"Cairo",
                 "paymentMethod":"CASH_ON_DELIVERY","idempotencyKey":"%s",
                 "items":[{"productId":%d,"quantity":1}]}
                """.formatted(UUID.randomUUID(), productId);
    }

    private Csrf csrf(HttpClient client) throws Exception {
        HttpResponse<String> response = send(client, "GET", "/api/auth/csrf", null, null);
        assertEquals(200, response.statusCode(), response.body());
        String token = jsonString(response.body(), "token");
        String header = jsonString(response.body(), "headerName");
        assertNotNull(token);
        assertNotNull(header);
        return new Csrf(header, token);
    }

    private HttpResponse<String> send(HttpClient client, String method, String path, String body, Csrf csrf)
            throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (body != null) {
            request.header("Content-Type", "application/json");
        }
        if (csrf != null) {
            request.header(csrf.header(), csrf.token());
        }
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String jsonString(String json, String field) {
        Matcher matcher = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private record Csrf(String header, String token) {}
}
