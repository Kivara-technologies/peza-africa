import { trpc } from "@/providers/trpc";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MarketPrices() {
  const { data: commodities } = trpc.market.list.useQuery({ category: "commodities" });
  const { data: fuel } = trpc.market.list.useQuery({ category: "fuel" });
  const { data: currency } = trpc.market.list.useQuery({ category: "currency" });

  const sections = [
    { title: "Commodities", data: commodities },
    { title: "Fuel", data: fuel },
    { title: "Currencies", data: currency },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-peza-brown" />
        <h1 className="text-2xl font-extrabold text-peza-brown">Market Prices</h1>
      </div>
      <p className="text-xs text-gray-500 mb-4">Live rates - Updated: {new Date().toLocaleTimeString()}</p>

      {sections.map(({ title, data }) => (
        <div key={title} className="mb-4">
          <div className="bg-peza-brown text-white px-4 py-2.5 rounded-t-xl">
            <h3 className="text-sm font-bold">{title}</h3>
          </div>
          <div className="bg-white rounded-b-xl border border-peza-cream-dark border-t-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-peza-cream-dark">
                  <th className="text-left text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Item</th>
                  <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Price</th>
                  <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((m) => (
                  <tr key={m.id} className="border-b border-peza-cream-dark last:border-0">
                    <td className="text-xs font-medium text-peza-brown px-4 py-3">{m.item}</td>
                    <td className="text-xs font-bold text-peza-brown text-right px-4 py-3">{m.price}</td>
                    <td className="text-xs font-bold text-right px-4 py-3">
                      <span className={`flex items-center justify-end gap-1 ${m.isUp === true ? "text-peza-green" : m.isUp === false ? "text-peza-red" : "text-gray-500"}`}>
                        {m.isUp === true ? <TrendingUp className="w-3 h-3" /> : m.isUp === false ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {m.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
