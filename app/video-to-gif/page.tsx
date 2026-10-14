"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  Video,
  Sparkles,
  ArrowLeft,
  FileVideo,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
  Film,
  Download,
} from 'lucide-react';
import { useVideoToGif } from './_hooks/useVideoToGif';
import { VideoTrimmer } from './_components/VideoTrimmer';
import { ConversionSettings } from './_components/ConversionSettings';
import { GifResultCard } from './_components/GifResultCard';

export default function VideoToGifPage() {
  const engine = useVideoToGif();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      engine.loadVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      engine.loadVideoFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Reload or reset file
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center justify-between border-b border-white/10 bg-[#081221]/90 px-4 sm:px-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/gif-home-screen"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95 border border-white/5"
            title="Back to GIF Studio Hub"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-black font-black text-xs shadow-md shadow-cyan-500/20">
              <Film size={14} />
            </div>
            <span className="font-black text-sm sm:text-base tracking-tight text-white">
              Polish AI <span className="text-cyan-400">Video2GIF</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/gif-maker"
            className="hidden xs:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            <Layers size={13} className="text-cyan-400" />
            <span>GIF Studio</span>
          </Link>
          <Link
            href="/image-editing"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Image Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
        {/* Hero Header */}
        {!engine.videoUrl && (
          <div className="flex flex-col items-center text-center gap-3 pt-4 sm:pt-8 animate-in fade-in duration-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-300">
              <Sparkles size={12} className="text-cyan-400" />
              100% Client-Side • Fast & Zero Data Uploaded
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl">
              Convert Any Video into a <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">High-Quality GIF</span>
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-xl">
              Trim clips with frame-by-frame precision, adjust FPS, overlay meme text, and export lightweight animated GIFs in seconds.
            </p>
          </div>
        )}

        {/* Video Upload Dropzone (When no video is uploaded) */}
        {!engine.videoUrl ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 backdrop-blur-xl ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : 'border-white/15 bg-[#09182b]/60 hover:border-cyan-400/50 hover:bg-[#09182b]/90 shadow-2xl'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 shadow-xl group-hover:scale-110 transition-transform">
              <Upload size={32} className="group-hover:-translate-y-1 transition-transform" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition">
                Choose a Video or Drop it Here
              </h2>
              <p className="text-xs text-white/50">
                Supports MP4, WebM, MOV, and screen recordings (up to 200MB)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 border border-white/5">
                MP4
              </span>
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 border border-white/5">
                WebM
              </span>
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 border border-white/5">
                MOV
              </span>
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 border border-white/5">
                Screen Captures
              </span>
            </div>
          </div>
        ) : (
          /* Active Conversion Workspace (Trimmer + Settings + Result) */
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* If GIF is ready, show Result Card */}
            {engine.gifUrl ? (
              <GifResultCard engine={engine} onReset={handleReset} />
            ) : null}

            {/* Trimmer and Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Video Trimmer Preview (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <VideoTrimmer engine={engine} />
              </div>

              {/* Right Column: Conversion Parameters & CTA (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <ConversionSettings engine={engine} />
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#09182b]/40 p-5 backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">100% In-Browser & Private</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Your video is processed strictly on your computer using WebAssembly and Web Workers. Zero files are uploaded to any server.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#09182b]/40 p-5 backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">Precision Trim & Frame Step</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Step through frames with 0.1s accuracy, choose custom frame rates from 5 to 24 FPS, and speed up or slow down clips.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#09182b]/40 p-5 backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers size={18} />
            </div>
            <h3 className="text-sm font-bold text-white">Direct GIF Studio Handoff</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Send extracted video frames directly to Polish AI GIF Studio with 1 click to apply Hindi hooks, stickers, and layer masks.
            </p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 pb-12">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <HelpCircle size={18} className="text-cyan-400" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/60">
            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="font-bold text-white">How do I convert a video into a GIF?</h4>
              <p>Upload any MP4, WebM, or MOV video, drag the start and end handles on the timeline trimmer to pick your clip, choose your frame rate, and click "Convert to Animated GIF".</p>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="font-bold text-white">Is there any video size or time limit?</h4>
              <p>Since extraction runs locally in your browser, short clips (1 to 10 seconds) render almost instantly. For best results, we recommend keeping GIF clips under 10 seconds.</p>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="font-bold text-white">Can I edit the GIF frames after converting?</h4>
              <p>Yes! Simply click "Open in GIF Studio" on the result card. It will automatically transfer all extracted frames to Polish AI GIF Maker for mask editing, text layers, and animations.</p>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="font-bold text-white">Is my video stored on your server?</h4>
              <p>No. Polish AI processes your media 100% inside your browser using client-side Web Workers. Your media never leaves your device.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
