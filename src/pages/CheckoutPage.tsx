import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../api/orders";
import { formatMMK } from "../utils/format";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cargoTotal = items.reduce((sum, i) => sum + i.product.cargoPrice, 0);
  const grandTotal = totalPrice + cargoTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!address.trim()) {
      setError("Please enter a delivery address");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const order = await orderApi.create({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: address.trim(),
      });
      clearCart();
      navigate("/receipt/" + order.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to place order";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-surface-50 dark:bg-surface-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Cart is Empty</h1>
          <p className="text-gray-400 mb-4">Add some products before checking out</p>
          <button
            onClick={() => navigate("/products")}
            className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 dark:bg-surface-900 min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-2xl bg-white dark:bg-surface-800/50 p-6 shadow-lg">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3 py-3">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{item.product.name}</span>
                    <span className="ml-2 text-xs text-gray-400">× {item.quantity}</span>
                  </div>
                  <span className="font-medium text-sm">
                    {formatMMK(item.product.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-surface-100 dark:border-surface-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Products Subtotal</span>
                <span>{formatMMK(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery / Cargo</span>
                <span>{formatMMK(cargoTotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-100 dark:border-surface-800">
                <span>Grand Total</span>
                <span className="text-primary-600">{formatMMK(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-2xl bg-white dark:bg-surface-800/50 p-6 shadow-lg">
            <h2 className="font-semibold text-lg mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 09xxxxxxxxx"
                  className="w-full rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-2xl bg-white dark:bg-surface-800/50 p-6 shadow-lg">
            <h2 className="font-semibold text-lg mb-4">Delivery Address</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address..."
              rows={3}
              className="w-full rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary-500 py-3.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Placing Order..." : "Confirm Purchase"}
          </button>
        </form>
      </div>
    </div>
  );
}