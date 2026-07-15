import { useState } from "react";
import { Wallet as WalletIcon, Plus, Send, Download, CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Wallet() {
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [provider, setProvider] = useState<"M-Pesa" | "Airtel" | "MTN">("M-Pesa");

  const { data: balanceData } = trpc.wallet.balance.useQuery();
  const { data: transactions } = trpc.wallet.transactions.useQuery();
  const utils = trpc.useUtils();

  const topUp = trpc.wallet.topUp.useMutation({
    onSuccess: () => {
      toast.success(`K${Number(topUpAmount).toLocaleString()} added via ${provider}!`);
      setShowTopUp(false);
      setTopUpAmount("");
      utils.wallet.balance.invalidate();
      utils.wallet.transactions.invalidate();
    },
  });

  const balance = Number(balanceData?.balance || 0);
  const fmtK = (p: number) => `K${p.toLocaleString()}`;

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold text-peza-brown mb-4">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-peza-gold/10" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-peza-gold/5" />
        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Available Balance</p>
        <p className="text-4xl font-extrabold text-peza-gold mt-2">{fmtK(balance)}</p>
        <p className="text-xs text-white/50 mt-1">Zambian Kwacha (ZMW)</p>

        {/* Actions */}
        <div className="flex justify-around mt-6">
          {[
            { icon: Plus, label: "Top Up", action: () => setShowTopUp(true) },
            { icon: Send, label: "Send", action: () => toast("Coming soon") },
            { icon: Download, label: "Receive", action: () => toast("Coming soon") },
            { icon: CreditCard, label: "Pay", action: () => toast("Coming soon") },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-white/70">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Up Form */}
      {showTopUp && (
        <div className="bg-white rounded-xl border border-peza-cream-dark p-5 mt-4 animate-fade-in-up">
          <h3 className="text-base font-bold text-peza-brown mb-4">Top Up Wallet</h3>

          {/* Provider Selection */}
          <div className="flex gap-2 mb-4">
            {(["M-Pesa", "Airtel", "MTN"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${provider === p ? "border-peza-orange text-peza-orange bg-orange-50" : "border-peza-cream-dark text-gray-600"}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <input
            type="number"
            placeholder="Amount (ZMW)"
            className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-lg font-bold text-peza-brown outline-none focus:border-peza-orange transition-colors mb-3"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
          />

          {/* Quick Amounts */}
          <div className="flex gap-2 mb-4">
            {quickAmounts.map((a) => (
              <button
                key={a}
                onClick={() => setTopUpAmount(String(a))}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${topUpAmount === String(a) ? "bg-peza-orange text-white" : "bg-peza-cream text-peza-brown"}`}
              >
                K{a}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const amt = parseInt(topUpAmount);
                if (!amt || amt < 100) { toast.error("Minimum top-up is K100"); return; }
                topUp.mutate({ amount: amt, provider });
              }}
              className="flex-1 py-3 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors"
            >
              Confirm Top Up
            </button>
            <button
              onClick={() => { setShowTopUp(false); setTopUpAmount(""); }}
              className="flex-1 py-3 border-2 border-peza-orange text-peza-orange rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <h2 className="text-lg font-bold text-peza-brown mt-6 mb-3">Transaction History</h2>
      {transactions && transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-peza-cream-dark p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${Number(t.amount) > 0 ? "bg-green-50" : "bg-orange-50"}`}>
                {Number(t.amount) > 0 ? (
                  <ArrowDownLeft className={`w-5 h-5 ${Number(t.amount) > 0 ? "text-peza-green" : "text-peza-orange"}`} />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-peza-orange" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-peza-brown truncate">{t.description}</p>
                <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-bold ${Number(t.amount) > 0 ? "text-peza-green" : "text-peza-red"}`}>
                {Number(t.amount) > 0 ? "+" : ""}{fmtK(Math.abs(Number(t.amount)))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <WalletIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No transactions yet</p>
        </div>
      )}
    </div>
  );
}
