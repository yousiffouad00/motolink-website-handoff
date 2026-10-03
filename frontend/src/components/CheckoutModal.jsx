import { useState } from "react";
import { X } from "lucide-react";

export default function CheckoutModal({ onConfirm, onClose, submitting }) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  const phoneValid = /^01[0125][0-9]{8}$/.test(phone);
  const valid = customerName.trim() !== "" && phoneValid && address.trim() !== "";

  const handlePhoneChange = (e) => {
    // Strip anything that isn't a digit as the user types, cap at 11 digits
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(digitsOnly);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);
    setAddressTouched(true);
    if (!valid) return;
    onConfirm({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-motolink-slate hover:text-motolink-blue-dark cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 id="checkout-title" className="font-display font-bold text-xl text-motolink-blue-dark mb-1">
          Delivery details
        </h2>
        <p className="text-motolink-slate text-sm mb-6">
          We need this to get your order to you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Full name
            </label>
            <input
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
            {nameTouched && customerName.trim() === "" && (
              <p className="text-red-600 text-xs mt-1">Name is required.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Email <span className="text-motolink-slate">(optional)</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Phone number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => setPhoneTouched(true)}
              placeholder="e.g. 01012345678"
              maxLength={11}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
            {phoneTouched && phone.trim() === "" && (
              <p className="text-red-600 text-xs mt-1">Phone number is required.</p>
            )}
            {phoneTouched && phone.trim() !== "" && !phoneValid && (
              <p className="text-red-600 text-xs mt-1">
                Enter a valid Egyptian phone number (e.g. 01012345678).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Delivery address
            </label>
            <textarea
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setAddressTouched(true)}
              placeholder="Street, building, city…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
            {addressTouched && address.trim() === "" && (
              <p className="text-red-600 text-xs mt-1">Address is required.</p>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-motolink-blue-dark mb-2">
              Payment method
            </legend>
            <div className="flex flex-col gap-2">
              {[
                ["CASH_ON_DELIVERY", "Cash on delivery"],
                ["INSTAPAY", "InstaPay"],
                ["MOBILE_WALLET", "Mobile wallet"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="text-sm text-motolink-blue-dark">{label}</span>
                </label>
              ))}
            </div>
            {paymentMethod !== "CASH_ON_DELIVERY" && (
              <p className="text-motolink-slate text-xs mt-2">
                Our team will contact you on WhatsApp to coordinate payment manually.
              </p>
            )}
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white font-display font-semibold py-2.5 rounded-lg cursor-pointer disabled:cursor-default"
          >
            {submitting ? "Placing order…" : "Confirm order"}
          </button>
        </form>
      </div>
    </div>
  );
}
