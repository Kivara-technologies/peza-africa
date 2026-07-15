import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Package, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-orange-50 text-orange-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function Orders() {
  const [filter, setFilter] = useState("all");
  const { data: orders } = trpc.order.list.useQuery();

  const filtered = filter === "all" ? orders : orders?.filter((o) => o.status === filter);
  const fmtK = (p: string | number) => `K${Number(p).toLocaleString()}`;

  const filters = ["all", "pending", "processing", "shipped", "delivered"];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold text-peza-brown mb-4">My Orders</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all capitalize ${filter === f ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-peza-cream-dark p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Order {order.orderNumber}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-50 text-gray-600"}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm font-bold text-peza-orange mt-1">{fmtK(order.total)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-peza-cream rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-peza-brown">No orders yet</h3>
          <p className="text-sm text-gray-500 mt-1">Start shopping to see your orders here</p>
        </div>
      )}
    </div>
  );
}
