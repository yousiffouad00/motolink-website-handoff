export default function TrackingPrivacy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-motolink-blue-dark">
      <h1 className="font-display font-bold text-3xl mb-5">Marketing tracking</h1>
      <p className="mb-4">
        Motolink uses Meta Pixel automatically to understand visits from our Facebook and
        Instagram ads and whether visitors view products, add items to a cart, start checkout,
        or place an order. An order placed on our website is counted as a Purchase event even
        when payment is coordinated later; it does not mean payment has been received.
      </p>
      <p className="mb-4">
        We send product IDs, quantities, order value in EGP, and the page or event involved.
        We do not intentionally send your name, email, phone number, or delivery address in
        these events. Meta may process this activity under its own policies and use cookies or
        similar technology. Read Meta’s {" "}
        <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-motolink-blue underline">
          privacy policy
        </a>.
      </p>
      <p>
        Browser settings or extensions may limit this tracking. This notice describes our Meta
        Pixel use; it is not a complete store privacy policy.
      </p>
    </main>
  );
}
