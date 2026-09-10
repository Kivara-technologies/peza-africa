import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import {
  Package, Wallet, Briefcase, Factory, Bell,
  Globe, TrendingUp, Ship, Settings, LogOut, ChevronRight,
  BarChart3, Users, ShieldCheck, Sparkles, Pencil, Bike
} from "lucide-react";

function getMenuItems(t: (key: TranslationKey) => string) {
  return [
    { icon: Package, label: "My Orders", path: "/orders", color: "bg-blue-50 text-blue-600" },
    { icon: Wallet, label: "My Wallet", path: "/wallet", color: "bg-green-50 text-green-600" },
    { icon: Users, label: "Chilimba", path: "/chilimba", color: "bg-pink-50 text-pink-600" },
    { icon: Briefcase, label: "Find Work", path: "/jobs", color: "bg-purple-50 text-purple-600" },
    { icon: Factory, label: "Suppliers Hub", path: "/suppliers", color: "bg-amber-50 text-amber-600" },
    { icon: BarChart3, label: "Vendor Dashboard", path: "/vendor", color: "bg-orange-50 text-orange-600" },
    { icon: Bell, label: t("profile.menu.notifications"), path: "/notifications", color: "bg-red-50 text-red-600" },
    { icon: Globe, label: t("profile.menu.language"), path: "/language", color: "bg-indigo-50 text-indigo-600" },
    { icon: TrendingUp, label: t("profile.menu.market_prices"), path: "/market-prices", color: "bg-cyan-50 text-cyan-600" },
    { icon: Ship, label: t("profile.menu.shipping_calculator"), path: "/shipping", color: "bg-teal-50 text-teal-600" },
    { icon: Bike, label: t("profile.menu.rider_dashboard"), path: "/rider", color: "bg-lime-50 text-lime-600" },
    { icon: Settings, label: t("profile.menu.settings"), path: "/settings", color: "bg-gray-50 text-gray-600" },
  ];
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { data: balanceData } = trpc.wallet.balance.useQuery();
  const { data: orders } = trpc.order.list.useQuery();

  const balance = Number(balanceData?.balance || 0);
  const orderCount = orders?.length || 0;
  const reviewCount = Math.max(12, orderCount * 2);
  const menuItems = getMenuItems(t);

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <div className="bg-gradient-to-br from-peza-orange via-peza-orange to-red-500 px-4 py-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-3xl font-bold">
            {user?.name?.[0] || "U"}
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit profile
          </button>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold">{user?.name || "Demo User"}</h2>
          <p className="text-white/75 text-sm">{user?.email || "user@peza.africa"}</p>
        </div>

        <div className="flex bg-white/12 rounded-2xl mt-5 overflow-hidden border border-white/10">
          <div className="flex-1 py-3 text-center border-r border-white/15">
            <p className="text-xl font-bold">{orderCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">Orders</p>
          </div>
          <div className="flex-1 py-3 text-center border-r border-white/15">
            <p className="text-xl font-bold">K{balance.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">Wallet</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-xl font-bold">{reviewCount}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">Reviews</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-2xl border border-peza-cream-dark bg-white p-3 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-peza-brown">Quick actions</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-peza-green">
              <Sparkles className="w-3 h-3" /> Trusted
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", path: "/orders", icon: Package },
              { label: "Wallet", path: "/wallet", icon: Wallet },
              { label: "Saved", path: "/profile", icon: ShieldCheck },
            ].map(({ label, path, icon: Icon }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="rounded-xl border border-peza-cream-dark bg-peza-cream/50 px-2 py-3 text-center transition-colors hover:border-peza-orange hover:bg-white"
              >
                <Icon className="w-4 h-4 text-peza-brown mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-peza-brown">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className="w-full flex items-center gap-4 py-4 bg-white border-b border-peza-cream-dark text-left hover:bg-peza-cream/60 transition-colors rounded-xl px-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-peza-brown">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          );
        })}

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-4 py-4 bg-white border-b border-peza-cream-dark text-left hover:bg-red-50 transition-colors rounded-xl px-3 mt-2"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-500">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="flex-1 text-sm font-medium text-red-500">{t("profile.logout")}</span>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>
      </div>
    </div>
  );
}
