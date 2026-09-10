import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bike, MapPin, Package, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

export default function RiderDashboard() {
  const { user, refresh } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const [sharingLocation, setSharingLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const isRider = user?.role === "rider";

  const becomeRider = trpc.rider.becomeRider.useMutation({
    onSuccess: async () => {
      toast.success("You're now a PEZA rider!");
      await refresh();
    },
    onError: (err) => toast.error(err.message || "Couldn't set up your rider account"),
  });

  const updateLocation = trpc.rider.updateLocation.useMutation();
  const goOffline = trpc.rider.goOffline.useMutation();

  const { data: availableOrders, isLoading: loadingAvailable } = trpc.rider.availableOrders.useQuery(undefined, {
    enabled: isRider,
    refetchInterval: 8000,
  });
  const { data: myDeliveries, isLoading: loadingMine } = trpc.rider.myDeliveries.useQuery(undefined, {
    enabled: isRider,
    refetchInterval: 8000,
  });

  const claimOrder = trpc.rider.claimOrder.useMutation({
    onSuccess: async () => {
      toast.success("Delivery claimed — head over when you're ready.");
      await utils.rider.availableOrders.invalidate();
      await utils.rider.myDeliveries.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't claim this delivery"),
  });

  const markDelivered = trpc.rider.markDelivered.useMutation({
    onSuccess: async () => {
      toast.success("Marked as delivered!");
      await utils.rider.myDeliveries.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't update this delivery"),
  });

  // Stop the browser's geolocation watch on unmount so it doesn't keep
  // running (and draining battery) after the rider navigates away.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const toggleSharing = () => {
    if (sharingLocation) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setSharingLocation(false);
      goOffline.mutate();
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device/browser");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        toast.error(err.message || "Couldn't get your location");
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    setSharingLocation(true);
    toast.success("Sharing your location — customers can now track you live");
  };

  const fmtK = (v: string | number) => `K${Number(v).toLocaleString()}`;

  if (!isRider) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 text-center">
        <div className="w-20 h-20 rounded-full bg-peza-orange/10 flex items-center justify-center mx-auto mb-4">
          <Bike className="w-10 h-10 text-peza-orange" />
        </div>
        <h1 className="text-xl font-bold text-peza-brown mb-2">Deliver for PEZA</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pick up deliveries near you, share your live location with customers, and get paid per drop.
        </p>
        <button
          onClick={() => becomeRider.mutate()}
          disabled={becomeRider.isPending}
          className="w-full py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors disabled:opacity-50"
        >
          {becomeRider.isPending ? "Setting up…" : "Become a Rider"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-peza-brown">Rider Dashboard</h1>
        <button
          onClick={toggleSharing}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            sharingLocation ? "bg-peza-green text-white" : "bg-peza-cream-dark text-peza-brown"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${sharingLocation ? "bg-white animate-pulse" : "bg-gray-400"}`} />
          {sharingLocation ? "Online" : "Offline"}
        </button>
      </div>

      {!sharingLocation && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Go online to share your location — customers can't track a delivery you're carrying until you do.
        </div>
      )}

      {/* My active deliveries */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-peza-brown mb-2">My Deliveries</h2>
        {loadingMine ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-4" />
        ) : myDeliveries && myDeliveries.length > 0 ? (
          <div className="space-y-3">
            {myDeliveries.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-peza-cream-dark p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-peza-brown">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                    <p className="text-xs text-gray-500">{order.deliveryPhone}</p>
                  </div>
                  <span className="text-sm font-bold text-peza-orange">{fmtK(order.total)}</span>
                </div>
                <button
                  onClick={() => markDelivered.mutate({ orderId: order.id })}
                  disabled={markDelivered.isPending}
                  className="w-full py-2 rounded-lg bg-peza-green text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Delivered
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No active deliveries.</p>
        )}
      </section>

      {/* Available orders to claim */}
      <section>
        <h2 className="text-sm font-bold text-peza-brown mb-2">Available Nearby</h2>
        {loadingAvailable ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-4" />
        ) : availableOrders && availableOrders.length > 0 ? (
          <div className="space-y-3">
            {availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-peza-cream-dark p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-peza-cream flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-peza-brown-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-peza-brown">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{order.deliveryAddress}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-peza-orange mb-1">{fmtK(order.total)}</p>
                  <button
                    onClick={() => claimOrder.mutate({ orderId: order.id })}
                    disabled={claimOrder.isPending}
                    className="text-xs font-bold bg-peza-orange text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No deliveries available right now — check back soon.</p>
        )}
      </section>
    </div>
  );
}
