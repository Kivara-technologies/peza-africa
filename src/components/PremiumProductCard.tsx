import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, MessageCircle, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/App";

interface Product {
  id: number;
  name: string;
  price: string;
  comparePrice: string | null;
  image: string;
  realPhoto: string | null;
  rating: string;
  reviewCount: number;
  vendor: string;
  whatsappNumber: string | null;
  laybyMonths: number | null;
}

interface Props {
  product: Product;
  variant?: "grid" | "horizontal";
}

export default function PremiumProductCard({ product, variant = "grid" }: Props) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [showReal, setShowReal] = useState(false);

  const fmtK = (p: string | number) => `K${Number(p).toLocaleString()}`;
  const discount = (price: string, compare: string | null) => {
    if (!compare) return 0;
    return Math.round((Number(compare) - Number(price)) / Number(compare) * 100);
  };

  const d = discount(product.price, product.comparePrice);
  const monthly = product.laybyMonths ? Math.ceil(Number(product.price) / product.laybyMonths) : 0;

  const imageSrc = showReal && product.realPhoto ? product.realPhoto : product.image;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const num = product.whatsappNumber || "260977123456";
    const msg = encodeURIComponent(`Hi! I'm interested in "${product.name}" on PEZA. Is it still available?`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div
      className={`bg-white rounded-xl border border-peza-cream-dark overflow-hidden cursor-pointer hover:shadow-peza transition-all hover:-translate-y-1 group ${variant === "horizontal" ? "flex gap-3" : ""}`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className={`relative bg-gradient-to-br from-peza-cream to-peza-cream-dark flex-shrink-0 overflow-hidden ${variant === "horizontal" ? "w-32 h-32" : "aspect-square"}`}>
        <img
          src={imageSrc}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-500 ${showReal ? "grayscale-0" : ""}`}
        />

        {/* Real Photo Toggle */}
        {product.realPhoto && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowReal(!showReal); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${showReal ? "bg-peza-green text-white" : "bg-white/90 text-peza-brown hover:bg-white"}`}
            title={showReal ? "View studio photo" : "View real photo"}
          >
            {showReal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Real Photo Badge */}
        {showReal && product.realPhoto && (
          <span className="absolute top-2 left-2 bg-peza-green text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-fade-in-up">
            ✓ REAL PHOTO
          </span>
        )}

        {d > 0 && !showReal && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-peza-orange to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {d}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className={`p-3 flex flex-col ${variant === "horizontal" ? "flex-1 py-2" : ""}`}>
        <p className="text-xs font-semibold text-peza-brown line-clamp-2 leading-tight">{product.name}</p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-peza-orange">{fmtK(product.price)}</span>
          {product.comparePrice && (
            <span className="text-[10px] text-gray-400 line-through">{fmtK(product.comparePrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-peza-gold text-peza-gold" />
          <span className="text-[10px] text-gray-500">{product.rating} ({product.reviewCount})</span>
        </div>

        {/* Chilimba Badge */}
        {monthly > 0 && (
          <div className="mt-1.5 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1 flex items-center gap-1">
            <span className="text-[10px]">💳</span>
            <span className="text-[10px] font-semibold text-purple-700">
              Chilimba: K{monthly.toLocaleString()}/mo × {product.laybyMonths}mo
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
            className="flex-1 py-1.5 bg-peza-orange text-white text-[10px] font-bold rounded-lg hover:bg-peza-orange-dark transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-3 h-3" /> Add
          </button>
          <button
            onClick={handleWhatsApp}
            className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-3 h-3" /> Ask
          </button>
        </div>
      </div>
    </div>
  );
}
