"use client";

import React from "react";
import { Check, X, Copy, ExternalLink, ShoppingBag, Sparkles, Shirt } from "lucide-react";
import { AD_CONFIG } from "@/constant/ads";
import AdSlot from "./AdSlot";

interface ExportSuccessAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  onCopy?: () => void;
  onOpenCanvas?: () => void;
  isProUser?: boolean;
}

export default function ExportSuccessAdModal({
  isOpen,
  onClose,
  imageUrl,
  onCopy,
  onOpenCanvas,
  isProUser = false
}: ExportSuccessAdModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#070D18] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Top Success Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Cutout Downloaded!</h3>
            <p className="text-xs text-slate-400">HD transparent PNG saved to your device</p>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {onCopy && (
            <button
              onClick={onCopy}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Copy size={13} className="text-cyan-400" />
              <span>Copy Image</span>
            </button>
          )}
          {onOpenCanvas && (
            <button
              onClick={onOpenCanvas}
              className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ExternalLink size={13} />
              <span>Canvas Studio</span>
            </button>
          )}
        </div>

        {/* Placement 2: High-Intent Post-Download Sponsored / Affiliate Unit */}
        {!isProUser && (
          <div className="rounded-2xl border border-white/5 bg-[#091528]/80 p-3.5 mb-4">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-2">
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles size={11} />
                Monetize Your Cutout
              </span>
              <span>Sponsored</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Shirt size={22} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Print on Merch & T-Shirts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Sell stickers, custom apparel, and mugs with your cutout. Zero inventory required.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href={AD_CONFIG.AFFILIATES.PRINTFUL_MERCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all flex items-center gap-1 shadow"
                  >
                    <span>Print on Merch</span>
                    <ExternalLink size={11} />
                  </a>
                  <a
                    href={AD_CONFIG.AFFILIATES.SHOPIFY_TRIAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-medium transition-all"
                  >
                    Shopify $1/mo
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors active:scale-98"
        >
          Done
        </button>
      </div>
    </div>
  );
}
