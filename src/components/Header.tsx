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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-[0_4px_18px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 flex items-center gap-2.5 sm:gap-4">
          <button aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-1.5 cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
            <img src="/peza-icon.png" alt="PEZA" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-[24px] leading-none font-extrabold tracking-tight hidden xs:block sm:block">
              <span className="text-peza-orange">P</span><span className="text-peza-brown">E</span><span className="text-peza-brown">Z</span><span className="text-peza-orange">A</span>
            </span>
          </div>

          <div className="flex-1 min-w-0 max-w-2xl mx-auto">
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3.5 sm:px-4 py-2.5 border border-slate-300 shadow-inner">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input autoFocus type="text" placeholder={t("nav.search_placeholder")} className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm flex-1 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} onBlur={() => { if (!searchQuery) setSearchOpen(false); }} />
                <button aria-label="Close search" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
            ) : (
              <button aria-label="Search products" className="w-full flex items-center gap-2.5 bg-slate-50 rounded-full px-3.5 sm:px-4 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-white cursor-text transition-all text-left" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <span className="text-slate-400 text-sm truncate">Search for products, brands and more...</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button aria-label="Wallet" className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => navigate("/wallet")}><Wallet className="w-5 h-5" /></button>
            <button aria-label="Notifications" className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative" onClick={() => navigate("/notifications")}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-peza-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button aria-label="Cart" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-6 h-6" />
              {count > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-peza-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm pt-20 px-4 md:hidden animate-fade-in-up" onClick={() => setMenuOpen(false)}>
          <div className="rounded-3xl border border-white/10 bg-peza-brown p-4 shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2"><img src="/peza-icon.png" alt="PEZA" className="w-8 h-8 rounded-lg" /><span className="font-bold text-lg">Menu</span></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-peza-gold/10 text-peza-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide"><Sparkles className="w-3 h-3" /> Top</span>
            </div>
            <div className="flex flex-col gap-2">
              {[{ label: "Home", path: "/", icon: "🏠" },{ label: "Shop", path: "/shop", icon: "🏪" },{ label: "My Cart", path: "/cart", icon: "🛒" },{ label: "My Orders", path: "/orders", icon: "📦" },{ label: "My Wallet", path: "/wallet", icon: "💰" },{ label: "Messages", path: "/chat", icon: "💬" },{ label: "Find Work", path: "/jobs", icon: "💼" },{ label: "Suppliers Hub", path: "/suppliers", icon: "🏭" },{ label: "Market Prices", path: "/market-prices", icon: "📈" },{ label: "Shipping Calculator", path: "/shipping", icon: "🚢" },{ label: "My Profile", path: "/profile", icon: "👤" }].map((item) => (
                <button key={item.path} className="flex items-center gap-4 py-3 px-3 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors" onClick={() => { navigate(item.path); setMenuOpen(false); }}><span className="text-xl">{item.icon}</span><span className="text-white font-medium text-lg">{item.label}</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
