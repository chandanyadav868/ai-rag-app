"use client";

import React, { useState, useEffect, useRef } from "react";
import { Zap, Crown, Play, X, ChevronDown, Sparkles, LogIn, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to usage changes
  useEffect(() => {
    const unsubscribe = subscribeToCredits((state) => {
      setCredits(state);
    });
    return unsubscribe;
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleWatchAd = async () => {
    if (isWatchingAd) return;
    setIsWatchingAd(true);

    setTimeout(async () => {
      const newRemaining = await addBonusCredits(5);
      setIsWatchingAd(false);
      toast.success(`🎉 +5 Bonus Credits added! You now have ${newRemaining} credits.`);
    }, 2000);
  };

  const totalCapacity = (credits.dailyLimit || 5) + (credits.bonusCredits || 0);
  const percentRemaining = Math.min(100, Math.max(0, Math.round((credits.remaining / (totalCapacity || 1)) * 100)));

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Sleek Header Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
          credits.isPro
            ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            : isOpen
            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/40 text-slate-200"
        }`}
      >
        {credits.isPro ? (
          <>
            <Crown size={13} className="text-amber-400 shrink-0" />
            <span className="font-bold">Pro Unlimited</span>
          </>
        ) : (
          <>
            <Zap size={13} className="text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-mono font-bold text-cyan-300">{credits.remaining}</span>
            <span className="hidden xs:inline text-slate-400 text-[11px] font-medium">Credits</span>
          </>
        )}
        <ChevronDown
          size={13}
          className={`text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-cyan-300" : ""
          }`}
        />
      </button>

      {/* Anchored Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Credits Menu"
          className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#090e17]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Daily AI Credits
                  {credits.isPro ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                      PRO
                    </span>
                  ) : credits.isLoggedIn ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                      MEMBER
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-slate-300">
                      GUEST
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {credits.isPro
                    ? "Unlimited AI Generations"
                    : `${credits.dailyLimit} free daily resets at 00:00 UTC`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close credits menu"
            >
              <X size={15} />
            </button>
          </div>

          {/* Credits Meter Card */}
          {!credits.isPro && (
            <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Available Balance</span>
                <span className="font-mono font-bold text-white flex items-center gap-1">
                  <span className="text-cyan-400 text-sm">{credits.remaining}</span>
                  <span className="text-slate-500 text-[11px]">/ {totalCapacity}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>

              {credits.bonusCredits > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <CheckCircle2 size={11} />
                  <span>Includes {credits.bonusCredits} extra bonus credits</span>
                </div>
              )}
            </div>
          )}

          {/* Action List */}
          <div className="mt-3 flex flex-col gap-2">
            {/* Action 1: Watch Sponsor Video */}
            <button
              type="button"
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent hover:from-cyan-500/20 hover:via-blue-500/20 border border-cyan-500/30 text-xs font-semibold text-white flex items-center justify-between transition-all active:scale-98 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {isWatchingAd ? (
                  <Loader2 size={14} className="text-cyan-400 animate-spin" />
                ) : (
                  <Play size={14} className="text-cyan-400 fill-cyan-400/30" />
                )}
                <span>{isWatchingAd ? "Loading Sponsor Clip..." : "Watch Sponsor Clip"}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                +5 Credits
              </span>
            </button>

            {/* Action 2: Sign In with Google (If guest) */}
            {!credits.isLoggedIn && (
              <Link
                href="/login/signin"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-between transition-all active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <LogIn size={14} className="text-emerald-400" />
                  <span>Sign In for 25/Day</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">Free Forever</span>
              </Link>
            )}

            {/* Action 3: Upgrade to Pro */}
            {!credits.isPro && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/25 flex flex-col gap-2 mt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown size={13} className="text-amber-400" />
                    PolishAI Pro
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-200">$4.99/mo</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-snug">
                  100% Ad-free, unlimited neural AI generations, and priority batch export.
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("Pro checkout link opening soon!")}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Upgrade to Pro</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
