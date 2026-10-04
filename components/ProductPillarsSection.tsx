"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Scissors, 
  Wand2, 
  Sparkles, 
  Clapperboard, 
  ArrowRight, 
  Check, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  SlidersHorizontal,
  Maximize2,
  Cpu
} from 'lucide-react';

const PRODUCTS = [
  {
    id: 'bg-removal',
    title: 'AI Background & Object Isolation Studio',
    badge: 'Neural Matting Engine',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    description: 'Instant client-side background removal powered by RMBG-1.4. Features zero-shot Selective Object Isolation ("wheel", "dog", "person") with custom backdrops and batch 4K ZIP export.',
    href: '/image-bg-removal',
    gradient: 'from-cyan-500 to-blue-600',
    hoverBorder: 'hover:border-cyan-500/40',
    ctaText: 'Launch BG Remover',
    features: [
      'State-of-the-Art Fur, Hair & Transparent Silhouette Cutouts',
      'Text-Prompted Object Isolation ("wheel of car", "shoes")',
      'Interactive Split Slider & Multi-Color Backdrop Presets',
      '100% In-Browser & RAM Safe (<250MB Memory Budget)'
    ],
    previewImg: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
    previewType: 'bg-cutout'
  },
  {
    id: 'image-editing',
    title: 'Pro Canvas Studio & AI Magic Eraser',
    badge: 'Full Layer Graphic Editor',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    description: 'Comprehensive graphic design workspace with multi-layer control, text styling, filter adjustments, and neural inpainting to erase unwanted objects, tourists, or watermarks seamlessly.',
    href: '/image-home-screen',
    gradient: 'from-purple-500 to-indigo-600',
    hoverBorder: 'hover:border-purple-500/40',
    ctaText: 'Open Canvas Editor',
    features: [
      'Multi-Layer Composition & Non-Destructive Editing',
      'Neural Object Eraser (Inpainting without blur artifacts)',
      'Rich Typography, Shape Overlays & Filter Controls',
      'Seamless Hand-Off: Import Background Cutouts with 1-Click'
    ],
    previewImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    previewType: 'canvas'
  },
  {
    id: 'image-ai',
    title: 'AI Photorealistic & Art Generator',
    badge: 'Prompt-to-Image AI',
    badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
    description: 'Transform words into breathtaking 8K visuals. Built-in smart prompt refiner expands simple concepts into richly detailed masterpieces with multiple aspect ratios and stylistic controls.',
    href: '/image-ai',
    gradient: 'from-pink-500 to-rose-600',
    hoverBorder: 'hover:border-pink-500/40',
    ctaText: 'Generate Images',
    features: [
      'Smart Prompt Expansion with Gemini AI Integration',
      'Photorealism, Cyberpunk, 3D Render & Anime Aesthetic Styles',
      'Multi-Aspect Ratio Presets (16:9, 1:1, 9:16, 4:5)',
      'Direct 1-Click Export to Canvas Editor for Fine-Tuning'
    ],
    previewImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewType: 'generator'
  },
  {
    id: 'gif-maker',
    title: 'Professional GIF Maker & Timeline Animator',
    badge: 'Keyframe Motion Studio',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    description: 'Frame-by-frame animation system designed for social media memes, product teasers, and stickers. Convert videos to GIFs, animate text layers, and control frame rates effortlessly.',
    href: '/gif-home-screen',
    gradient: 'from-emerald-500 to-teal-600',
    hoverBorder: 'hover:border-emerald-500/40',
    ctaText: 'Create Animated GIF',
    features: [
      'Precise Frame-by-Frame Timeline & Keyframe Ordering',
      'Video-to-GIF Conversion with Trimming & FPS Controls',
      'Animated Sticker Overlays & Custom Caption Typography',
      'High-Speed In-Browser Render with Ultra-Small File Sizes'
    ],
    previewImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    previewType: 'gif'
  }
];

export default function ProductPillarsSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Cpu size={14} />
          Complete Creative Suite
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Everything You Need to Create &amp; Polish
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400 text-base sm:text-lg">
          No fragmented apps or costly subscriptions. Four professional visual creative tools unified into one blazing-fast, privacy-first web studio.
        </p>
      </div>

      {/* 2x2 Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            className={`group relative rounded-3xl border border-white/10 bg-[#091528]/70 backdrop-blur-xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 ${prod.hoverBorder} hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:-translate-y-1`}
          >
            {/* Top Product Info */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${prod.badgeColor}`}>
                  {prod.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">100% In-Browser</span>
              </div>

              <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                {prod.title}
              </h3>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {prod.description}
              </p>

              {/* Visual Showcase Card */}
              <div className="mt-6 relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-inner group/preview">
                <img
                  src={prod.previewImg}
                  alt={prod.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay Graphic Element according to tool type */}
                {prod.previewType === 'bg-cutout' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80 flex items-center justify-end p-4">
                    <span className="text-xs font-bold text-cyan-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-400/30">
                      RMBG-1.4 Neural Matting ✨
                    </span>
                  </div>
                )}

                {prod.previewType === 'canvas' && (
                  <div className="absolute bottom-3 left-3 bg-[#091528]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs text-purple-300 font-medium flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>Layered Canvas + Inpainting</span>
                  </div>
                )}

                {prod.previewType === 'generator' && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 p-2.5 rounded-xl text-[11px] text-pink-300 font-mono truncate">
                    Prompt: Cinematic 8K Art
                  </div>
                )}

                {prod.previewType === 'gif' && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow">
                    Timeline 24 FPS
                  </div>
                )}
              </div>

              {/* Bullet Features */}
              <ul className="mt-6 flex flex-col gap-2.5">
                {prod.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Check size={11} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Launch Button CTA */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                href={prod.href}
                className={`group/btn flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r ${prod.gradient} text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.01] hover:brightness-110 active:scale-95`}
              >
                <span>{prod.ctaText}</span>
                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
