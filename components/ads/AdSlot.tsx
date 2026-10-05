"use client";

import React, { useEffect, useRef } from "react";
import { AD_CONFIG } from "@/constant/ads";
import { Sparkles, ExternalLink } from "lucide-react";

interface AdSlotProps {
  slotId: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  isProUser?: boolean;
  label?: string;
}

export default function AdSlot({
  slotId,
  format = "auto",
  className = "",
  isProUser = false,
  label = "Sponsored"
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isDemo = AD_CONFIG.DEMO_MODE;

  // Never render ads for Pro users
  if (isProUser) return null;

  useEffect(() => {
    if (isDemo) return;

    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("[AdSlot] AdSense script pending or ad-blocker detected:", e);
    }
  }, [slotId, isDemo]);

  return (
    <div
      ref={adRef}
      className={`ad-container relative overflow-hidden rounded-2xl border border-white/5 bg-[#091528]/60 backdrop-blur-md text-center transition-all ${className}`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 text-[9px] uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles size={10} className="text-cyan-400/70" />
          {label}
        </span>
        <span className="hover:text-slate-400 cursor-pointer">Ad</span>
      </div>

      <div className="p-3 flex items-center justify-center min-h-[100px]">
        {isDemo ? (
          // Demo Mode / Preview Slot (Before Google AdSense Approval)
          <div className="w-full flex flex-col items-center justify-center p-3 text-center rounded-xl bg-gradient-to-br from-cyan-950/20 to-blue-950/20 border border-cyan-500/10 hover:border-cyan-500/30 transition-all group">
            <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1 mb-1">
              <span>Sell Products on Shopify</span>
              <ExternalLink size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
            <p className="text-[11px] text-slate-300 font-medium">
              Start your e-commerce store with high-converting AI cutouts for $1/month.
            </p>
            <a
              href={AD_CONFIG.AFFILIATES.SHOPIFY_TRIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold transition-all"
            >
              Claim $1 Trial Offer
            </a>
          </div>
        ) : (
          // Live Google AdSense Container
          <ins
            className="adsbygoogle block w-full"
            style={{ display: "block" }}
            data-ad-client={AD_CONFIG.CLIENT_ID}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        )}
      </div>
    </div>
  );
}
