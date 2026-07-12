"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sparkles, Gift, Crown, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface TopperRewardBannerProps {
  rank: number;
  subscriptionType: "free" | "premium";
  hasClaimed: boolean;
}

export default function TopperRewardBanner({ rank, subscriptionType, hasClaimed }: TopperRewardBannerProps) {
  const claim = useMutation(api.users.claimTopperReward);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(hasClaimed);

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claim();
      setClaimed(true);
      Swal.fire({
        icon: "success",
        title: "Reward Claimed!",
        text: "Your Season Pass has been successfully extended by an additional 30 days for free! Keep study drills up.",
        confirmButtonColor: "#0284c7",
      }).then(() => {
        window.location.reload();
      });
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Claim Failed",
        text: e.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const rankMedal = ["🥇", "🥈", "🥉"][rank - 1] || "🏆";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15 border-2 border-amber-400/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="flex items-center gap-4 text-left">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 shrink-0">
          <Crown className="w-8 h-8 fill-current text-white animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Weekly Topper Reward {rankMedal}</span>
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded">Rank #{rank}</span>
          </h4>
          <p className="text-xs text-gray-600 dark:text-slate-300 font-semibold mt-1">
            {subscriptionType === "free" ? (
              <>
                You placed in the top 3 weekly scorers! Use exclusive coupon code <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">TOPPER50</span> at checkout to get 50% off your Elite Season Pass!
              </>
            ) : claimed ? (
              "Your 30-day Season Pass extension has been successfully credited to your account! Excellent prep consistency."
            ) : (
              "You placed in the top 3 weekly scorers! Claim your reward of an additional 30 days of free Elite Season Pass access."
            )}
          </p>
        </div>
      </div>

      {subscriptionType === "premium" && !claimed && (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/10 shrink-0 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Gift className="w-4 h-4" />
          )}
          Claim 30 Days
        </button>
      )}
    </div>
  );
}
