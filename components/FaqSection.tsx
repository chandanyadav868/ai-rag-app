"use client";

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Are my uploaded images sent to any server or stored in the cloud?',
    a: 'Never. Unlike other services that upload your private photos to external servers, Polish AI runs neural network models directly inside your local browser via WebGPU and WebAssembly. Your photos and graphics never leave your computer or phone.'
  },
  {
    q: 'How does Selective Object Isolation work?',
    a: 'Our studio integrates Xenova/clipseg-rd64-refined, a multi-modal zero-shot vision model. Simply type the name of any object (e.g. "dog", "wheel of car", "person", "shoes") and the neural engine segments only that target while erasing the rest of the image.'
  },
  {
    q: 'Will my browser tab crash when processing large camera photos?',
    a: 'No. We use quantized ONNX neural weights with automated resolution downsampling buffers that keep memory consumption strictly under 250MB RAM. This ensures silky smooth performance without browser crashes even on mobile devices.'
  },
  {
    q: 'Can I export cutouts and animations in high resolution?',
    a: 'Yes. For background removal, predicted neural masks are composited with your original image using hardware-accelerated destination-in blending, preserving 100% of your camera’s native resolution and sharpness.'
  },
  {
    q: 'Can I transfer cutouts directly into the Canvas Graphic Editor?',
    a: 'Absolutely. With a single click of "Open in Canvas", your transparent cutout is handed off directly to our multi-layer graphic editor (/image-editing) where you can add typography, shapes, filters, and overlays.'
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <HelpCircle size={14} />
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything You Need to Know
        </h2>
        <p className="mt-3 text-slate-400 text-sm sm:text-base">
          Transparent answers about our client-side AI architecture and creative tools.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'border-cyan-500/40 bg-[#091528]/90 shadow-xl'
                  : 'border-white/10 bg-[#091528]/50 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-white text-base sm:text-lg">
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
