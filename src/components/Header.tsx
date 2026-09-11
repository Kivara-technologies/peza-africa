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

  const iconButton = "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100 hover:text-peza-brown active:scale-95 focus:outline-none focus:ring-2 focus:ring-peza-orange/30";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-[0_2px_16px_rgba(15,23,42,0.07)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2.5 px-3 sm:gap-4 sm:px-5">
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className={iconButton}
          >
            {menuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
          </button>

          <button
            aria-label="Go to PEZA home"
            onClick={() => navigate("/")}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-0.5 focus:outline-none focus:ring-2 focus:ring-peza-orange/30"
          >
            <img src="/peza-icon.png" alt="PEZA" className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-200/80" />
            <span className="hidden text-[24px] font-extrabold leading-none tracking-[-0.04em] xs:block sm:block">
              <span className="text-peza-orange">P</span><span className="text-peza-brown">E</span><span className="text-peza-brown">Z</span><span className="text-peza-orange">A</span>
            </span>
          </button>

          <div className="mx-auto min-w-0 max-w-2xl flex-1">
            {searchOpen ? (
              <div className="group flex h-11 items-center gap-2 rounded-full border border-peza-orange/50 bg-white px-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.07)] ring-2 ring-peza-orange/10 sm:px-4">
                <Search className="h-5 w-5 shrink-0 text-peza-orange" />
                <input
                  autoFocus
                  type="search"
                  enterKeyHint="search"
                  placeholder={t("nav.search_placeholder")}
                  aria-label="Search products, brands and more"
                  className="w-full min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                />
                <button
                  aria-label="Close search"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                aria-label="Search products"
                className="flex h-11 w-full cursor-text items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/90 px-3.5 text-left transition-all hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-peza-orange/20 sm:px-4"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5 shrink-0 text-slate-500" />
                <span className="truncate text-sm text-slate-400">Search for products, brands and more...</span>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <button aria-label="Wallet" className={`${iconButton} hidden sm:flex`} onClick={() => navigate("/wallet")}>
              <Wallet className="h-5 w-5" />
            </button>
            <button aria-label="Notifications" className={`${iconButton} hidden sm:flex`} onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-peza-orange px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`} className={iconButton} onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5.5 w-5.5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-peza-orange px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 px-4 pt-20 backdrop-blur-sm md:hidden animate-fade-in-up" onClick={() => setMenuOpen(false)}>
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-white/10 bg-peza-brown p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2"><img src="/peza-icon.png" alt="PEZA" className="h-8 w-8 rounded-lg" /><span className="text-lg font-bold">Menu</span></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-peza-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-peza-gold"><Sparkles className="h-3 w-3" /> Top</span>
            </div>
            <div className="flex flex-col gap-2">
              {[{ label: "Home", path: "/", icon: "🏠" },{ label: "Shop", path: "/shop", icon: "🏪" },{ label: "My Cart", path: "/cart", icon: "🛒" },{ label: "My Orders", path: "/orders", icon: "📦" },{ label: "My Wallet", path: "/wallet", icon: "💰" },{ label: "Messages", path: "/chat", icon: "💬" },{ label: "Find Work", path: "/jobs", icon: "💼" },{ label: "Suppliers Hub", path: "/suppliers", icon: "🏭" },{ label: "Market Prices", path: "/market-prices", icon: "📈" },{ label: "Shipping Calculator", path: "/shipping", icon: "🚢" },{ label: "My Profile", path: "/profile", icon: "👤" }].map((item) => (
                <button key={item.path} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-peza-gold/40" onClick={() => { navigate(item.path); setMenuOpen(false); }}>
                  <span className="text-xl">{item.icon}</span><span className="text-lg font-medium text-white">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
