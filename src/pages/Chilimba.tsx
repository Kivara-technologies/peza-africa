import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Users, Plus, LogIn, CheckCircle2, Clock } from "lucide-react";

type Tab = "mine" | "discover" | "create";

export default function Chilimba() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("mine");
  const [form, setForm] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    frequencyDays: "7",
    maxMembers: "5",
  });

  const utils = trpc.useUtils();
  const { data: myCircles } = trpc.chilimba.myCircles.useQuery(undefined, { enabled: isAuthenticated });
  const { data: discoverCircles } = trpc.chilimba.discover.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.chilimba.create.useMutation({
    onSuccess: () => {
      toast.success("Circle created — waiting for members to join");
      utils.chilimba.myCircles.invalidate();
      setForm({ name: "", description: "", contributionAmount: "", frequencyDays: "7", maxMembers: "5" });
      setTab("mine");
    },
    onError: (err) => toast.error(err.message || "Couldn't create circle"),
  });

  const joinMutation = trpc.chilimba.join.useMutation({
    onSuccess: () => {
      toast.success("Joined the circle!");
      utils.chilimba.discover.invalidate();
      utils.chilimba.myCircles.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't join circle"),
  });

  const contributeMutation = trpc.chilimba.contribute.useMutation({
    onSuccess: (res) => {
      if (res.roundComplete) {
        toast.success(`Round complete! K${res.payoutAmount?.toLocaleString()} paid out.`);
      } else {
        toast.success("Contribution recorded — waiting on other members");
      }
      utils.chilimba.myCircles.invalidate();
      utils.wallet.balance.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't contribute"),
  });

  const fmtK = (n: number | string) => `K${Number(n).toLocaleString()}`;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LogIn className="w-10 h-10 text-peza-orange mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-peza-brown mb-2">Sign in for Chilimba</h1>
        <p className="text-sm text-gray-500 mb-5">Join or start a savings circle with people you trust.</p>
        <button onClick={() => navigate("/login")} className="bg-peza-orange text-white font-bold px-6 py-3 rounded-xl">
          Log In
        </button>
      </div>
    );
  }

  function submitCreate() {
    if (!form.name.trim() || !form.contributionAmount || !form.maxMembers) {
      toast.error("Name, contribution amount, and member count are required");
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      contributionAmount: Number(form.contributionAmount),
      frequencyDays: Number(form.frequencyDays) || 7,
      maxMembers: Number(form.maxMembers),
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      <h1 className="text-2xl font-extrabold text-peza-brown mb-1">Chilimba</h1>
      <p className="text-sm text-gray-500 mb-4">Rotating savings circles — save together, take turns.</p>

      <div className="flex gap-2 mb-5">
        {(["mine", "discover", "create"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize border-2 ${
              tab === t ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"
            }`}
          >
            {t === "mine" ? "My Circles" : t}
          </button>
        ))}
      </div>

      {tab === "mine" && (
        <div className="space-y-3">
          {myCircles && myCircles.length > 0 ? (
            myCircles.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-peza-cream-dark p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-peza-brown">{c.name}</p>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                      c.status === "active"
                        ? "bg-green-50 text-green-700"
                        : c.status === "completed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {fmtK(c.contributionAmount)} per member · {c.memberCount}/{c.maxMembers} members · your position: #{c.myPayoutPosition}
                </p>
                {c.status === "active" && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Round {c.currentRound}
                    </span>
                    {c.hasContributedThisRound ? (
                      <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Contributed
                      </span>
                    ) : (
                      <button
                        onClick={() => contributeMutation.mutate({ circleId: c.id })}
                        disabled={contributeMutation.isPending}
                        className="bg-peza-orange text-white text-xs font-bold px-4 py-1.5 rounded-lg disabled:opacity-60"
                      >
                        Contribute {fmtK(c.contributionAmount)}
                      </button>
                    )}
                  </div>
                )}
                {c.status === "recruiting" && (
                  <p className="text-xs text-gray-400 mt-1">Waiting for {c.maxMembers - c.memberCount} more member(s) to join.</p>
                )}
                {c.myHasBeenPaid && (
                  <p className="text-xs text-green-700 font-semibold mt-1">✓ You've already received your payout in this circle.</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">You're not in any circles yet — discover one or create your own.</p>
            </div>
          )}
        </div>
      )}

      {tab === "discover" && (
        <div className="space-y-3">
          {discoverCircles && discoverCircles.length > 0 ? (
            discoverCircles.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-peza-cream-dark p-4">
                <p className="font-bold text-peza-brown mb-1">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500 mb-2">{c.description}</p>}
                <p className="text-xs text-gray-500 mb-3">
                  {fmtK(c.contributionAmount)} every {c.frequencyDays} days · {c.memberCount}/{c.maxMembers} members
                </p>
                <button
                  onClick={() => joinMutation.mutate({ circleId: c.id })}
                  disabled={joinMutation.isPending || c.memberCount >= c.maxMembers}
                  className="w-full bg-peza-orange text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50"
                >
                  {c.memberCount >= c.maxMembers ? "Full" : "Join Circle"}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No open circles right now — start your own.</p>
            </div>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="bg-white rounded-xl border border-peza-cream-dark p-4 space-y-3">
          <input
            placeholder="Circle name (e.g. Family Savings Circle)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Amount (K)"
              type="number"
              value={form.contributionAmount}
              onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.frequencyDays}
              onChange={(e) => setForm({ ...form, frequencyDays: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            >
              <option value="7">Weekly</option>
              <option value="30">Monthly</option>
            </select>
            <input
              placeholder="Members"
              type="number"
              min={2}
              max={50}
              value={form.maxMembers}
              onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">
            You'll take payout position #1. Each round, once every member has contributed, the full pot pays out to the next
            position automatically.
          </p>
          <button
            onClick={submitCreate}
            disabled={createMutation.isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-peza-orange text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Create Circle
          </button>
        </div>
      )}
    </div>
  );
}
