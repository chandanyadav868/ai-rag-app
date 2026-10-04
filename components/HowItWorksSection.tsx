"use client";

import React from 'react';
import { UploadCloud, Wand2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    step: '01',
    title: 'Upload or Paste Your Image',
    desc: 'Drag & drop photos, browse files, or hit Ctrl + V to paste straight from your clipboard. Supports JPG, PNG, WEBP, and video files.',
    icon: <UploadCloud size={28} className="text-cyan-400" />
  },
  {
    step: '02',
    title: 'Apply Neural AI Magic',
    desc: 'Remove backgrounds with RMBG-1.4, isolate specific objects with text prompts, erase tourists with LaMa inpainting, or generate new frames.',
    icon: <Wand2 size={28} className="text-purple-400" />
  },
  {
    step: '03',
    title: 'Export Studio Assets',
    desc: 'Download transparent PNGs, apply custom studio color backdrops, export animated GIFs, or hand off directly into our pro canvas editor.',
    icon: <Download size={28} className="text-emerald-400" />
  }
];

export default function HowItWorksSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full">
          Simple &amp; Seamless
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          From Raw Photo to Studio Quality in Seconds
        </h2>
        <p className="mt-3 text-slate-400 max-w-xl text-sm sm:text-base">
          No complicated menus or steep learning curves. Professional creative power at your fingertips.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {STEPS.map((item, idx) => (
          <div
            key={idx}
            className="relative rounded-3xl border border-white/10 bg-[#091528]/60 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-4xl font-black text-white/10 group-hover:text-cyan-500/30 transition-colors font-mono">
                  {item.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launch CTA Banner */}
      <div className="mt-16 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-[#091528] to-purple-950/40 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <h3 className="text-2xl font-bold text-white">Ready to create stunning visuals?</h3>
          <p className="mt-1 text-sm text-slate-400">Zero installation required • Works in every modern browser</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/image-bg-removal"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
          >
            <span>Try Background Remover</span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/gif-home-screen"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/15 bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <span>Open GIF Maker</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
