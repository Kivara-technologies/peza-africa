import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Factory, Star, MapPin, CheckCircle, ArrowRight } from "lucide-react";

const supplierCategories = ["All", "Electronics", "Fashion", "General", "Machinery"];

export default function Suppliers() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");
  const { data: suppliers } = trpc.supplier.list.useQuery({ category: activeCat === "All" ? undefined : activeCat });

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-6 h-6 text-peza-brown" />
        <h1 className="text-2xl font-extrabold text-peza-brown">B2B Suppliers Hub</h1>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {supplierCategories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${activeCat === c ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Supplier Listings */}
      {suppliers && suppliers.length > 0 ? (
        <div className="space-y-4">
          {suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-peza-cream-dark overflow-hidden hover:shadow-peza transition-shadow">
              <div className="h-20 bg-gradient-to-r from-peza-brown to-peza-brown-light flex items-center justify-center">
                {s.image ? (
                  <img src={s.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <Factory className="w-8 h-8 text-white/50" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-peza-brown text-sm">{s.name}</h3>
                      {s.verified && (
                        <span className="bg-green-50 text-peza-green text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {s.city}, {s.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-peza-gold text-peza-gold" />
                    <span className="text-sm font-bold text-peza-orange">{s.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Min: {s.minOrder}</span>
                    <span>Lead: {s.leadTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Shipping Calculator CTA */}
          <div className="bg-peza-brown rounded-2xl p-5 text-white">
            <h3 className="font-bold text-base mb-1">Shipping Calculator</h3>
            <p className="text-white/70 text-sm mb-3">Calculate import costs from any supplier</p>
            <button
              onClick={() => navigate("/shipping")}
              className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg"
            >
              Open Calculator <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-peza-brown">No suppliers found</h3>
        </div>
      )}
    </div>
  );
}
