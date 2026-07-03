import { MessageCircle } from "lucide-react";

interface Props {
  productName: string;
  phone?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "fab";
}

export default function WhatsAppButton({ productName, phone, size = "md", variant = "button" }: Props) {
  const num = phone || "260977123456";
  const msg = encodeURIComponent(`Hi! I'm interested in "${productName}" on PEZA. Is it still available?`);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm",
  };

  if (variant === "fab") {
    return (
      <a
        href={`https://wa.me/${num}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-all hover:scale-110"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    );
  }

  return (
    <a
      href={`https://wa.me/${num}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl font-bold ${sizeClasses[size]} hover:bg-green-600 transition-colors`}
    >
      <MessageCircle className="w-4 h-4" />
      Ask Seller
    </a>
  );
}
