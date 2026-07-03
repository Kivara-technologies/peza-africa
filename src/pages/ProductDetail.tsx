import { useParams, useNavigate } from "react-router";
import { Star, Truck, Shield, RotateCcw, Heart, Share2, Minus, Plus, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/App";
import { toast } from "sonner";
import ChilimbaCalculator from "@/components/ChilimbaCalculator";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [showReal, setShowReal] = useState(false);

  const { data: product } = trpc.product.byId.useQuery({ id: Number(id) });

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4 opacity-50">📦</div>
        <h3 className="text-lg font-bold text-peza-brown">Product not found</h3>
        <button onClick={() => navigate("/shop")} className="mt-4 bg-peza-orange text-white px-6 py-2 rounded-lg font-bold text-sm">
          Browse Products
        </button>
      </div>
    );
  }

  const fmtK = (p: string | number) => `K${Number(p).toLocaleString()}`;
  const discount = (price: string, compare: string | null) => {
    if (!compare) return 0;
    return Math.round((Number(compare) - Number(price)) / Number(compare) * 100);
  };
  const d = discount(product.price, product.comparePrice);
  const imageSrc = showReal && product.realPhoto ? product.realPhoto : product.image;

  const handleBuyNow = () => {
    addItem(product);
    toast.success("Added to cart! Proceeding to checkout...");
    setTimeout(() => navigate("/cart"), 500);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-peza-cream to-peza-cream-dark aspect-[4/3]">
        <img src={imageSrc || ""} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />

        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
          <span className="text-lg">←</span>
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          {/* Real Photo Toggle */}
          {product.realPhoto && (
            <button
              onClick={() => setShowReal(!showReal)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${showReal ? "bg-peza-green text-white" : "bg-white/90 text-peza-brown"}`}
              title={showReal ? "Studio Photo" : "Real Photo"}
            >
              {showReal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => setLiked(!liked)} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${liked ? "bg-red-500 text-white" : "bg-white/90 text-gray-600"}`}>
            <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
          </button>
          <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors text-gray-600">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {showReal && product.realPhoto && (
          <span className="absolute top-20 left-4 bg-peza-green text-white text-xs font-bold px-3 py-1 rounded-full animate-fade-in-up">
            ✓ AUTHENTIC REAL PHOTO
          </span>
        )}
        {d > 0 && !showReal && (
          <span className="absolute bottom-4 left-4 bg-gradient-to-r from-peza-orange to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {d}% OFF
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-extrabold text-peza-brown leading-tight flex-1">{product.name}</h1>
          {d > 0 && <span className="flex-shrink-0 bg-peza-orange text-white text-xs font-bold px-3 py-1 rounded-full">{d}% OFF</span>}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-3xl font-extrabold text-peza-orange">{fmtK(product.price)}</span>
          {product.comparePrice && <span className="text-lg text-gray-400 line-through">{fmtK(product.comparePrice)}</span>}
        </div>

        {/* Chilimba Badge on Detail */}
        {product.laybyMonths && (
          <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
            <span className="text-sm">💳</span>
            <span className="text-xs font-semibold text-purple-700">
              Chilimba: K{Math.ceil(Number(product.price) / product.laybyMonths).toLocaleString()}/mo × {product.laybyMonths}mo
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-peza-gold text-peza-gold" />
            <span className="text-sm font-semibold text-peza-brown">{product.rating}</span>
            <span className="text-xs text-gray-500">({product.reviewCount} reviews)</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1 text-peza-green">
            <Check className="w-4 h-4" />
            <span className="text-sm font-semibold">In Stock</span>
          </div>
        </div>

        {/* Vendor */}
        <div className="bg-peza-cream rounded-xl p-4 mt-4">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Sold by</p>
          <p className="text-sm font-bold text-peza-brown">{product.vendor}</p>
          <p className="text-xs text-gray-500 mt-0.5">⭐ 4.8 Verified Seller</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-peza-cream-dark p-4 mt-4">
          <h3 className="text-sm font-bold text-peza-brown mb-2">Product Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm font-semibold text-peza-brown">Quantity:</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full border-2 border-peza-cream-dark flex items-center justify-center hover:border-peza-orange transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold text-peza-brown w-8 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-full border-2 border-peza-cream-dark flex items-center justify-center hover:border-peza-orange transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions: Add to Cart + Ask Seller */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={() => addItem(product)} className="py-3.5 border-2 border-peza-orange text-peza-orange rounded-xl font-bold text-sm hover:bg-peza-orange/5 transition-colors">
            🛒 Add to Cart
          </button>
          <WhatsAppButton productName={product.name} phone={product.whatsappNumber} size="lg" />
        </div>
        <button onClick={handleBuyNow} className="w-full mt-3 py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors shadow-peza-orange">
          ⚡ Buy Now
        </button>

        {/* Chilimba Calculator */}
        {product.laybyMonths && (
          <div className="mt-5">
            <ChilimbaCalculator price={Number(product.price)} defaultMonths={product.laybyMonths} />
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex justify-around bg-peza-cream rounded-xl p-4 mt-5">
          {[
            { icon: Truck, label: "Fast Delivery" },
            { icon: Shield, label: "Secure Payment" },
            { icon: RotateCcw, label: "Easy Returns" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <Icon className="w-6 h-6 text-peza-brown-light" />
              <span className="text-[10px] font-semibold text-peza-brown-light">{label}</span>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500 font-medium">
          <span>M-Pesa</span>
          <span>Airtel</span>
          <span>MTN</span>
          <span>Wallet</span>
          <span>Chilimba</span>
        </div>
      </div>
    </div>
  );
}
