import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function AirtimeTopUp() {
  const [network, setNetwork] = useState<"Airtel" | "MTN" | "Zamtel">("Airtel");
  const [productType, setProductType] = useState<"airtime" | "data">("airtime");
  const [phoneNumber, setPhoneNumber] = useState("+260");
  const [amount, setAmount] = useState(50);
  const purchase = trpc.airtime.purchase.useMutation({ onSuccess: () => toast.success("Purchase submitted"), onError: e => toast.error(e.message) });
  return <section className="rounded-2xl bg-white p-5 border border-peza-cream-dark space-y-4"><div><h2 className="font-bold text-lg">Airtime & data</h2><p className="text-sm text-peza-brown/60">Pay securely from your completed wallet balance.</p></div><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Network" className="border rounded-lg px-3 py-2" value={network} onChange={e => setNetwork(e.target.value as typeof network)}><option>Airtel</option><option>MTN</option><option>Zamtel</option></select><select aria-label="Product type" className="border rounded-lg px-3 py-2" value={productType} onChange={e => setProductType(e.target.value as typeof productType)}><option value="airtime">Airtime</option><option value="data">Data bundle</option></select><input aria-label="Phone number" className="border rounded-lg px-3 py-2" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /><input aria-label="Amount" className="border rounded-lg px-3 py-2" type="number" min={5} value={amount} onChange={e => setAmount(Number(e.target.value))} /></div><button className="w-full rounded-lg bg-peza-orange text-white py-2 font-semibold disabled:opacity-50" disabled={purchase.isPending} onClick={() => purchase.mutate({ network, productType, phoneNumber, amount })}>{purchase.isPending ? "Submitting..." : `Buy for K${amount}`}</button></section>;
}
