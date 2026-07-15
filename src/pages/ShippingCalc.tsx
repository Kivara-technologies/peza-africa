import { useState } from "react";
import { Ship, Calculator } from "lucide-react";

const rates: Record<string, Record<string, Record<string, { rate: number; days: string }>>> = {
  sea: {
    China: { Zambia: { rate: 3.2, days: "25-35" }, Kenya: { rate: 3.5, days: "22-32" }, Nigeria: { rate: 3.8, days: "28-38" } },
    India: { Zambia: { rate: 3.8, days: "20-30" }, Kenya: { rate: 3.2, days: "18-28" }, Nigeria: { rate: 4.0, days: "25-35" } },
  },
  air: {
    China: { Zambia: { rate: 8.5, days: "5-8" }, Kenya: { rate: 7.5, days: "4-7" }, Nigeria: { rate: 9.0, days: "6-9" } },
    India: { Zambia: { rate: 9.2, days: "4-7" }, Kenya: { rate: 8.0, days: "4-6" }, Nigeria: { rate: 9.5, days: "5-8" } },
  },
  road: {
    "South Africa": { Zambia: { rate: 4.5, days: "2-4" }, Zimbabwe: { rate: 3.5, days: "1-3" } },
  },
};

const customs = [
  { category: "Electronics", duty: "15%", vat: "16%" },
  { category: "Fashion", duty: "25%", vat: "16%" },
  { category: "Groceries", duty: "5%", vat: "16%" },
  { category: "Auto Parts", duty: "30%", vat: "16%" },
  { category: "Medical", duty: "0%", vat: "16%" },
];

export default function ShippingCalc() {
  const [origin, setOrigin] = useState("China");
  const [dest, setDest] = useState("Zambia");
  const [method, setMethod] = useState<"sea" | "air" | "road">("sea");
  const [weight, setWeight] = useState("10");
  const [result, setResult] = useState<{ cost: string; days: string; method: string; kg: number } | null>(null);

  const calc = () => {
    const kg = parseFloat(weight) || 10;
    const r = rates[method]?.[origin]?.[dest] || { rate: 5.0, days: "10-20" };
    const cost = (kg * r.rate).toFixed(2);
    setResult({ cost: `$${cost}`, days: r.days, method: method.toUpperCase(), kg });
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <Ship className="w-6 h-6 text-peza-brown" />
        <h1 className="text-2xl font-extrabold text-peza-brown">Shipping Calculator</h1>
      </div>

      <div className="bg-white rounded-xl border border-peza-cream-dark p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-peza-brown-light mb-2">Origin Country</label>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm outline-none focus:border-peza-orange bg-white">
            {["China", "India", "UAE", "South Africa", "Turkey"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-peza-brown-light mb-2">Destination</label>
          <select value={dest} onChange={(e) => setDest(e.target.value)} className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm outline-none focus:border-peza-orange bg-white">
            {["Zambia", "Kenya", "Nigeria", "Ghana", "Tanzania", "Zimbabwe"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-peza-brown-light mb-2">Shipping Method</label>
          <div className="flex gap-2">
            {(["sea", "air", "road"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all capitalize ${method === m ? "border-peza-orange text-peza-orange bg-orange-50" : "border-peza-cream-dark text-gray-600"}`}
              >
                🚢 {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-peza-brown-light mb-2">Weight (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="1" className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm font-bold text-peza-brown outline-none focus:border-peza-orange" />
        </div>

        <button onClick={calc} className="w-full py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors flex items-center justify-center gap-2">
          <Calculator className="w-4 h-4" /> Calculate Shipping Cost
        </button>

        {result && (
          <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-xl p-5 text-white text-center">
            <p className="text-xs text-white/60 uppercase tracking-wider">Estimated Cost</p>
            <p className="text-4xl font-extrabold text-peza-gold mt-2">{result.cost}</p>
            <p className="text-sm text-white/80 mt-2">{result.kg}kg via {result.method} · {result.days} days</p>
          </div>
        )}
      </div>

      {/* Customs Duty Rates */}
      <h3 className="text-base font-bold text-peza-brown mt-6 mb-3">Customs Duty Rates</h3>
      <div className="bg-white rounded-xl border border-peza-cream-dark overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-peza-cream-dark">
              <th className="text-left text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Category</th>
              <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Duty</th>
              <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">VAT</th>
            </tr>
          </thead>
          <tbody>
            {customs.map((c) => (
              <tr key={c.category} className="border-b border-peza-cream-dark last:border-0">
                <td className="text-xs font-medium text-peza-brown px-4 py-3">{c.category}</td>
                <td className="text-xs font-bold text-peza-orange text-right px-4 py-3">{c.duty}</td>
                <td className="text-xs text-right px-4 py-3">{c.vat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
