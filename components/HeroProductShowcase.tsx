"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Wand2, 
  Clapperboard, 
  Scissors, 
  SplitSquareVertical, 
  ArrowRight, 
  Check, 
  Play, 
  Pause,
  Layers,
  Palette,
  Eye,
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';

type TabKey = 'bg-removal' | 'eraser' | 'gif-maker';

export default function HeroProductShowcase() {
  const [activeTab, setActiveTab] = useState<TabKey>('bg-removal');

  // Split Slider State for Tab 1 (Background Removal)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeBackdrop, setActiveBackdrop] = useState<'transparent' | 'gradient' | 'obsidian'>('transparent');
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  // Animation State for Tab 4 (GIF Timeline)
  const [isPlayingGif, setIsPlayingGif] = useState<boolean>(true);
  const [activeFrame, setActiveFrame] = useState<number>(0);

  // Slider Mouse Move with RAF throttling
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setSliderPos(Math.round((x / rect.width) * 100));
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSliderMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleSliderMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleSliderMove(e.touches[0].clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleSliderMove]);

  // Frame animation loop for GIF tab
  useEffect(() => {
    if (!isPlayingGif || activeTab !== 'gif-maker') return;
    const interval = setInterval(() => {
      setActiveFrame(prev => (prev + 1) % 4);
    }, 450);
    return () => clearInterval(interval);
  }, [isPlayingGif, activeTab]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Product Selector Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-[#091528]/90 border border-white/10 backdrop-blur-xl shadow-2xl mb-4 sm:mb-6 max-w-3xl w-full px-2">
        <button
          onClick={() => setActiveTab('bg-removal')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'bg-removal'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Scissors size={14} className="shrink-0" />
          <span><span className="hidden xs:inline">AI </span>Background Cutout</span>
        </button>

        <button
          onClick={() => setActiveTab('eraser')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'eraser'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wand2 size={14} className="shrink-0" />
          <span>Canvas Studio<span className="hidden xs:inline"> & Eraser</span></span>
        </button>

        <button
          onClick={() => setActiveTab('gif-maker')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'gif-maker'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clapperboard size={14} className="shrink-0" />
          <span>GIF Animator<span className="hidden xs:inline"> Timeline</span></span>
        </button>
      </div>

      {/* Main Interactive Stage Container */}
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#070D18]/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Top Control Bar of Interactive Stage */}
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 bg-[#091528]/60 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 border-l border-white/10 pl-2.5 sm:pl-3 truncate">
              {activeTab === 'bg-removal' && 'RMBG-1.4 Neural Matting Studio'}
              {activeTab === 'eraser' && 'AI Inpainting & Object Removal'}
              {activeTab === 'gif-maker' && 'Frame Timeline & Motion Sequencer'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeTab === 'bg-removal' && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 rounded-xl p-0.5 sm:p-1 border border-white/5">
                <button
                  onClick={() => setActiveBackdrop('transparent')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                    activeBackdrop === 'transparent' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alpha
                </button>
                <button
                  onClick={() => setActiveBackdrop('gradient')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                    activeBackdrop === 'gradient' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gradient
                </button>
                <button
                  onClick={() => setActiveBackdrop('obsidian')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                    activeBackdrop === 'obsidian' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark
                </button>
              </div>
            )}

            <Link
              href={
                activeTab === 'bg-removal'
                  ? '/image-bg-removal'
                  : activeTab === 'eraser'
                  ? '/image-home-screen'
                  : '/gif-home-screen'
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500 text-white hover:text-slate-900 text-[11px] sm:text-xs font-bold transition-all shadow shrink-0 whitespace-nowrap active:scale-95"
            >
              <span>Launch</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Viewport Content Area */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full max-h-[540px] overflow-hidden flex items-center justify-center select-none bg-black">
          
          {/* TAB 1: AI Background Removal Interactive Split Slider */}
          {activeTab === 'bg-removal' && (
            <div
              ref={sliderContainerRef}
              onMouseDown={handleMouseDown}
              className="relative w-full h-full flex items-center justify-center cursor-ew-resize overflow-hidden"
              style={{
                background:
                  activeBackdrop === 'transparent'
                    ? 'repeating-conic-gradient(#151f30 0% 25%, #0b1220 0% 50%) 50% / 20px 20px'
                    : activeBackdrop === 'gradient'
                    ? 'linear-gradient(135deg, #1e1b4b 0%, #065f46 100%)'
                    : '#060D1A'
              }}
            >
              {/* Sizing Placeholder (Dog with flower) */}
              <img
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="max-w-full max-h-full object-contain opacity-0 pointer-events-none"
              />

              {/* Left Side: Original Image */}
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  willChange: 'clip-path',
                  transform: 'translateZ(0)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80"
                  alt="Original Photo"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>

              {/* Right Side: Cutout Image (Real AI transparent pet cutout over backdrop) */}
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{
                  clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                  willChange: 'clip-path',
                  transform: 'translateZ(0)'
                }}
              >
                <img
                  src="/images/golden-retriever-cutout.webp"
                  alt="AI Transparent Cutout"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%`, willChange: 'left', transform: 'translateZ(0)' }}
              >
                <div className="w-7 h-7 -ml-3 sm:w-8 sm:h-8 sm:-ml-3.5 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-slate-900/30">
                  <SplitSquareVertical size={15} />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold bg-black/75 backdrop-blur-md text-slate-200 border border-white/10 pointer-events-none flex items-center gap-1 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Original</span>
              </div>
              <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold bg-cyan-500/90 backdrop-blur-md text-slate-950 border border-cyan-300 pointer-events-none shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                <span>Cutout</span>
              </div>

              {/* Helper Drag Prompt */}
              <div className="hidden xs:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-black/75 backdrop-blur-md text-slate-300 border border-white/10 pointer-events-none items-center gap-1.5 whitespace-nowrap shadow-lg">
                <Sliders size={12} className="text-cyan-400" />
                <span>Slide to compare</span>
              </div>
            </div>
          )}

          {/* TAB 2: Canvas Studio & Object Eraser */}
          {activeTab === 'eraser' && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
              <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6">
                <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                    alt="Scenic Beach"
                    className="w-full h-full object-cover"
                  />
                  {/* Mock Magic Eraser Brush Highlight */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-24 h-16 sm:w-28 sm:h-20 rounded-full bg-purple-500/30 border-2 border-dashed border-purple-400/80 animate-pulse flex items-center justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-white bg-purple-600/90 px-2 py-0.5 rounded shadow">
                      Object Erased
                    </span>
                  </div>
                  {/* Floating Tool Palette Mock */}
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 bg-[#091528]/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[10px] sm:text-xs text-white">
                    <Wand2 size={13} className="text-purple-400 shrink-0" />
                    <span className="truncate">Neural Inpainting: 1-Click Clean Erase</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GIF Timeline Animator */}
          {activeTab === 'gif-maker' && (
            <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950">
              {/* Preview Stage */}
              <div className="relative flex-1 w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-[#0d1424]">
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
                  alt="Product Shoe Animated"
                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                  style={{
                    transform: `rotate(${activeFrame * 4 - 6}deg) scale(${1 + (activeFrame % 2) * 0.05})`
                  }}
                />
                {/* Floating animated sticker */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-emerald-500 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md uppercase tracking-wider shadow-lg animate-bounce">
                  NEW DROP 🔥
                </div>
              </div>

              {/* Timeline Sequencer Mockup */}
              <div className="w-full max-w-2xl bg-[#091528]/95 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 mt-3 sm:mt-4 shadow-xl">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlayingGif(!isPlayingGif)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      {isPlayingGif ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <span className="font-semibold text-white">Timeline Sequence (4 Frames)</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-emerald-400 font-mono">Loop: Infinite</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3].map((frameIdx) => (
                    <div
                      key={frameIdx}
                      onClick={() => {
                        setIsPlayingGif(false);
                        setActiveFrame(frameIdx);
                      }}
                      className={`h-10 sm:h-12 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                        activeFrame === frameIdx
                          ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-300">F{frameIdx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Feature Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10 bg-[#091528]/90 p-2 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-medium text-slate-300 gap-1.5 sm:gap-2 sm:divide-x sm:divide-white/5">
          <div className="flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg bg-white/[0.02] sm:bg-transparent">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">In-Browser Privacy</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg bg-white/[0.02] sm:bg-transparent">
            <Zap size={14} className="text-yellow-400 shrink-0" />
            <span className="truncate">WebGPU Speed</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg bg-white/[0.02] sm:bg-transparent">
            <Sliders size={14} className="text-cyan-400 shrink-0" />
            <span className="truncate">Selective Isolation</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg bg-white/[0.02] sm:bg-transparent">
            <Sparkles size={14} className="text-purple-400 shrink-0" />
            <span className="truncate">4K Studio Export</span>
          </div>
        </div>

      </div>
    </div>
  );
}
