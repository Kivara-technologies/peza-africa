import { useState } from "react";
import { Smartphone, X } from "lucide-react";

export default function USSDBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-peza-brown border-b border-peza-gold/30 px-4 py-2.5 flex items-center gap-3">
      <Smartphone className="w-4 h-4 text-peza-gold flex-shrink-0" />
      <p className="text-xs text-white/90 flex-1">
        <span className="font-bold text-peza-gold">No Internet?</span>{" "}
        Dial <span className="font-mono font-bold text-peza-gold">*384#</span> to shop via USSD
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/50 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
