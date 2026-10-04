"use client";

import React from 'react';
import { ShieldCheck, Zap, Cpu, Sparkles, Lock, EyeOff, ServerOff, HardDrive } from 'lucide-react';

const SUPERPOWERS = [
  {
    icon: <ServerOff size={26} className="text-emerald-400" />,
    badge: '100% Private',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    title: 'Zero Cloud Uploads',
    description: 'Your sensitive personal photos, documents, and assets never leave your device. All neural networks execute strictly within your local browser sandbox.'
  },
  {
    icon: <Zap size={26} className="text-yellow-400" />,
    badge: 'WebGPU Powered',
    badgeColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    title: 'Sub-Second Inference',
    description: 'Leverages your computer’s GPU cores via WebGPU. When GPU is not present, our smart engine seamlessly switches to high-speed WebAssembly (WASM).'
  },
  {
    icon: <HardDrive size={26} className="text-cyan-400" />,
    badge: '< 250MB RAM Safe',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    title: 'Crash-Free Performance',
    description: 'Models are quantized into lightweight ONNX format with automatic downsampling buffers. Operates effortlessly on laptops, Chromebooks, and smartphones.'
  },
  {
    icon: <Sparkles size={26} className="text-purple-400" />,
    badge: 'Lossless 4K',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    title: 'Native-Resolution Compositing',
    description: 'Predicted neural alpha masks are upscaled and blended at your photo’s original camera resolution using hardware destination-in alpha blending.'
  }
];

export default function SuperpowersSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#091528] to-[#050B16] p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full">
            Engineering Excellence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Creators Trust Our Local AI Studio
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl text-sm sm:text-base">
            Built from the ground up to respect your privacy, your bandwidth, and your hardware.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUPERPOWERS.map((power, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.05] transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {power.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${power.badgeColor}`}>
                    {power.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {power.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {power.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
