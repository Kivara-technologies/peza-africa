import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  History,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Route,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

const money = (v: string | number | null | undefined) =>
  `K${Number(v || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-5 text-center shadow-sm">
      <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-500" />
      <p className="font-extrabold text-peza-brown">We couldn't load this section</p>
      <p className="mt-1 text-xs text-gray-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-peza-orange">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

function MetricSkeleton() {
  return <div className="h-20 animate-pulse rounded-2xl bg-white/10" />;
}

function TripSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 h-16 animate-pulse rounded-xl bg-gray-100" />
      <div className="mt-3 h-10 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function RiderDashboard() {
  const { user, session, isLoading: authLoading, error: authError, refresh } = useAuth({ redirectOnUnauthenticated: true });
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [tab, setTab] = useState<"home" | "history">("home");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [serviceArea, setServiceArea] = useState("Lusaka");
  const [notes, setNotes] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const isRider = user?.role === "rider";

  useEffect(() => {
    if (!authLoading) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  const applicationQuery = trpc.rider.applicationStatus.useQuery(undefined, {
    enabled: !!session && !isRider,
    refetchInterval: 15000,
    retry: 2,
  });
  const apply = trpc.rider.apply.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await applicationQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Couldn't submit your rider application"),
  });
  const updateLocation = trpc.rider.updateLocation.useMutation({
    onError: (err) => toast.error(err.message || "Location update failed"),
  });
  const goOffline = trpc.rider.goOffline.useMutation();
  const earningsQuery = trpc.rider.earnings.useQuery(undefined, { enabled: isRider, refetchInterval: 15000, retry: 2 });
  const availableQuery = trpc.rider.availableOrders.useQuery(undefined, { enabled: isRider, refetchInterval: 8000, retry: 2 });
  const deliveriesQuery = trpc.rider.myDeliveries.useQuery(undefined, { enabled: isRider, refetchInterval: 8000, retry: 2 });
  const historyQuery = trpc.rider.history.useQuery(undefined, { enabled: isRider, retry: 2 });

  const claimOrder = trpc.rider.claimOrder.useMutation({
    onSuccess: async () => {
      toast.success("Delivery accepted — navigation is ready.");
      await Promise.all([availableQuery.refetch(), deliveriesQuery.refetch(), earningsQuery.refetch()]);
    },
    onError: (err) => toast.error(err.message || "Couldn't claim this delivery"),
  });
  const markDelivered = trpc.rider.markDelivered.useMutation({
    onSuccess: async () => {
      toast.success("Delivery completed successfully.");
      await Promise.all([deliveriesQuery.refetch(), historyQuery.refetch(), earningsQuery.refetch()]);
    },
    onError: (err) => toast.error(err.message || "Couldn't update this delivery"),
  });

  const stopSharing = () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharingLocation(false);
    goOffline.mutate(undefined, { onError: () => undefined });
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const toggleSharing = () => {
    if (sharingLocation) {
      stopSharing();
      toast.success("You're offline now.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Location isn't available on this device or browser.");
      toast.error("Location isn't available on this device or browser");
      return;
    }
    setLocationError(null);
    let firstFix = true;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(null);
        if (firstFix) {
          firstFix = false;
          setSharingLocation(true);
          toast.success("You're online — live location sharing is active.");
        }
        updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        stopSharing();
        const message = err.code === 1 ? "Location permission was denied. Allow location access to go online." : err.message || "Couldn't get your location.";
        setLocationError(message);
        toast.error(message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType.trim() || !serviceArea.trim()) {
      toast.error("Enter your vehicle type and service area");
      return;
    }
    apply.mutate({ vehicleType, vehicleRegistration: vehicleRegistration || undefined, serviceArea, notes: notes || undefined });
  };

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="bg-peza-brown px-4 pb-7 pt-5 text-white">
          <div className="mx-auto max-w-3xl">
            <div className="h-3 w-20 animate-pulse rounded bg-white/20" />
            <div className="mt-3 h-8 w-52 animate-pulse rounded bg-white/20" />
            <div className="mt-5 grid grid-cols-2 gap-3"><MetricSkeleton /><MetricSkeleton /></div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-5"><TripSkeleton /><TripSkeleton /></div>
      </div>
    );
  }

  if (authTimedOut || (session && !user && authError)) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50"><AlertCircle className="h-7 w-7 text-red-500" /></div>
          <h1 className="mt-4 text-xl font-extrabold text-peza-brown">Rider account could not load</h1>
          <p className="mt-2 text-sm text-gray-500">Your session took too long to load. Your account has not been changed.</p>
          <button onClick={() => { setAuthTimedOut(false); refresh(); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-peza-orange py-3 font-bold text-white">
            <RefreshCw className="h-4 w-4" /> Retry dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isRider) {
    if (applicationQuery.isLoading) {
      return <div className="mx-auto max-w-lg space-y-4 px-4 py-10"><TripSkeleton /><div className="h-12 animate-pulse rounded-xl bg-white" /></div>;
    }
    if (applicationQuery.error) return <div className="mx-auto max-w-md px-4 pt-12"><ErrorCard message={applicationQuery.error.message} onRetry={() => applicationQuery.refetch()} /></div>;
    const application = applicationQuery.data;
    if (application?.status === "pending") {
      return (
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50"><FileCheck2 className="h-8 w-8 text-amber-600" /></div>
            <h1 className="mt-4 text-2xl font-extrabold text-peza-brown">Application under review</h1>
            <p className="mt-2 text-sm text-gray-500">PEZA will review your rider application before you can accept deliveries.</p>
            <div className="mt-6 space-y-2 rounded-2xl bg-peza-cream p-4 text-left text-sm">
              <p><span className="text-gray-500">Vehicle:</span> <strong>{application.application?.vehicleType}</strong></p>
              <p><span className="text-gray-500">Service area:</span> <strong>{application.application?.serviceArea}</strong></p>
              {application.application?.vehicleRegistration && <p><span className="text-gray-500">Registration:</span> <strong>{application.application.vehicleRegistration}</strong></p>}
            </div>
            <button onClick={() => applicationQuery.refetch()} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-peza-orange"><RefreshCw className="h-4 w-4" /> Refresh status</button>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 text-center"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-peza-orange/10"><Bike className="h-10 w-10 text-peza-orange" /></div><h1 className="text-2xl font-extrabold text-peza-brown">Become a PEZA Rider</h1><p className="mt-2 text-sm text-gray-500">Deliver orders, earn per trip and build a flexible delivery business with PEZA.</p></div>
        <form onSubmit={submitApplication} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div><label className="text-xs font-bold text-peza-brown">Vehicle type</label><select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"><option value="">Select vehicle</option><option>Motorcycle</option><option>Bicycle</option><option>Car</option><option>Van</option><option>Truck</option></select></div>
          <div><label className="text-xs font-bold text-peza-brown">Vehicle registration <span className="font-normal text-gray-400">(optional)</span></label><input value={vehicleRegistration} onChange={(e) => setVehicleRegistration(e.target.value)} placeholder="e.g. ABC 1234" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm" /></div>
          <div><label className="text-xs font-bold text-peza-brown">Primary service area</label><input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="e.g. Lusaka" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm" /></div>
          <div><label className="text-xs font-bold text-peza-brown">Additional information <span className="font-normal text-gray-400">(optional)</span></label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Tell us about your availability or delivery experience" className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm" /></div>
          <button type="submit" disabled={apply.isPending} className="w-full rounded-xl bg-peza-orange py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{apply.isPending ? "Submitting application…" : "Submit rider application"}</button>
          <p className="text-center text-[11px] text-gray-400">Your rider role is activated only after PEZA approval.</p>
        </form>
      </div>
    );
  }

  const earnings = earningsQuery.data;
  const availableOrders = availableQuery.data || [];
  const myDeliveries = deliveriesQuery.data || [];
  const history = historyQuery.data || [];
  const activeTrip = myDeliveries[0];
  const completedToday = useMemo(() => history.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length, [history]);

  const openNavigation = (lat: string | number | null | undefined, lng: string | number | null | undefined) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      toast.error("This delivery does not have a map location yet.");
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-10">
      <header className="bg-peza-brown px-4 pb-7 pt-5 text-white shadow-sm">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/55">PEZA Rider</p><h1 className="mt-1 text-2xl font-black">Good to see you, {user?.name?.split(" ")[0] || "Rider"}</h1><p className="mt-1 text-xs text-white/60">Drive safely. We’ll keep your trips organized.</p></div>
            <button onClick={toggleSharing} disabled={goOffline.isPending} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black shadow-sm ${sharingLocation ? "bg-peza-green text-white" : "bg-white/10 text-white ring-1 ring-white/15"}`}><span className={`h-2.5 w-2.5 rounded-full ${sharingLocation ? "animate-pulse bg-white" : "bg-white/40"}`} />{sharingLocation ? "ONLINE" : "GO ONLINE"}</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {earningsQuery.isLoading ? <><MetricSkeleton /><MetricSkeleton /></> : earningsQuery.error ? <div className="col-span-2 rounded-2xl bg-red-500/10 p-3 text-xs text-white/80">Earnings unavailable. <button className="font-bold underline" onClick={() => earningsQuery.refetch()}>Retry</button></div> : <><div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/5"><div className="flex items-center gap-2 text-xs text-white/60"><Wallet className="h-4 w-4" /> Today’s earnings</div><p className="mt-1 text-2xl font-black">{money(earnings?.total)}</p></div><div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/5"><div className="flex items-center gap-2 text-xs text-white/60"><Route className="h-4 w-4" /> Completed trips</div><p className="mt-1 text-2xl font-black">{earnings?.trips || 0}</p></div></>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <div className="-mt-3 flex rounded-2xl border border-gray-100 bg-white p-1 shadow-md"><button onClick={() => setTab("home")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold ${tab === "home" ? "bg-peza-orange text-white" : "text-gray-500"}`}><Navigation className="h-4 w-4" /> Trips</button><button onClick={() => setTab("history")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold ${tab === "history" ? "bg-peza-orange text-white" : "text-gray-500"}`}><History className="h-4 w-4" /> Trip history</button></div>

        {tab === "history" ? (
          <section className="mt-5 space-y-3">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-peza-brown">Trip history</h2><p className="text-xs text-gray-500">Your completed deliveries</p></div><span className="rounded-full bg-peza-cream px-3 py-1 text-[11px] font-extrabold text-peza-brown">{completedToday} today</span></div>
            {historyQuery.isLoading ? <><TripSkeleton /><TripSkeleton /></> : historyQuery.error ? <ErrorCard message={historyQuery.error.message} onRetry={() => historyQuery.refetch()} /> : history.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-peza-green" /><h3 className="mt-3 font-extrabold text-peza-brown">No completed trips yet</h3><p className="mt-1 text-xs text-gray-500">Completed deliveries will appear here automatically.</p></div> : history.map((trip) => <div key={trip.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-peza-orange">{trip.orderNumber}</p><p className="mt-1 flex items-center gap-1 text-sm font-bold text-peza-brown"><MapPin className="h-3.5 w-3.5 text-gray-400" />{trip.deliveryAddress || "Delivery address"}</p></div><span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-extrabold text-green-700">DELIVERED</span></div><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center"><div><p className="text-[10px] text-gray-400">Trip</p><p className="mt-0.5 text-xs font-bold text-peza-brown">{money(trip.riderEarning)}</p></div><div><p className="text-[10px] text-gray-400">Order</p><p className="mt-0.5 text-xs font-bold text-peza-brown">{money(trip.total)}</p></div><div><p className="text-[10px] text-gray-400">Date</p><p className="mt-0.5 text-xs font-bold text-peza-brown">{new Date(trip.createdAt).toLocaleDateString("en-ZM", { day: "2-digit", month: "short" })}</p></div></div></div>)}
          </section>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${sharingLocation ? "bg-green-50" : "bg-peza-cream"}`}>{sharingLocation ? <Wifi className="h-5 w-5 text-peza-green" /> : <WifiOff className="h-5 w-5 text-peza-orange" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-peza-brown">{sharingLocation ? "You’re online" : "You’re offline"}</p><p className="mt-0.5 text-xs text-gray-500">{sharingLocation ? "Live location is active. New delivery offers refresh automatically." : "Go online when you’re ready to receive delivery opportunities."}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${sharingLocation ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{sharingLocation ? "LIVE" : "OFFLINE"}</span></div>
            {locationError && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{locationError}</span></div>}

            <section className="mt-6">
              <div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-black text-peza-brown">Active trip</h2><p className="text-xs text-gray-500">Your current delivery at a glance</p></div>{activeTrip && <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> LIVE</span>}</div>
              {deliveriesQuery.isLoading ? <TripSkeleton /> : deliveriesQuery.error ? <ErrorCard message={deliveriesQuery.error.message} onRetry={() => deliveriesQuery.refetch()} /> : activeTrip ? <div className="overflow-hidden rounded-3xl border border-peza-cream-dark bg-white shadow-sm"><div className="bg-peza-cream px-4 py-3"><div className="flex items-center justify-between"><p className="text-xs font-black text-peza-orange">ORDER {activeTrip.orderNumber}</p><p className="text-sm font-black text-peza-brown">{money(activeTrip.riderEarning || activeTrip.shipping)}</p></div></div><div className="p-4"><div className="relative pl-8"><div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" /><div className="relative"><span className="absolute -left-8 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-peza-orange ring-4 ring-orange-50"><Package className="h-2.5 w-2.5 text-white" /></span><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Delivery</p><p className="mt-1 text-sm font-extrabold text-peza-brown">{activeTrip.deliveryAddress || "Customer location"}</p></div><div className="relative mt-7"><span className="absolute -left-8 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-peza-green ring-4 ring-green-50"><MapPin className="h-2.5 w-2.5 text-white" /></span><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</p><p className="mt-1 text-sm font-extrabold text-peza-brown">On the way</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => openNavigation(activeTrip.deliveryLat, activeTrip.deliveryLng)} className="flex items-center justify-center gap-2 rounded-xl bg-peza-orange py-3 text-xs font-extrabold text-white"><Navigation className="h-4 w-4" /> Navigate</button><button disabled={markDelivered.isPending} onClick={() => markDelivered.mutate({ orderId: activeTrip.id })} className="flex items-center justify-center gap-2 rounded-xl bg-peza-green py-3 text-xs font-extrabold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{markDelivered.isPending ? "Updating…" : "Mark delivered"}</button></div></div></div> : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"><Navigation className="h-6 w-6 text-gray-400" /></div><h3 className="mt-3 font-extrabold text-peza-brown">No active trip</h3><p className="mt-1 text-xs text-gray-500">Accept an available delivery when one appears below.</p></div>}
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-black text-peza-brown">Delivery opportunities</h2><p className="text-xs text-gray-500">New orders refresh every few seconds</p></div><button onClick={() => availableQuery.refetch()} className="rounded-full border border-gray-200 p-2 text-gray-500"><RefreshCw className="h-4 w-4" /></button></div>
              {!sharingLocation && <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><Clock3 className="h-4 w-4 shrink-0" /> Go online to start receiving delivery work.</div>}
              {availableQuery.isLoading ? <><TripSkeleton /><TripSkeleton /></> : availableQuery.error ? <ErrorCard message={availableQuery.error.message} onRetry={() => availableQuery.refetch()} /> : availableOrders.length === 0 ? <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"><Package className="mx-auto h-8 w-8 text-gray-300" /><h3 className="mt-3 font-extrabold text-peza-brown">No delivery offers right now</h3><p className="mt-1 text-xs text-gray-500">Keep the app open while online. New orders will appear automatically.</p></div> : <div className="space-y-3">{availableOrders.map((order) => <article key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-peza-orange">{order.orderNumber}</p><p className="mt-1 flex items-start gap-1 text-sm font-bold text-peza-brown"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />{order.deliveryAddress || "Customer location"}</p></div><div className="text-right"><p className="text-sm font-black text-peza-green">{money(order.shipping)}</p><p className="text-[10px] text-gray-400">delivery</p></div></div><div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-3"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500"><ShieldCheck className="h-3.5 w-3.5 text-peza-green" /> Secure PEZA order</span><button disabled={!sharingLocation || claimOrder.isPending} onClick={() => claimOrder.mutate({ orderId: order.id })} className="inline-flex items-center gap-1.5 rounded-lg bg-peza-orange px-4 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">{claimOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}{claimOrder.isPending ? "Accepting…" : "Accept trip"}</button></div></article>)}</div>}
            </section>

            <section className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50"><TrendingUp className="h-5 w-5 text-peza-green" /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Total earned</p><p className="mt-1 text-lg font-black text-peza-brown">{earningsQuery.isLoading ? "…" : money(earnings?.total)}</p></div><div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50"><Bike className="h-5 w-5 text-peza-orange" /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Trips completed</p><p className="mt-1 text-lg font-black text-peza-brown">{earningsQuery.isLoading ? "…" : earnings?.trips || 0}</p></div></section>
          </>
        )}
      </main>
    </div>
  );
}
