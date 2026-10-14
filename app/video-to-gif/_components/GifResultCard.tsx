"use client";

import React from 'react';
import {
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useVideoToGif } from '../_hooks/useVideoToGif';

interface GifResultCardProps {
  engine: ReturnType<typeof useVideoToGif>;
  onReset: () => void;
}

export function GifResultCard({ engine, onReset }: GifResultCardProps) {
  const {
    gifUrl,
    gifSize,
    downloadGif,
    openInGifStudio,
    targetWidth,
    fps,
    selectedDuration,
    extractedFrames,
  } = engine;

  if (!gifUrl) return null;

  const sizeInMb = (gifSize / (1024 * 1024)).toFixed(2);
  const totalFrames = extractedFrames.length || Math.round(selectedDuration * fps);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-cyan-400/30 bg-[#09182b]/95 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Animated GIF Ready!
            </h3>
            <p className="text-[11px] text-white/50">
              High-quality multi-threaded export complete
            </p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
            <FileCheck size={13} className="text-cyan-400" />
            <span>{sizeInMb} MB</span>
          </span>
          <span className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-white/70">
            {targetWidth}px wide
          </span>
          <span className="hidden xs:inline-flex rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-white/70">
            {fps} FPS
          </span>
        </div>
      </div>

      {/* Looping Animated GIF Preview */}
      <div className="relative mx-auto flex w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-white/10 p-2 shadow-inner">
        <img
          src={gifUrl}
          alt="Converted Animated GIF Preview"
          className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
      </div>

      {/* Action Buttons Hub */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* Main Download Button */}
        <button
          onClick={() => downloadGif()}
          className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 py-3.5 px-6 font-black text-black shadow-xl shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-95"
          title="Download animated GIF to your device"
        >
          <Download size={18} />
          <span>Download GIF ({sizeInMb} MB)</span>
        </button>

        {/* Direct Handoff to GIF Studio */}
        <button
          onClick={openInGifStudio}
          className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 py-3.5 px-6 font-bold text-white shadow-lg transition-all hover:bg-white/15 active:scale-95 hover:border-cyan-400/40"
          title="Open in Polish AI GIF Studio to add text, stickers, or masks"
        >
          <Sparkles size={16} className="text-cyan-400" />
          <span>Open in GIF Studio</span>
          <ExternalLink size={14} className="text-white/40 ml-0.5" />
        </button>

        {/* Convert Another Video */}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95 shrink-0"
          title="Convert another video"
        >
          <RotateCcw size={14} />
          <span className="hidden xs:inline">Convert Another</span>
        </button>
      </div>
    </div>
  );
}
