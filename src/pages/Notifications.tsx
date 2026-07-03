import { trpc } from "@/providers/trpc";
import { Package, Gift, CreditCard, Briefcase, Info, Bell } from "lucide-react";

const typeConfig: Record<string, { icon: typeof Package; color: string; bg: string }> = {
  order: { icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  promo: { icon: Gift, color: "text-peza-orange", bg: "bg-orange-50" },
  payment: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  job: { icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
  info: { icon: Info, color: "text-gray-600", bg: "bg-gray-50" },
};

export default function Notifications() {
  const { data: notifications } = trpc.notification.list.useQuery();
  const utils = trpc.useUtils();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-peza-brown">Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="text-peza-gold text-sm font-semibold hover:text-peza-orange transition-colors"
        >
          Mark all read
        </button>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markRead.mutate({ id: n.id })}
                className={`w-full flex items-start gap-4 p-4 bg-white border border-peza-cream-dark rounded-xl text-left hover:shadow-peza transition-shadow ${!n.read ? "border-l-4 border-l-peza-orange" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-bold" : "font-medium"} text-peza-brown`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 bg-peza-orange rounded-full flex-shrink-0 mt-1.5" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-peza-brown">No notifications</h3>
          <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
