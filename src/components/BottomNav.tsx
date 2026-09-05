import { useNavigate, useLocation } from "react-router";
import { Home, LayoutGrid, ShoppingCart, User, MessageCircle } from "lucide-react";
import { useCart } from "@/App";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useCart();

  const tabs = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/shop", icon: LayoutGrid, label: "Categories" },
    { path: "/cart", icon: ShoppingCart, label: "Cart", badge: count },
    { path: "/profile", icon: User, label: "Saved" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-peza-cream-dark shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe">
      <div className="max-w-7xl mx-auto flex items-center justify-around py-1 relative">
        {tabs.map((tab, i) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          // Insert WhatsApp FAB in the middle (after Categories)
          const whatsappFab = i === 2 && (
            <a
              key="whatsapp"
              href="https://wa.me/260977123456?text=Hi%20PEZA!"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center -mt-6"
            >
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all hover:scale-110">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-medium text-green-600 mt-0.5">Chat</span>
            </a>
          );

          return (
            <>
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all relative ${isActive ? "text-peza-orange" : "text-gray-400 hover:text-gray-600"}`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-peza-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium ${isActive ? "text-peza-orange" : ""}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-peza-orange rounded-b" />
                )}
              </button>
              {whatsappFab}
            </>
          );
        })}
      </div>
    </nav>
  );
}
