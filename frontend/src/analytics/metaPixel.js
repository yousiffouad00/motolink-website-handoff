const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1149512494760452";
const PURCHASES_KEY = "motolink-meta-purchases-v1";
const ENABLED = import.meta.env.PROD || import.meta.env.VITE_META_PIXEL_ENABLE_DEV === "true";

let lastPageKey = null;

function canTrack() {
  return ENABLED && Boolean(PIXEL_ID);
}

function initialize() {
  if (!canTrack()) return false;
  if (window.fbq) return true;

  // Meta's loader is installed automatically in production on the first page view.
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", PIXEL_ID);
  return true;
}

function track(name, data) {
  if (!initialize()) return false;
  window.fbq("track", name, data);
  return true;
}

const effectivePrice = (product) =>
  Number(product?.onSale && product.salePrice != null ? product.salePrice : product?.price);

export function trackPageView(locationKey) {
  if (lastPageKey === locationKey) return;
  if (track("PageView")) lastPageKey = locationKey;
}

export function trackViewContent(product) {
  if (!product?.id) return;
  track("ViewContent", {
    content_ids: [String(product.id)],
    content_type: "product",
    value: effectivePrice(product),
    currency: "EGP",
  });
}

export function trackAddToCart(product, quantity) {
  if (!product?.id || !quantity) return;
  track("AddToCart", {
    content_ids: [String(product.id)],
    content_type: "product",
    contents: [{ id: String(product.id), quantity }],
    value: effectivePrice(product) * quantity,
    currency: "EGP",
  });
}

export function trackInitiateCheckout(items) {
  if (!items?.length) return;
  track("InitiateCheckout", {
    content_ids: items.map((item) => String(item.product.id)),
    content_type: "product",
    contents: items.map((item) => ({ id: String(item.product.id), quantity: item.quantity })),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    value: items.reduce((total, item) => total + effectivePrice(item.product) * item.quantity, 0),
    currency: "EGP",
  });
}

export function trackPurchase(order) {
  if (!order?.id || order.status !== "PLACED" || !order.items?.length) return;
  let sent = [];
  try {
    sent = JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]");
  } catch {
    // A blocked or corrupt store should not stop a legitimate order event.
  }
  if (!Array.isArray(sent)) sent = [];
  if (sent.includes(order.id)) return;

  const contents = order.items
    .filter((item) => item.product?.id)
    .map((item) => ({ id: String(item.product.id), quantity: item.quantity }));
  if (!track("Purchase", {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    num_items: order.items.reduce((total, item) => total + item.quantity, 0),
    value: Number(order.totalAmount),
    currency: "EGP",
  })) return;

  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify([...sent.slice(-49), order.id]));
  } catch {
    // Keep checkout successful even when browser storage is unavailable.
  }
}
