import { useState } from "react";
import { Calculator, Info } from "lucide-react";

interface Props {
  price: number;
  defaultMonths?: number;
}

export default function ChilimbaCalculator({ price, defaultMonths = 3 }: Props) {
  const [months, setMonths] = useState(defaultMonths);
  const monthly = Math.ceil(price / months);
  const total = monthly * months;
  const fee = Math.ceil(price * 0.05); // 5% layby fee

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-bold text-purple-800">💳 Chilimba (Layby)</h3>
        <span title="Pay in installments. 5% layby fee applies.">
          <Info className="w-3 h-3 text-purple-400" />
        </span>
      </div>

      <p className="text-xs text-purple-600 mb-3">
        Pay K{monthly.toLocaleString()} per month for {months} months
      </p>

      {/* Month Selector */}
      <div className="flex gap-2 mb-3">
        {[2, 3, 6, 12].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${months === m ? "bg-purple-600 text-white" : "bg-white text-purple-600 border border-purple-200"}`}
          >
            {m}mo
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-purple-600">Item Price</span>
          <span className="font-semibold text-purple-800">K{price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-600">Layby Fee (5%)</span>
          <span className="font-semibold text-purple-800">K{fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-600">Monthly Payment</span>
          <span className="font-bold text-purple-800">K{monthly.toLocaleString()}</span>
        </div>
        <div className="border-t border-purple-200 pt-1 flex justify-between">
          <span className="text-purple-600 font-medium">Total</span>
          <span className="font-extrabold text-purple-800">K{(total + fee).toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => alert("Chilimba application started! Complete your profile to proceed.")}
        className="w-full mt-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
      >
        Apply for Chilimba
      </button>
    </div>
  );
}
