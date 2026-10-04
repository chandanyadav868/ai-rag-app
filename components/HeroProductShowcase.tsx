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

type TabKey = 'bg-removal' | 'eraser' | 'image-gen' | 'gif-maker';

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
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#091528]/90 border border-white/10 backdrop-blur-xl shadow-2xl mb-6 max-w-3xl">
        <button
          onClick={() => setActiveTab('bg-removal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'bg-removal'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Scissors size={16} />
          <span>AI Background & Object Cutout</span>
        </button>

        <button
          onClick={() => setActiveTab('eraser')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'eraser'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wand2 size={16} />
          <span>Canvas Studio & Eraser</span>
        </button>

        <button
          onClick={() => setActiveTab('image-gen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'image-gen'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={16} />
          <span>AI Image Generation</span>
        </button>

        <button
          onClick={() => setActiveTab('gif-maker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'gif-maker'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clapperboard size={16} />
          <span>GIF Timeline Animator</span>
        </button>
      </div>

      {/* Main Interactive Stage Container */}
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#070D18]/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Top Control Bar of Interactive Stage */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#091528]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-semibold text-slate-400 border-l border-white/10 pl-3">
              {activeTab === 'bg-removal' && 'RMBG-1.4 Neural Matting Studio • Drag slider to test live'}
              {activeTab === 'eraser' && 'AI Inpainting & Object Removal • Clean Scenery Restoration'}
              {activeTab === 'image-gen' && 'Photorealistic Art Generation • Prompt Engine'}
              {activeTab === 'gif-maker' && 'Frame Timeline & Motion Sequencer'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'bg-removal' && (
              <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setActiveBackdrop('transparent')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    activeBackdrop === 'transparent' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transparent
                </button>
                <button
                  onClick={() => setActiveBackdrop('gradient')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    activeBackdrop === 'gradient' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gradient
                </button>
                <button
                  onClick={() => setActiveBackdrop('obsidian')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    activeBackdrop === 'obsidian' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Obsidian
                </button>
              </div>
            )}

            <Link
              href={
                activeTab === 'bg-removal'
                  ? '/image-bg-removal'
                  : activeTab === 'eraser'
                  ? '/image-home-screen'
                  : activeTab === 'image-gen'
                  ? '/image-ai'
                  : '/gif-home-screen'
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500 text-white hover:text-slate-900 text-xs font-bold transition-all shadow"
            >
              <span>Launch Tool</span>
              <ArrowRight size={13} />
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

              {/* Right Side: Cutout Image (Simulated isolated dog cutout over backdrop) */}
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{
                  clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                  willChange: 'clip-path',
                  transform: 'translateZ(0)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80"
                  alt="AI Cutout"
                  className="max-w-full max-h-full object-contain pointer-events-none [mask-image:radial-gradient(ellipse_60%_80%_at_50%_52%,black_70%,transparent_100%)]"
                />
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%`, willChange: 'left', transform: 'translateZ(0)' }}
              >
                <div className="w-8 h-8 -ml-3.5 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-slate-900/30">
                  <SplitSquareVertical size={16} />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 pointer-events-none">
                Original Photo
              </div>
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/90 backdrop-blur-md text-slate-950 border border-cyan-300 pointer-events-none shadow-lg">
                AI Transparent Cutout
              </div>

              {/* Helper Drag Prompt */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 pointer-events-none flex items-center gap-1.5">
                <Sliders size={13} className="text-cyan-400" />
                <span>Drag divider to inspect edge precision</span>
              </div>
            </div>
          )}

          {/* TAB 2: Canvas Studio & Object Eraser */}
          {activeTab === 'eraser' && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
              <div className="relative w-full h-full flex items-center justify-center p-6">
                <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                    alt="Scenic Beach"
                    className="w-full h-full object-cover"
                  />
                  {/* Mock Magic Eraser Brush Highlight */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-28 h-20 rounded-full bg-purple-500/30 border-2 border-dashed border-purple-400/80 animate-pulse flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white bg-purple-600/90 px-2 py-0.5 rounded shadow">
                      Object Erased
                    </span>
                  </div>
                  {/* Floating Tool Palette Mock */}
                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-[#091528]/90 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl text-xs text-white">
                    <Wand2 size={14} className="text-purple-400" />
                    <span>LaMa Neural Inpainting: 1-Click Clean Erase</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI Text-to-Image Generation */}
          {activeTab === 'image-gen' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#091528] to-[#040810]">
              <div className="w-full max-w-2xl flex flex-col gap-4">
                {/* Prompt Input Bar Mockup */}
                <div className="flex items-center gap-3 bg-black/60 border border-white/15 rounded-2xl p-2.5 shadow-xl">
                  <Sparkles size={18} className="text-pink-400 ml-2 shrink-0" />
                  <p className="text-xs sm:text-sm text-slate-200 truncate flex-1 font-mono">
                    &quot;Futuristic golden retriever in a holographic cyberpunk city, 8k ultra-detailed, cinematic lighting&quot;
                  </p>
                  <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shrink-0">
                    Generated
                  </span>
                </div>

                {/* Generated Result Showcase */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                    alt="AI Generated Artwork"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-pink-300">
                    Aspect: 16:9 • Style: Cinematic Digital Art
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GIF Timeline Animator */}
          {activeTab === 'gif-maker' && (
            <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-slate-950">
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
                <div className="absolute top-4 left-4 bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg animate-bounce">
                  NEW DROP 🔥
                </div>
              </div>

              {/* Timeline Sequencer Mockup */}
              <div className="w-full max-w-2xl bg-[#091528]/95 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 mt-4 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlayingGif(!isPlayingGif)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      {isPlayingGif ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <span className="font-semibold text-white">Timeline Sequence (4 Frames • 24 FPS)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">Loop: Infinite</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((frameIdx) => (
                    <div
                      key={frameIdx}
                      onClick={() => {
                        setIsPlayingGif(false);
                        setActiveFrame(frameIdx);
                      }}
                      className={`h-12 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                        activeFrame === frameIdx
                          ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold text-slate-300">Frame {frameIdx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Feature Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10 bg-[#091528]/90 divide-x divide-white/5 text-center py-3.5 px-4 text-xs font-medium text-slate-300">
          <div className="flex items-center justify-center gap-2 py-1">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>100% In-Browser Privacy</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <Zap size={16} className="text-yellow-400 shrink-0" />
            <span>WebGPU Hardware Speed</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <Sliders size={16} className="text-cyan-400 shrink-0" />
            <span>Selective Prompt Isolation</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1">
            <Sparkles size={16} className="text-purple-400 shrink-0" />
            <span>Studio 4K High-Res Export</span>
          </div>
        </div>

      </div>
    </div>
  );
}
