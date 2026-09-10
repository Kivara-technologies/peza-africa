import { useMemo, useState } from "react";
import { Bike, BusFront, Calculator, MapPin, Package, Truck } from "lucide-react";

const localBase = 25;
const localPerKm = 4.5;
const intercityRates: Record<string, { standard: number; overnight: number; days: string }> = {
  "Lusaka-Kabwe": { standard: 65, overnight: 100, days: "1-2" },
  "Lusaka-Kitwe": { standard: 80, overnight: 120, days: "1-2" },
  "Lusaka-Ndola": { standard: 80, overnight: 120, days: "1-2" },
  "Lusaka-Livingstone": { standard: 90, overnight: 130, days: "1-2" },
  "Lusaka-Choma": { standard: 75, overnight: 110, days: "1-2" },
  "Lusaka-Chipata": { standard: 100, overnight: 140, days: "2-3" },
  "Lusaka-Mongu": { standard: 110, overnight: 150, days: "2-3" },
  "Lusaka-Kasama": { standard: 120, overnight: 160, days: "2-4" },
  "Lusaka-Solwezi": { standard: 115, overnight: 155, days: "2-3" },
  "Lusaka-Chingola": { standard: 85, overnight: 130, days: "1-2" },
  "Lusaka-Mufulira": { standard: 85, overnight: 130, days: "1-2" },
  "Lusaka-Mansa": { standard: 110, overnight: 150, days: "2-3" },
};
const towns = Object.keys(intercityRates).flatMap((r) => r.split("-"));
const uniqueTowns = [...new Set(towns)];

export default function ShippingCalc() {
  const [mode, setMode] = useState<"local" | "intercity">("local");
  const [distance, setDistance] = useState("5");
  const [weight, setWeight] = useState("2");
  const [from, setFrom] = useState("Lusaka");
  const [to, setTo] = useState("Kitwe");
  const [speed, setSpeed] = useState<"standard" | "overnight">("standard");

  const result = useMemo(() => {
    const kg = Math.max(0.5, Number(weight) || 1);
    if (mode === "local") {
      const km = Math.max(1, Number(distance) || 1);
      const weightFee = Math.max(0, kg - 5) * 10;
      return { cost: Math.ceil(localBase + km * localPerKm + weightFee), days: km <= 8 ? "30-90 min" : "same day", label: "Local delivery" };
    }
    const route = intercityRates[`${from}-${to}`] || intercityRates[`${to}-${from}`];
    if (!route) return { cost: 0, days: "route quote required", label: "Inter-city" };
    const extraWeight = Math.max(0, kg - 5) * 12;
    return { cost: Math.ceil(route[speed] + extraWeight), days: speed === "overnight" ? "next business day" : route.days + " days", label: speed === "overnight" ? "Overnight inter-city" : "Standard inter-city" };
  }, [mode, distance, weight, from, to, speed]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-10">
      <div className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-peza-orange">PEZA Logistics</p><h1 className="text-2xl font-extrabold text-peza-brown mt-1">Shipping Calculator</h1><p className="text-sm text-gray-500 mt-1">Simple ZMW estimates for Lusaka deliveries and Zambia-wide parcel routes.</p></div>
      <div className="grid grid-cols-2 gap-2 mb-4"><button onClick={() => setMode("local")} className={`rounded-2xl p-4 text-left border-2 ${mode === "local" ? "border-peza-orange bg-orange-50" : "border-gray-100 bg-white"}`}><Bike className="w-6 h-6 text-peza-orange" /><p className="font-extrabold text-peza-brown mt-2">Local / intra-city</p><p className="text-xs text-gray-500">Short-distance rider delivery</p></button><button onClick={() => setMode("intercity")} className={`rounded-2xl p-4 text-left border-2 ${mode === "intercity" ? "border-peza-orange bg-orange-50" : "border-gray-100 bg-white"}`}><BusFront className="w-6 h-6 text-peza-orange" /><p className="font-extrabold text-peza-brown mt-2">Zambia-wide</p><p className="text-xs text-gray-500">Bus / courier style parcel rates</p></button></div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        {mode === "local" ? <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold text-gray-500">Distance (km)<input type="number" min="1" value={distance} onChange={(e) => setDistance(e.target.value)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 font-bold" /></label><label className="text-xs font-bold text-gray-500">Package weight (kg)<input type="number" min="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 font-bold" /></label></div> : <><div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold text-gray-500">From<select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 bg-white font-bold">{uniqueTowns.map((town) => <option key={town}>{town}</option>)}</select></label><label className="text-xs font-bold text-gray-500">To<select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 bg-white font-bold">{uniqueTowns.map((town) => <option key={town}>{town}</option>)}</select></label></div><div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold text-gray-500">Service<select value={speed} onChange={(e) => setSpeed(e.target.value as typeof speed)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 bg-white font-bold"><option value="standard">Standard</option><option value="overnight">Overnight</option></select></label><label className="text-xs font-bold text-gray-500">Weight (kg)<input type="number" min="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full rounded-xl border border-peza-cream-dark px-4 py-3 font-bold" /></label></div></>}
        <div className="rounded-2xl bg-peza-brown text-white p-5 flex items-center justify-between gap-4"><div><p className="text-xs text-white/60 uppercase tracking-widest">Estimated {result.label}</p><p className="text-4xl font-extrabold text-peza-gold mt-1">{result.cost ? `K${result.cost.toLocaleString()}` : "Quote"}</p><p className="text-xs text-white/60 mt-1">{result.days} · Zambian Kwacha (ZMW)</p></div><Calculator className="w-9 h-9 text-peza-gold" /></div>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-full py-3 rounded-xl bg-peza-orange text-white font-extrabold flex items-center justify-center gap-2"><Package className="w-4 h-4" /> Use estimate for my shipment</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-5"><div className="bg-white rounded-2xl border border-gray-100 p-4"><MapPin className="w-5 h-5 text-peza-orange" /><p className="font-bold text-sm text-peza-brown mt-2">Upfront estimate</p><p className="text-xs text-gray-500 mt-1">See a price before booking.</p></div><div className="bg-white rounded-2xl border border-gray-100 p-4"><Truck className="w-5 h-5 text-peza-orange" /><p className="font-bold text-sm text-peza-brown mt-2">Local + inter-city</p><p className="text-xs text-gray-500 mt-1">Two flows for Zambia.</p></div><div className="bg-white rounded-2xl border border-gray-100 p-4"><Package className="w-5 h-5 text-peza-orange" /><p className="font-bold text-sm text-peza-brown mt-2">Weight-aware</p><p className="text-xs text-gray-500 mt-1">Heavier parcels add a surcharge.</p></div></div>
      <p className="text-[11px] text-gray-400 mt-5">Rates are PEZA planning estimates informed by published Zambian courier/bus market rates; final price should be confirmed at booking.</p>
    </div>
  );
}
