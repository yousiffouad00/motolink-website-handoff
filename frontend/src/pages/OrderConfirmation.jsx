import { CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { formatPrice } from "../api";

const PAYMENT_LABELS = {
  CASH_ON_DELIVERY: "Cash on delivery",
  INSTAPAY: "InstaPay",
  MOBILE_WALLET: "Mobile wallet",
};

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display font-bold text-2xl text-motolink-blue-dark mb-3">
          Your order was submitted
        </h1>
        <p className="text-motolink-slate mb-6">
          Keep your order number from the confirmation screen. Our team will contact you if needed.
        </p>
        <Link to="/" className="text-motolink-blue font-semibold">Continue shopping</Link>
      </main>
    );
  }

  const manualPayment = order.paymentMethod !== "CASH_ON_DELIVERY";

  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <div className="bg-white border border-motolink-blue-light rounded-2xl p-6 sm:p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={48} />
        <h1 className="font-display font-bold text-2xl text-motolink-blue-dark">
          Order #{order.id} received
        </h1>
        <p className="text-motolink-slate mt-2">
          Total: <span className="font-semibold text-motolink-blue-dark">{formatPrice(order.totalAmount)}</span>
        </p>
        <p className="text-motolink-slate mt-1">
          Payment: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
        </p>

        {manualPayment && (
          <div className="mt-6 bg-motolink-blue-light rounded-xl p-4 text-sm text-motolink-blue-dark">
            Our team will contact you on WhatsApp to coordinate payment manually. Do not send money to an unverified number.
          </div>
        )}

        <Link
          to="/"
          className="inline-block mt-7 bg-motolink-blue text-white font-display font-semibold px-5 py-2.5 rounded-lg"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
