import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, MessageCircle, ShoppingCart, Star, Truck, CheckCircle, AlertCircle } from "lucide-react";
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
  stock?: number | null;
  isDeal?: boolean;
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
    if (!compare || Number(compare) <= Number(price)) return 0;
    return Math.round(((Number(compare) - Number(price)) / Number(compare)) * 100);
  };

  const d = discount(product.price, product.comparePrice);
  const monthly = product.laybyMonths ? Math.ceil(Number(product.price) / product.laybyMonths) : 0;
  const stock = product.stock ?? null;
  const outOfStock = stock !== null && stock <= 0;
  const lowStock = stock !== null && stock > 0 && stock <= 5;
  const imageSrc = showReal && product.realPhoto ? product.realPhoto : product.image;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const num = product.whatsappNumber || "260570230160";
    const msg = encodeURIComponent(`Hi! I'm interested in "${product.name}" on PEZA. Is it still available?`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-peza-cream-dark overflow-hidden cursor-pointer hover:shadow-peza transition-all hover:-translate-y-1 group ${variant === "horizontal" ? "flex gap-3" : ""}`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className={`relative bg-gradient-to-br from-peza-cream to-peza-cream-dark flex-shrink-0 overflow-hidden ${variant === "horizontal" ? "w-32 h-32" : "aspect-square"}`}>
        <img src={imageSrc} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {d > 0 && !showReal && (
            <span className="bg-gradient-to-r from-peza-orange to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              {d}% OFF
            </span>
          )}
          {product.isDeal && (
            <span className="bg-peza-brown text-white text-[9px] font-bold px-2 py-1 rounded-full">DEAL</span>
          )}
        </div>

        {product.realPhoto && (
          <button onClick={(e) => { e.stopPropagation(); setShowReal(!showReal); }} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${showReal ? "bg-peza-green text-white" : "bg-white/90 text-peza-brown hover:bg-white"}`} title={showReal ? "View studio photo" : "View real photo"}>
            {showReal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {showReal && product.realPhoto && <span className="absolute bottom-2 left-2 bg-peza-green text-white text-[9px] font-bold px-2 py-1 rounded-full">✓ REAL PHOTO</span>}
      </div>

      <div className={`p-3 flex flex-col ${variant === "horizontal" ? "flex-1 py-2" : ""}`}>
        <p className="text-xs font-semibold text-peza-brown line-clamp-2 leading-tight min-h-[2.4em]">{product.name}</p>

        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-base font-extrabold text-peza-orange">{fmtK(product.price)}</span>
          {product.comparePrice && <span className="text-[10px] text-gray-400 line-through">{fmtK(product.comparePrice)}</span>}
        </div>

        <div className="flex items-center justify-between mt-1.5 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Star className="w-3 h-3 fill-peza-gold text-peza-gold flex-shrink-0" />
            <span className="text-[10px] font-semibold text-gray-600">{product.rating}</span>
            <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
          </div>
          {stock === null ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-peza-green"><Truck className="w-3 h-3" /> Delivery</span>
          ) : outOfStock ? (
            <span className="text-[10px] font-bold text-red-600">Out of stock</span>
          ) : lowStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600"><AlertCircle className="w-3 h-3" /> {stock} left</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-peza-green"><CheckCircle className="w-3 h-3" /> In stock</span>
          )}
        </div>

        {monthly > 0 && (
          <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1">
            <span className="text-[10px] font-semibold text-purple-700">Pay from K{monthly.toLocaleString()}/mo × {product.laybyMonths}mo</span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button disabled={outOfStock} onClick={(e) => { e.stopPropagation(); addItem(product); }} className="flex-1 py-2 bg-peza-orange text-white text-[10px] font-bold rounded-lg hover:bg-peza-orange-dark transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <ShoppingCart className="w-3 h-3" /> {outOfStock ? "Unavailable" : "Add to cart"}
          </button>
          <button onClick={handleWhatsApp} className="px-3 py-2 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
            <MessageCircle className="w-3 h-3" /> Ask
          </button>
        </div>
      </div>
    </div>
  );
}
