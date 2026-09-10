import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, ShoppingCart, Bell, Wallet, Menu, X, Sparkles } from "lucide-react";
import { useCart } from "@/App";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/lib/i18n";

export default function Header() {
  const navigate = useNavigate();
  const { count } = useCart();
  const { t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifications } = trpc.notification.list.useQuery();
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-peza-brown border-b-2 border-peza-gold shadow-[0_10px_30px_rgba(19,28,23,0.18)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
            <img src="/peza-icon.png" alt="PEZA" className="w-9 h-9 rounded-lg" />
            <span className="text-2xl font-extrabold tracking-tight hidden sm:block">
              <span className="text-peza-gold">P</span>
              <span className="text-green-500">E</span>
              <span className="text-white">Z</span>
              <span className="text-peza-gold">A</span>
            </span>
          </div>

          <div className="flex-1 max-w-xl">
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-peza-gold/30 shadow-inner">
                <Search className="w-4 h-4 text-peza-gold" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t("nav.search_placeholder")}
                  className="bg-transparent border-none outline-none text-white placeholder-white/50 text-sm flex-1 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-transparent hover:border-peza-gold/30 cursor-pointer transition-all"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-white/50" />
                <span className="text-white/50 text-sm hidden sm:block">Search products, jobs...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative"
              onClick={() => navigate("/wallet")}
            >
              <Wallet className="w-5 h-5" />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-peza-gold text-peza-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-peza-gold text-peza-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-peza-brown-dark pt-20 px-6 md:hidden animate-fade-in-up">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <img src="/peza-icon.png" alt="PEZA" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-lg">Menu</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-peza-gold/10 text-peza-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                <Sparkles className="w-3 h-3" /> Top
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: "Home", path: "/", icon: "🏠" },
                { label: "Shop", path: "/shop", icon: "🏪" },
                { label: "My Cart", path: "/cart", icon: "🛒" },
                { label: "My Orders", path: "/orders", icon: "📦" },
                { label: "My Wallet", path: "/wallet", icon: "💰" },
                { label: "Messages", path: "/chat", icon: "💬" },
                { label: "Find Work", path: "/jobs", icon: "💼" },
                { label: "Suppliers Hub", path: "/suppliers", icon: "🏭" },
                { label: "Market Prices", path: "/market-prices", icon: "📈" },
                { label: "Shipping Calculator", path: "/shipping", icon: "🚢" },
                { label: "My Profile", path: "/profile", icon: "👤" },
              ].map((item) => (
                <button
                  key={item.path}
                  className="flex items-center gap-4 py-3 px-2 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors"
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white font-medium text-lg">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
