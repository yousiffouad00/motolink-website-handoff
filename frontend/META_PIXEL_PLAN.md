# Meta Pixel launch plan

Pixel: `1149512494760452`. This is a public identifier, not an access token.

## What this implementation measures

| Event | Trigger | Data sent |
| --- | --- | --- |
| PageView | Initial visit and each customer-facing route change | Page context supplied by the pixel |
| ViewContent | Product detail loads successfully | Product ID, effective price, EGP |
| AddToCart | Cart accepts an item | Product ID, quantity, effective value, EGP |
| InitiateCheckout | Checkout dialog opens | Cart product IDs, quantities, estimated total, EGP |
| Purchase | Checkout API returns a newly placed order | Product IDs, quantities, backend order total, EGP |

`Purchase` means **order placed**, not **payment received**. COD, InstaPay, and mobile-wallet payments can be handled later or an order can be cancelled. Use backend order records for actual paid revenue. The event is fired at API success, not on the confirmation page, and is deduplicated by order ID in this browser.

Tracking starts automatically in production; there is no pop-up or visitor choice in the current implementation. A tracking disclosure remains linked from the footer. The supplied noscript pixel was not added because this React storefront needs JavaScript to function.

The code does not intentionally send names, emails, phone numbers, or delivery addresses in event parameters. Review Meta Events Manager's automatic matching and data settings before launch as they are controlled outside this repository.

## Before deployment

1. Confirm pixel `1149512494760452` belongs to the correct Meta business and is available to the intended ad account.
2. Review whether automatic Meta Pixel tracking and the site's disclosure meet the privacy requirements for the audiences and regions served. Add a complete store privacy policy separately as needed. Do not assume a footer disclosure replaces a legally required consent mechanism.
3. Use Meta Events Manager test events on the final domain: browse home and product; add to cart; open checkout; place one test order. Verify the five events, EGP values, and no duplicate Purchase on refresh or retry.
4. Verify production loads `fbevents.js` automatically and the local development build does not send live events by default. Check the browser network requests as well as Events Manager.
5. Configure campaigns to use this pixel and the Purchase event. Compare Ads Manager attributed orders with backend placed and paid orders, allowing for browser blocking, attribution windows, and cancellations.
6. Do not deploy or modify live campaigns until the owner approves the results.

Production builds enable the pixel automatically. Local development builds leave it disabled unless `VITE_META_PIXEL_ENABLE_DEV=true` is set. `VITE_META_PIXEL_ID` can override the default ID.
