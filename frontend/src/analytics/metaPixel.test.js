import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("./metaPixel.js", import.meta.url), "utf8");

async function setup(production = true) {
  const values = new Map();
  const scripts = [];
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  };
  const code = source.replaceAll("import.meta.env", JSON.stringify({
    PROD: production,
    VITE_META_PIXEL_ID: "1149512494760452",
    VITE_META_PIXEL_ENABLE_DEV: "false",
  }));
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}#${Math.random()}`;
  return { pixel: await import(url), values, scripts };
}

test("pixel loads automatically and counts one page view per route", async () => {
  const { pixel, scripts } = await setup();
  pixel.trackPageView("home");
  pixel.trackPageView("home");
  pixel.trackPageView("home");
  pixel.trackPageView("product");
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.deepEqual(window.fbq.queue.map((call) => call[1]), ["1149512494760452", "PageView", "PageView"]);
});

test("cart and confirmed order events carry product values without personal details", async () => {
  const { pixel, values } = await setup();
  const product = { id: 7, price: 120, salePrice: 100, onSale: true };
  pixel.trackViewContent(product);
  pixel.trackAddToCart(product, 2);
  pixel.trackInitiateCheckout([{ product, quantity: 2 }]);
  const order = {
    id: 42, status: "PLACED", totalAmount: "200.00", customerName: "Private Name", phone: "01012345678",
    items: [{ product, quantity: 2 }],
  };
  pixel.trackPurchase(order);
  pixel.trackPurchase(order);
  pixel.trackPurchase({ ...order, id: 43, status: "CANCELLED" });
  const events = window.fbq.queue.filter((call) => call[0] === "track");
  assert.deepEqual(events.map((call) => call[1]), [
    "ViewContent", "AddToCart", "InitiateCheckout", "Purchase",
  ]);
  assert.equal(events[3][2].value, 200);
  assert.equal(events[3][2].currency, "EGP");
  assert.deepEqual(events[3][2].content_ids, ["7"]);
  assert.ok(!JSON.stringify(events).includes("Private Name"));
  assert.ok(!JSON.stringify(events).includes("01012345678"));
  assert.deepEqual(JSON.parse(values.get("motolink-meta-purchases-v1")), [42]);
});

test("local development does not send live events by default", async () => {
  const dev = await setup(false);
  dev.pixel.trackPageView("home");
  assert.equal(dev.scripts.length, 0);
});
