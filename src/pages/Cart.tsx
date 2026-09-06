import { useNavigate } from "react-router";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/App";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, count, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"AIRTEL" | "MTN" | "ZAMTEL" | "WALLET">("AIRTEL");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const createOrder = trpc.order.create.useMutation({
    onSuccess: () => {
      toast.success(
        paymentMethod === "WALLET"
          ? "Order placed and paid from your wallet!"
          : "Order placed — approve the payment prompt on your phone to confirm.",
      );
      clearCart();
      navigate("/orders");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to place order. Please try again.");
      setCheckingOut(false);
    },
  });

  // Shown for the shopper's convenience only — the server recomputes every
  // price and total from the database, so this display total is never what
  // actually gets charged.
  const shipping = count > 0 ? 150 : 0;
  const grandTotal = total + shipping;

  const fmtK = (p: number) => `K${p.toLocaleString()}`;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (deliveryAddress.trim().length < 5) {
      toast.error("Please enter a delivery address");
      return;
    }
    if (deliveryPhone.trim().length < 6) {
      toast.error("Please enter a contact phone number");
      return;
    }
    setCheckingOut(true);

    createOrder.mutate({
      paymentMethod,
      deliveryAddress: deliveryAddress.trim(),
      deliveryPhone: deliveryPhone.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-peza-cream rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-peza-brown">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">Add products to start shopping</p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-peza-orange text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold text-peza-brown mb-4">
        My Cart ({count} {count === 1 ? "item" : "items"})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-peza-cream-dark p-4 flex gap-4"
            >
              <div
                className="w-24 h-24 rounded-lg overflow-hidden bg-peza-cream flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold text-peza-brown line-clamp-2 cursor-pointer hover:text-peza-orange transition-colors"
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.vendor}</p>
                <p className="text-lg font-bold text-peza-orange mt-1">{fmtK(item.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-peza-cream-dark flex items-center justify-center hover:border-peza-orange transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-peza-cream-dark flex items-center justify-center hover:border-peza-orange transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-peza-cream-dark p-5">
            <h2 className="text-lg font-bold text-peza-brown mb-4">Delivery Details</h2>
            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Delivery address (area, street, landmark)"
                className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:border-peza-orange transition-colors"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Contact phone number"
                className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:border-peza-orange transition-colors"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
              />
            </div>

            <h2 className="text-lg font-bold text-peza-brown mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-peza-brown">{fmtK(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-peza-brown">{fmtK(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-peza-green">-K0</span>
              </div>
              <div className="border-t border-peza-cream-dark pt-3 flex justify-between">
                <span className="font-bold text-peza-brown">Total</span>
                <span className="font-extrabold text-peza-orange text-lg">{fmtK(grandTotal)}</span>
              </div>
              <p className="text-[11px] text-gray-400">Final total is confirmed by the server at checkout.</p>
            </div>

            {/* Payment Methods */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-peza-brown mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "AIRTEL" as const, label: "Airtel Money" },
                  { key: "MTN" as const, label: "MTN MoMo" },
                  { key: "ZAMTEL" as const, label: "Zamtel Kwacha" },
                  { key: "WALLET" as const, label: "Wallet" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPaymentMethod(m.key)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${paymentMethod === m.key ? "border-peza-orange text-peza-orange bg-orange-50" : "border-peza-cream-dark text-gray-600 hover:border-peza-orange/50"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentMethod !== "WALLET" && (
                <p className="text-[11px] text-gray-400 mt-2">
                  You'll get a payment prompt on your phone to approve after placing the order.
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full mt-5 py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {checkingOut ? "Processing..." : `Checkout - ${fmtK(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
