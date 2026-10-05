"use client";

import React, { useState, useEffect } from "react";
import { Zap, Crown, Sparkles, LogIn, Play, Check, X } from "lucide-react";
import { subscribeToCredits, addBonusCredits, UserCredits } from "@/lib/usageTracker";
import { toast } from "sonner";

export default function CreditBadge() {
  const [credits, setCredits] = useState<UserCredits>({
    isLoggedIn: false,
    isPro: false,
    dailyLimit: 5,
    usedToday: 0,
    remaining: 5,
    bonusCredits: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCredits((state) => {
      setCredits(state);
    });
    return unsubscribe;
  }, []);

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    // Simulate watching a 15-second sponsor video
    setTimeout(async () => {
      const newRemaining = await addBonusCredits(5);
      setIsWatchingAd(false);
      setIsModalOpen(false);
      toast.success("🎉 +5 Bonus Credits added to your account!");
    }, 2500);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
      >
        {credits.isPro ? (
          <>
            <Crown size={13} className="text-amber-400" />
            <span className="text-amber-300 font-bold">Pro Unlimited</span>
          </>
        ) : (
          <>
            <Zap size={13} className="text-cyan-400" />
            <span className="font-mono text-cyan-300">{credits.remaining}</span>
            <span className="hidden xs:inline text-slate-400 text-[11px]">Credits</span>
          </>
        )}
      </button>

      {/* Credit & Upgrade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm rounded-3xl bg-[#070D18] border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Daily AI Credits</h3>
                <p className="text-xs text-slate-400">
                  {credits.isLoggedIn ? "Registered User Quota" : "Free Guest Quota"}
                </p>
              </div>
            </div>

            {/* Quota Progress Meter */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Remaining Today</span>
                <span className="font-mono font-bold text-cyan-300">{credits.remaining} Credits</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (credits.remaining / (credits.dailyLimit + credits.bonusCredits || 1)) * 100)}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Resets daily at 00:00 UTC. Unused daily credits refill automatically.
              </p>
            </div>

            {/* Unlock More Options */}
            <div className="flex flex-col gap-2">
              {/* Option 1: Rewarded Ad (+5 Credits) */}
              <button
                onClick={handleWatchAd}
                disabled={isWatchingAd}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-between transition-all active:scale-98 disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-cyan-400" />
                  <span>{isWatchingAd ? "Simulating Sponsor Ad..." : "Watch Sponsor Clip"}</span>
                </div>
                <span className="bg-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-200">
                  +5 Credits
                </span>
              </button>

              {/* Option 2: Sign in with Google (Get 25 Credits/day) */}
              {!credits.isLoggedIn && (
                <button
                  onClick={() => {
                    toast.info("Google Sign-In ready to link with Appwrite Auth");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-between transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <LogIn size={14} className="text-emerald-400" />
                    <span>Sign In with Google</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400">25/day Free</span>
                </button>
              )}

              {/* Option 3: Pro Upgrade ($4.99/mo) */}
              {!credits.isPro && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Crown size={13} />
                      PolishAI Pro
                    </span>
                    <span className="text-xs font-mono text-white font-bold">$4.99/mo</span>
                  </div>
                  <p className="text-[10px] text-amber-200/70 leading-snug">
                    100% Ad-Free experience, unlimited 4K cutouts, and batch ZIP export.
                  </p>
                  <button
                    onClick={() => toast.info("Stripe / LemonSqueezy checkout ready")}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-98"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
