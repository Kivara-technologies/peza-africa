import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { ChevronLeft, Phone, Package, CheckCircle2, Truck, Clock } from "lucide-react";
import DeliveryMap from "@/components/DeliveryMap";

const STEPS: { key: string; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

// Collapses the order's real status values down to a position on the
// 4-step tracker shown to the customer — "paid"/"processing" both just mean
// "confirmed, not picked up yet" from a tracking-screen point of view.
function stepIndexForStatus(status: string): number {
  switch (status) {
    case "pending":
      return 0;
    case "paid":
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

export default function Track() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const id = Number(orderId);

  const { data: tracking, isLoading, error } = trpc.order.track.useQuery(
    { orderId: id },
    {
      enabled: Number.isFinite(id),
      // A few seconds of latency is an acceptable trade here — see the
      // comment on order.track in the server router for why this is plain
      // polling rather than a live subscription. Stops once the order has
      // reached a terminal status (or errored) — polling a delivered or
      // cancelled order forever was pure waste.
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "delivered" || status === "cancelled") return false;
        return 6000;
      },
      retry: false,
    },
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 text-center text-gray-500 text-sm">Loading tracking info…</div>
    );
  }

  if (!tracking) {
    const isAuthError = (error as any)?.data?.code === "UNAUTHORIZED" || (error as any)?.data?.code === "FORBIDDEN";
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8 text-center">
        <p className="text-gray-500 text-sm">
          {isAuthError ? "Sign in to view this order's tracking." : "Couldn't load this order."}
        </p>
        <button
          onClick={() => navigate(isAuthError ? `/login?redirect=${encodeURIComponent(`/track/${orderId}`)}` : "/orders")}
          className="text-peza-orange text-sm font-semibold mt-2"
        >
          {isAuthError ? "Sign in" : "Back to Orders"}
        </button>
      </div>
    );
  }

  const currentStep = stepIndexForStatus(tracking.status);
  const riderPosition =
    tracking.location && tracking.location.isOnline
      ? { lat: Number(tracking.location.lat), lng: Number(tracking.location.lng) }
      : null;
  const destination =
    tracking.deliveryLat && tracking.deliveryLng
      ? { lat: Number(tracking.deliveryLat), lng: Number(tracking.deliveryLng) }
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-peza-cream-dark flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-peza-brown" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-peza-brown">Order {tracking.orderNumber}</h1>
          <p className="text-xs text-gray-500">{tracking.deliveryAddress}</p>
        </div>
      </div>

      {/* Status stepper */}
      <div className="bg-white rounded-2xl border border-peza-cream-dark p-5 mb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <div
                  className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-10 ${
                    i <= currentStep ? "bg-peza-orange" : "bg-peza-cream-dark"
                  }`}
                />
              )}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  i <= currentStep ? "bg-peza-orange text-white" : "bg-peza-cream-dark text-gray-400"
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : i === currentStep ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${i <= currentStep ? "text-peza-brown" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-peza-cream-dark overflow-hidden mb-4 h-[320px]">
        {destination || riderPosition ? (
          <DeliveryMap destination={destination} riderPosition={riderPosition} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <Package className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {tracking.rider ? "Waiting for the rider's location…" : "A rider hasn't been assigned yet."}
            </p>
          </div>
        )}
      </div>

      {/* Rider card */}
      {tracking.rider && (
        <div className="bg-white rounded-2xl border border-peza-cream-dark p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-peza-orange/10 text-peza-orange flex items-center justify-center font-bold">
            {tracking.rider.name?.[0] || "R"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-peza-brown truncate">{tracking.rider.name || "Your rider"}</p>
            <p className="text-xs text-gray-500">
              {riderPosition ? "Location updating live" : "Location not shared yet"}
            </p>
          </div>
          {tracking.rider.phone && (
            <a
              href={`tel:${tracking.rider.phone}`}
              className="w-10 h-10 rounded-full bg-peza-green text-white flex items-center justify-center flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
