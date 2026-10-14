"use client";

import React, { useState } from 'react';
import {
  Gauge,
  Maximize2,
  Zap,
  Type,
  Loader2,
  Sparkles,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { useVideoToGif } from '../_hooks/useVideoToGif';

interface ConversionSettingsProps {
  engine: ReturnType<typeof useVideoToGif>;
}

export function ConversionSettings({ engine }: ConversionSettingsProps) {
  const {
    fps,
    setFps,
    targetWidth,
    setTargetWidth,
    speed,
    setSpeed,
    captions,
    setCaptions,
    conversionStage,
    progress,
    statusMessage,
    convertToGif,
    cancelConversion,
    videoMeta,
    selectedDuration,
  } = engine;

  const [showCaptions, setShowCaptions] = useState(false);

  const isConverting = conversionStage === 'extracting' || conversionStage === 'encoding';
  const estimatedFrames = Math.max(1, Math.round((selectedDuration / speed) * fps));

  const fpsOptions = [
    { value: 5, label: '5 FPS', desc: 'Ultra-light file' },
    { value: 10, label: '10 FPS', desc: 'Recommended balance' },
    { value: 15, label: '15 FPS', desc: 'Smooth motion' },
    { value: 20, label: '20 FPS', desc: 'Very fluid' },
    { value: 24, label: '24 FPS', desc: 'Cinematic' },
  ];

  const resolutionPresets = [
    { width: 320, label: '320p', desc: 'Small size' },
    { width: 480, label: '480p', desc: 'Standard' },
    { width: 640, label: '640p', desc: 'High Quality' },
    { width: videoMeta?.width || 800, label: 'Original', desc: `${videoMeta?.width || 0}px wide` },
  ];

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1.0x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2.0x' },
  ];

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#09182b]/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">
          Conversion Settings
        </h3>
        <span className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
          ~{estimatedFrames} Output Frames
        </span>
      </div>

      {/* Frame Rate (FPS) Selector */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
          <Gauge size={14} className="text-cyan-400" />
          <span>Frame Rate (Smoothness)</span>
        </label>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
          {fpsOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFps(opt.value)}
              disabled={isConverting}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                fps === opt.value
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xs font-black">{opt.label}</span>
              <span className="text-[9px] text-white/40 mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Output Resolution Presets */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
          <Maximize2 size={14} className="text-cyan-400" />
          <span>GIF Dimensions & Resolution</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {resolutionPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setTargetWidth(preset.width)}
              disabled={isConverting}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                targetWidth === preset.width
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xs font-black">{preset.label}</span>
              <span className="text-[9px] text-white/40 mt-0.5">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Playback Speed Multiplier */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
          <Zap size={14} className="text-cyan-400" />
          <span>Playback Speed</span>
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSpeed(opt.value)}
              disabled={isConverting}
              className={`flex-1 min-w-[50px] py-1.5 rounded-xl border text-xs font-bold text-center transition active:scale-95 ${
                speed === opt.value
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Meme / Caption Overlay */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowCaptions(!showCaptions)}
          className="flex items-center justify-between text-xs font-bold text-white/70 hover:text-white transition"
        >
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Type size={14} />
            <span>Add Text / Meme Overlay (Optional)</span>
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showCaptions ? 'rotate-180' : ''}`}
          />
        </button>

        {showCaptions && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Top Caption:</label>
              <input
                type="text"
                placeholder="TOP TEXT..."
                value={captions.topText}
                onChange={(e) => setCaptions({ ...captions, topText: e.target.value })}
                className="w-full mt-1 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Bottom Caption:</label>
              <input
                type="text"
                placeholder="BOTTOM TEXT..."
                value={captions.bottomText}
                onChange={(e) => setCaptions({ ...captions, bottomText: e.target.value })}
                className="w-full mt-1 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Conversion Progress Bar & Status */}
      {isConverting && (
        <div className="flex flex-col gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3.5 shadow-lg animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span>{statusMessage}</span>
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={cancelConversion}
            className="self-end flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition"
          >
            <XCircle size={13} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Action CTA Button */}
      <button
        type="button"
        onClick={convertToGif}
        disabled={isConverting}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 py-3.5 px-6 font-black text-black shadow-xl shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? (
          <>
            <Loader2 size={18} className="animate-spin text-black" />
            <span>Converting Video to GIF...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Convert to Animated GIF</span>
          </>
        )}
      </button>
    </div>
  );
}
