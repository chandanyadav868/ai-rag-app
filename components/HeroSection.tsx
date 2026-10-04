"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles, Scissors, Clapperboard, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import HeroProductShowcase from './HeroProductShowcase';

export default function HeroSection() {
  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pt-4 sm:pt-8 sm:px-6 lg:px-8">
      {/* Top Ambient Light Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-cyan-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Hero Header Text */}
      <div className="mx-auto max-w-4xl flex flex-col items-center justify-center text-center">
        
        {/* Live Announcement Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-[#091528]/80 text-cyan-300 text-xs sm:text-sm font-semibold mb-6 shadow-xl backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>100% Client-Side Neural AI • Private &amp; Instant</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          The All-in-One AI Visual Studio.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Zero Cloud Uploads.
          </span>
        </h1>

        {/* Hero Value Subtitle */}
        <p className="text-slate-300 text-base sm:text-xl max-w-3xl mx-auto font-normal mb-8 leading-relaxed">
          Remove backgrounds with neural precision, isolate objects by text prompt, edit on a multi-layer canvas, generate photorealistic images, and animate GIFs — all running 100% privately in your browser.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            href="/image-bg-removal"
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]"
          >
            <Scissors size={18} />
            <span>Try AI Background Remover</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/image-home-screen"
            className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 hover:scale-105"
          >
            <Sparkles size={18} className="text-purple-400" />
            <span>Open Canvas Studio</span>
          </Link>

          <Link
            href="/gif-home-screen"
            className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 hover:scale-105"
          >
            <Clapperboard size={18} className="text-emerald-400" />
            <span>Make Animated GIFs</span>
          </Link>
        </div>

        {/* Quick Feature Chips */}
        <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-400 mb-12">
          {[
            'RMBG-1.4 Neural Matting',
            'Zero-Shot Object Isolation',
            'Multi-Layer Canvas',
            'Timeline Keyframe GIF',
            'WebGPU Fast'
          ].map((pill) => (
            <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-slate-300">
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Visual: Interactive Product Showcase (NO auto-scrolling images) */}
      <div className="mx-auto w-full max-w-6xl">
        <HeroProductShowcase />
      </div>

    </section>
  );
}
