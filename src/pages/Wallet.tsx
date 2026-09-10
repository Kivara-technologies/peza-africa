import { useState } from "react";
import { useNavigate } from "react-router";
import { Wallet as WalletIcon, Plus, Send, Download, CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Wallet() {
  const navigate = useNavigate();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [provider, setProvider] = useState<"Airtel Money" | "MTN MoMo" | "Zamtel Kwacha">("Airtel Money");

  const { data: balanceData } = trpc.wallet.balance.useQuery();
  const { data: transactions } = trpc.wallet.transactions.useQuery();
  const utils = trpc.useUtils();

  const topUp = trpc.wallet.topUp.useMutation({
    onSuccess: () => {
      toast.success(`Approve the ${provider} prompt on your phone to complete the top-up.`);
      setShowTopUp(false);
      setTopUpAmount("");
      utils.wallet.balance.invalidate();
      utils.wallet.transactions.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't start top-up"),
  });

  const balance = Number(balanceData?.balance || 0);
  const fmtK = (p: number) => `K${p.toLocaleString()}`;

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-peza-orange font-bold">Payments</p>
          <h1 className="text-2xl font-extrabold text-peza-brown mt-1">My Wallet</h1>
        </div>
        <div className="rounded-full border border-peza-cream-dark bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-peza-green">
          Secure
        </div>
      </div>

      <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-peza-gold/10" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-peza-gold/5" />
        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Available Balance</p>
        <p className="text-4xl font-extrabold text-peza-gold mt-2">{fmtK(balance)}</p>
        <p className="text-xs text-white/50 mt-1">Zambian Kwacha (ZMW)</p>

        <div className="flex justify-around mt-6">
          {[
            { icon: Plus, label: "Top Up", action: () => setShowTopUp(true) },
            { icon: Send, label: "Send", action: () => navigate("/chat") },
            { icon: Download, label: "Receive", action: () => toast.info("Share your PEZA wallet details from the chat to receive funds.") },
            { icon: CreditCard, label: "Pay", action: () => navigate("/shop") },
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

      {showTopUp && (
        <div className="bg-white rounded-2xl border border-peza-cream-dark p-5 mt-4 animate-fade-in-up shadow-sm">
          <h3 className="text-base font-bold text-peza-brown mb-4">Top Up Wallet</h3>

          <div className="flex gap-2 mb-4">
            {(["Airtel Money", "MTN MoMo", "Zamtel Kwacha"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${provider === p ? "border-peza-orange text-peza-orange bg-orange-50" : "border-peza-cream-dark text-gray-600"}`}
              >
                {p}
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Amount (ZMW)"
            className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-lg font-bold text-peza-brown outline-none focus:border-peza-orange transition-colors mb-3"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
          />

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

      <h2 className="text-lg font-bold text-peza-brown mt-6 mb-3">Transaction History</h2>
      {transactions && transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-peza-cream-dark p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${Number(t.amount) > 0 ? "bg-green-50" : "bg-orange-50"}`}>
                {Number(t.amount) > 0 ? (
                  <ArrowDownLeft className={`w-5 h-5 ${Number(t.amount) > 0 ? "text-peza-green" : "text-peza-orange"}`} />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-peza-orange" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-peza-brown truncate">{t.description}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                  {t.status !== "completed" && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  )}
                </div>
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
