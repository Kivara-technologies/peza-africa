import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Package, Wallet, Briefcase, Factory, Bell,
  Globe, TrendingUp, Ship, Settings, LogOut, ChevronRight,
  BarChart3
} from "lucide-react";

const menuItems = [
  { icon: Package, label: "My Orders", path: "/orders", color: "bg-blue-50 text-blue-600" },
  { icon: Wallet, label: "My Wallet", path: "/wallet", color: "bg-green-50 text-green-600" },
  { icon: Briefcase, label: "Find Work", path: "/jobs", color: "bg-purple-50 text-purple-600" },
  { icon: Factory, label: "Suppliers Hub", path: "/suppliers", color: "bg-amber-50 text-amber-600" },
  { icon: BarChart3, label: "Vendor Dashboard", path: "#", color: "bg-orange-50 text-orange-600" },
  { icon: Bell, label: "Notifications", path: "/notifications", color: "bg-red-50 text-red-600" },
  { icon: Globe, label: "Language", path: "#", color: "bg-indigo-50 text-indigo-600" },
  { icon: TrendingUp, label: "Market Prices", path: "/market-prices", color: "bg-cyan-50 text-cyan-600" },
  { icon: Ship, label: "Shipping Calculator", path: "/shipping", color: "bg-teal-50 text-teal-600" },
  { icon: Settings, label: "Settings", path: "#", color: "bg-gray-50 text-gray-600" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: balanceData } = trpc.wallet.balance.useQuery();
  const { data: orders } = trpc.order.list.useQuery();

  const balance = Number(balanceData?.balance || 0);
  const orderCount = orders?.length || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-peza-orange to-red-500 px-4 py-8 text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-3xl font-bold mb-4">
          {user?.name?.[0] || "U"}
        </div>
        <h2 className="text-xl font-bold">{user?.name || "Demo User"}</h2>
        <p className="text-white/70 text-sm">{user?.email || "user@peza.africa"}</p>

        {/* Stats */}
        <div className="flex bg-white/15 rounded-xl mt-5 overflow-hidden">
          <div className="flex-1 py-3 text-center border-r border-white/20">
            <p className="text-xl font-bold">{orderCount}</p>
            <p className="text-xs text-white/70">Orders</p>
          </div>
          <div className="flex-1 py-3 text-center border-r border-white/20">
            <p className="text-xl font-bold">K{balance.toLocaleString()}</p>
            <p className="text-xs text-white/70">Wallet</p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-xl font-bold">12</p>
            <p className="text-xs text-white/70">Reviews</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className="w-full flex items-center gap-4 py-4 bg-white border-b border-peza-cream-dark text-left hover:bg-peza-cream/50 transition-colors rounded-lg px-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-peza-brown">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          );
        })}

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-4 py-4 bg-white border-b border-peza-cream-dark text-left hover:bg-red-50 transition-colors rounded-lg px-3 mt-2"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-500">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="flex-1 text-sm font-medium text-red-500">Log Out</span>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>
      </div>
    </div>
  );
}
