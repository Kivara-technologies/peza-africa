import { Routes, Route } from "react-router";
import { useState, useEffect, createContext, useContext } from "react";
import { Toaster, toast } from "sonner";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import USSDBanner from "./components/USSDBanner";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";
import Jobs from "./pages/Jobs";
import Suppliers from "./pages/Suppliers";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import MarketPrices from "./pages/MarketPrices";
import ShippingCalc from "./pages/ShippingCalc";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Cart Context
interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendor: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: number; name: string; price: string | number; image: string; vendor: string }) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  count: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  count: 0,
  total: 0,
});

export const useCart = () => useContext(CartContext);

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("peza_cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("peza_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (product: { id: number; name: string; price: string | number; image: string; vendor: string }) => {
    const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const newItem: CartItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: priceNum,
        image: product.image,
        quantity: 1,
        vendor: product.vendor,
      };
      toast.success(`${product.name} added to cart!`);
      return [...prev, newItem];
    });
  };

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty < 1) return;
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartValue: CartContextType = {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    count: cartCount,
    total: cartTotal,
  };

  return (
    <CartContext.Provider value={cartValue}>
      <div className="min-h-screen bg-peza-cream">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#3E2723",
              color: "#fff",
              border: "1px solid #FFC107",
            },
          }}
        />
        <USSDBanner />
        <Header />
        <main className="pb-20 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/shipping" element={<ShippingCalc />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </CartContext.Provider>
  );
}
