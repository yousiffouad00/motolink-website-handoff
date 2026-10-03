// Centralized API client for the Motolink backend.
// Every request includes credentials so the session cookie (JSESSIONID) is sent/received.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

let csrfToken = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not initialize request security");
  const data = await res.json();
  csrfToken = { value: data.token, headerName: data.headerName || "X-CSRF-TOKEN" };
  return csrfToken;
}

class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || "Request failed");
    this.status = status;
    this.body = body; // may be the {message,status,timestamp} shape OR the flat field-error map
  }
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await getCsrfToken();
    headers[token.headerName] = token.value;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  // 204 No Content (logout) has no body to parse
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

// ---------- Auth ----------
export const signup = (name, email, password) =>
  request("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const login = async (email, password) => {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  csrfToken = null;
  return result;
};

export const logout = async () => {
  const result = await request("/api/auth/logout", { method: "POST" });
  csrfToken = null;
  return result;
};

export const getMe = () => request("/api/auth/me");

// ---------- Categories ----------
export const getCategories = () => request("/api/categories");
export const getCategory = (id) => request(`/api/categories/${id}`);

// ---------- Products ----------
// params: { categoryId, search, page, size, sort }
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return request(`/api/products${query ? `?${query}` : ""}`);
};

export const getProduct = (id) => request(`/api/products/${id}`);

// ---------- Cart ----------
export const getCart = () => request("/api/cart");

export const addCartItem = (productId, quantity = 1) =>
  request("/api/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) });

export const updateCartItem = (cartItemId, quantity) =>
  request(`/api/cart/items/${cartItemId}`, { method: "PUT", body: JSON.stringify({ quantity }) });

export const removeCartItem = (cartItemId) =>
  request(`/api/cart/items/${cartItemId}`, { method: "DELETE" });

// ---------- Wishlist ----------
export const getWishlist = () => request("/api/wishlist");

export const addWishlistItem = (productId) =>
  request("/api/wishlist/items", { method: "POST", body: JSON.stringify({ productId }) });

export const removeWishlistItem = (wishlistItemId) =>
  request(`/api/wishlist/items/${wishlistItemId}`, { method: "DELETE" });

// ---------- Orders ----------
export const checkout = ({ customerName, customerEmail, phone, address, paymentMethod, items, idempotencyKey }) =>
  request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      customerName,
      customerEmail: customerEmail || null,
      phone,
      address,
      paymentMethod,
      idempotencyKey,
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    }),
  });
export const getOrders = () => request("/api/orders");
export const getOrder = (id) => request(`/api/orders/${id}`);

// ---------- Helpers ----------
// Product imageUrls entries are relative paths - prefix them with the backend origin to render them
export const formatPrice = (amount) => `${Number(amount).toFixed(2)} EGP`;
export const resolveImageUrl = (relativePath) => {
  if (
    typeof relativePath !== "string" ||
    !/^\/uploads\/products\/[a-z0-9-]+\.(?:jpe?g|png|webp)$/i.test(relativePath)
  ) {
    return null;
  }
  return `${API_BASE_URL}${relativePath}`;
};
export const getPrimaryImage = (product) => product?.imageUrls?.[0] || null;

export { ApiError, API_BASE_URL };
// ---------- Admin ----------
// Append these to the existing src/api.js (below the "Orders" section).
// Backend endpoints assumed: GET /api/admin/orders, PATCH /api/admin/orders/:id/status,
// GET /api/admin/users. Ask the backend teammate to add these (see checklist already shared).
 
export const getAdminOrders = () => request("/api/admin/orders");
 
export const updateOrderStatus = (orderId, status) =>
  request(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
 
export const getAdminUsers = () => request("/api/admin/users");
// ---------- Admin: Product CRUD (multipart/form-data) ----------
// Separate from the generic `request()` helper because these send FormData,
// not JSON - the browser must set its own multipart Content-Type boundary.
async function requestMultipart(path, options = {}) {
  const token = await getCsrfToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      [token.headerName]: token.value,
      ...options.headers,
    },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

// productData: { name, description, price, brand, categoryId, stockQuantity }
export const createProduct = (productData, imageFiles = []) => {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(productData)], { type: "application/json" })
  );
  imageFiles.forEach((file) => formData.append("images", file));
  return requestMultipart("/api/products", { method: "POST", body: formData });
};

export const updateProduct = (id, productData, imageFiles = []) => {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(productData)], { type: "application/json" })
  );
  imageFiles.forEach((file) => formData.append("images", file));
  return requestMultipart(`/api/products/${id}`, { method: "PUT", body: formData });
};

export const deleteProduct = (id) => request(`/api/products/${id}`, { method: "DELETE" });
export const updateUserRole = (userId, role) =>
  request(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const deleteUser = (userId) =>
  request(`/api/admin/users/${userId}`, { method: "DELETE" });
export const updateProfile = (name, currentPassword, newPassword) =>
  request("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify({ name, currentPassword, newPassword }),
  });
