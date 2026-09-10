import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bike, MapPin, Package, CheckCircle2, Loader2, Wallet, Navigation, History, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

const money = (v: string | number) => `K${Number(v || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RiderDashboard() {
  const { user, refresh } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const [sharingLocation, setSharingLocation] = useState(false);
  const [tab, setTab] = useState<"home" | "history">("home");
  const watchIdRef = useRef<number | null>(null);
  const isRider = user?.role === "rider";

  const becomeRider = trpc.rider.becomeRider.useMutation({
    onSuccess: async () => { toast.success("You're now a PEZA rider!"); await refresh(); },
    onError: (err) => toast.error(err.message || "Couldn't set up your rider account"),
  });
  const updateLocation = trpc.rider.updateLocation.useMutation();
  const goOffline = trpc.rider.goOffline.useMutation();
  const { data: earnings } = trpc.rider.earnings.useQuery(undefined, { enabled: isRider, refetchInterval: 15000 });
  const { data: availableOrders, isLoading: loadingAvailable } = trpc.rider.availableOrders.useQuery(undefined, { enabled: isRider, refetchInterval: 8000 });
  const { data: myDeliveries, isLoading: loadingMine } = trpc.rider.myDeliveries.useQuery(undefined, { enabled: isRider, refetchInterval: 8000 });
  const { data: history, isLoading: loadingHistory } = trpc.rider.history.useQuery(undefined, { enabled: isRider });

  const claimOrder = trpc.rider.claimOrder.useMutation({
    onSuccess: async () => { toast.success("Delivery claimed — navigation is ready."); await utils.rider.availableOrders.invalidate(); await utils.rider.myDeliveries.invalidate(); await utils.rider.earnings.invalidate(); },
    onError: (err) => toast.error(err.message || "Couldn't claim this delivery"),
  });
  const markDelivered = trpc.rider.markDelivered.useMutation({
    onSuccess: async () => { toast.success("Marked as delivered!"); await utils.rider.myDeliveries.invalidate(); await utils.rider.history.invalidate(); await utils.rider.earnings.invalidate(); },
    onError: (err) => toast.error(err.message || "Couldn't update this delivery"),
  });

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const toggleSharing = () => {
    if (sharingLocation) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null; setSharingLocation(false); goOffline.mutate(); return;
    }
    if (!navigator.geolocation) { toast.error("Location isn't available on this device/browser"); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => { toast.error(err.message || "Couldn't get your location"); setSharingLocation(false); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    setSharingLocation(true); toast.success("You're online — customers can track your live trip.");
  };

  if (!isRider) return (
    <div className="max-w-md mx-auto px-4 pt-10 text-center">
      <div className="w-20 h-20 rounded-full bg-peza-orange/10 flex items-center justify-center mx-auto mb-4"><Bike className="w-10 h-10 text-peza-orange" /></div>
      <h1 className="text-xl font-bold text-peza-brown mb-2">Deliver for PEZA</h1>
      <p className="text-sm text-gray-500 mb-6">Earn per delivery, manage your trips and share your live route with customers.</p>
      <button onClick={() => becomeRider.mutate()} disabled={becomeRider.isPending} className="w-full py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm disabled:opacity-50">{becomeRider.isPending ? "Setting up…" : "Become a Rider"}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-10">
      <div className="bg-peza-brown text-white px-4 pt-5 pb-6 rounded-b-[28px] shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-white/60 uppercase tracking-wider">PEZA Rider</p><h1 className="text-2xl font-extrabold">Good to see you, {user?.name?.split(" ")[0] || "Rider"}</h1></div>
            <button onClick={toggleSharing} className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 ${sharingLocation ? "bg-peza-green text-white" : "bg-white/10 text-white"}`}><span className={`w-2 h-2 rounded-full ${sharingLocation ? "bg-white animate-pulse" : "bg-white/40"}`} />{sharingLocation ? "ONLINE" : "GO ONLINE"}</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/10 rounded-2xl p-4"><div className="flex items-center gap-2 text-white/60 text-xs"><Wallet className="w-4 h-4" /> Earnings</div><p className="text-2xl font-extrabold mt-1">{money(earnings?.total || 0)}</p></div>
            <div className="bg-white/10 rounded-2xl p-4"><div className="flex items-center gap-2 text-white/60 text-xs"><Navigation className="w-4 h-4" /> Completed trips</div><p className="text-2xl font-extrabold mt-1">{earnings?.trips || 0}</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex">
          <button onClick={() => setTab("home")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === "home" ? "bg-peza-orange text-white" : "text-gray-500"}`}>Trips</button>
          <button onClick={() => setTab("history")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === "history" ? "bg-peza-orange text-white" : "text-gray-500"}`}>History</button>
        </div>

        {tab === "home" ? <>
          {!sharingLocation && <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm flex gap-3"><MapPin className="w-5 h-5 flex-shrink-0" /><div><p className="font-bold">Go online to receive live trips</p><p className="text-xs mt-1">PEZA only shares your current location while you are online.</p></div></div>}
          <section className="mt-5"><div className="flex items-center justify-between mb-2"><h2 className="font-extrabold text-peza-brown">Active trip</h2>{myDeliveries?.length ? <span className="text-xs font-bold text-peza-green">LIVE</span> : null}</div>
            {loadingMine ? <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-6" /> : myDeliveries?.length ? <div className="space-y-3">{myDeliveries.map((order) => <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-start justify-between"><div><p className="font-extrabold text-peza-brown">{order.orderNumber}</p><p className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</p><p className="text-xs text-gray-500">{order.deliveryPhone}</p></div><span className="font-extrabold text-peza-orange">{money(order.riderEarning)}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => order.deliveryLat && order.deliveryLng && window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`, "_blank")} className="py-2.5 rounded-xl border border-gray-200 text-sm font-bold flex items-center justify-center gap-2"><Navigation className="w-4 h-4" /> Navigate</button><button onClick={() => markDelivered.mutate({ orderId: order.id })} disabled={markDelivered.isPending} className="py-2.5 rounded-xl bg-peza-green text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Delivered</button></div></div>)}</div> : <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-7 text-center"><Package className="w-8 h-8 mx-auto text-gray-300 mb-2" /><p className="font-bold text-peza-brown">No active trip</p><p className="text-xs text-gray-400 mt-1">Claim a delivery below when one is available.</p></div>}
          </section>
          <section className="mt-6"><h2 className="font-extrabold text-peza-brown mb-2">Nearby opportunities</h2>{loadingAvailable ? <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-6" /> : availableOrders?.length ? <div className="space-y-2">{availableOrders.map((order) => <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-peza-cream flex items-center justify-center"><Package className="w-5 h-5 text-peza-brown" /></div><div className="flex-1 min-w-0"><p className="font-bold text-sm text-peza-brown">{order.orderNumber}</p><p className="text-xs text-gray-500 truncate">{order.deliveryAddress}</p><p className="text-xs text-gray-400 mt-0.5">Shipping {money(order.shipping)}</p></div><button onClick={() => claimOrder.mutate({ orderId: order.id })} disabled={claimOrder.isPending} className="bg-peza-orange text-white px-3.5 py-2 rounded-xl text-xs font-extrabold disabled:opacity-50">Claim</button></div>)}</div> : <p className="text-sm text-gray-400 bg-white rounded-2xl p-6 text-center">No nearby deliveries right now.</p>}</section>
        </> : <section className="mt-5"><div className="flex items-center gap-2 mb-3"><History className="w-5 h-5 text-peza-orange" /><h2 className="font-extrabold text-peza-brown">Trip history</h2></div>{loadingHistory ? <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-6" /> : history?.length ? <div className="space-y-2">{history.map((order) => <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-peza-green" /></div><div className="flex-1"><p className="font-bold text-sm text-peza-brown">{order.orderNumber}</p><p className="text-xs text-gray-500">{order.deliveryAddress}</p><p className="text-[11px] text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString("en-ZM")}</p></div><div className="text-right"><p className="font-extrabold text-peza-orange">{money(order.riderEarning)}</p><ChevronRight className="w-4 h-4 text-gray-300 ml-auto" /></div></div>)}</div> : <p className="text-sm text-gray-400 bg-white rounded-2xl p-6 text-center">Completed trips will appear here.</p>}</section>}
      </div>
    </div>
  );
}
