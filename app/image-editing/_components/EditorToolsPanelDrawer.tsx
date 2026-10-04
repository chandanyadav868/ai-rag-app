"use client";

import React, { useState } from 'react';
import {
  Crop,
  Flame,
  ArrowUpRight,
  BadgeCheck,
  Plus,
  Scissors,
  Sliders,
  Sparkles,
  Square,
  SquarePen,
  Triangle,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

export type DrawerType = 'text' | 'shapes' | 'draw' | 'images' | 'ai' | 'resize' | 'thumbnail' | null;

const THUMBNAIL_TEXT_PRESETS = [
  {
    name: "Hindi Breaking News",
    category: "News / Crime",
    text: "सनसनीखेज खुलासा 🚨",
    fontFamily: "Mukta",
    fontWeight: "900",
    fontSize: 40,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 6,
    paintFirst: "stroke",
    backgroundColor: "#dc2626",
    skewX: -4,
    shadowColor: "rgba(0,0,0,0.85)",
    shadowBlur: 16,
    shadowOffsetX: 4,
    shadowOffsetY: 6,
    desc: "Red Ribbon Banner + Heavy Contrast",
  },
  {
    name: "Yellow Shock Hook",
    category: "Documentary",
    text: "सच्चाई क्या है?!",
    fontFamily: "Anton",
    fontWeight: "bold",
    fontSize: 44,
    fill: "#ffe600",
    stroke: "#000000",
    strokeWidth: 8,
    paintFirst: "stroke",
    backgroundColor: "",
    skewX: -6,
    shadowColor: "#000000",
    shadowBlur: 20,
    shadowOffsetX: 6,
    shadowOffsetY: 8,
    desc: "High-CTR Yellow Outline Slant",
  },
  {
    name: "Tech Price Badge",
    category: "Tech Review",
    text: "₹1,49,999 📱",
    fontFamily: "Bebas Neue",
    fontWeight: "bold",
    fontSize: 42,
    fill: "#00f0ff",
    stroke: "#000000",
    strokeWidth: 6,
    paintFirst: "stroke",
    backgroundColor: "#0a0f1d",
    skewX: -2,
    shadowColor: "#00f0ff",
    shadowBlur: 24,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    desc: "Electric Cyan Glow + Tech Pill",
  },
  {
    name: "Gold Showdown",
    category: "WWE / Entertainment",
    text: "THE FINAL BATTLE 👑",
    fontFamily: "Rozha One",
    fontWeight: "bold",
    fontSize: 38,
    fill: "#ffd700",
    stroke: "#451a03",
    strokeWidth: 5,
    paintFirst: "stroke",
    backgroundColor: "",
    skewX: 0,
    shadowColor: "#b45309",
    shadowBlur: 20,
    shadowOffsetX: 4,
    shadowOffsetY: 6,
    desc: "Gold Gradient Luxury Heading",
  },
  {
    name: "Exposed Ribbon",
    category: "Investigative",
    text: "पर्दाफाश! महाघोटाला 🔥",
    fontFamily: "Yatra One",
    fontWeight: "bold",
    fontSize: 38,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 6,
    paintFirst: "stroke",
    backgroundColor: "#000000",
    skewX: -3,
    shadowColor: "#dc2626",
    shadowBlur: 20,
    shadowOffsetX: 0,
    shadowOffsetY: 5,
    desc: "Black Ribbon + Crimson Underglow",
  },
];

const THUMBNAIL_ARROWS = [
  {
    name: "Curved Red Arrow",
    desc: "Crime / Attention Swoop",
    path: "M 25 120 Q 90 20 180 50 L 165 20 L 220 55 L 175 95 L 180 65 Q 105 38 25 120 Z",
    fill: "#ef4444",
    stroke: "#ffffff",
    strokeWidth: 3,
    scale: 0.9,
  },
  {
    name: "Curved Yellow Arrow",
    desc: "Tech / Notice Hook",
    path: "M 25 120 Q 90 20 180 50 L 165 20 L 220 55 L 175 95 L 180 65 Q 105 38 25 120 Z",
    fill: "#facc15",
    stroke: "#000000",
    strokeWidth: 3,
    scale: 0.9,
  },
  {
    name: "Straight Dynamic Pointer",
    desc: "Direct Focus Arrow",
    path: "M 20 50 L 120 50 L 120 20 L 180 65 L 120 110 L 120 80 L 20 80 Z",
    fill: "#ef4444",
    stroke: "#000000",
    strokeWidth: 3,
    scale: 0.8,
  },
];

const THUMBNAIL_EMOJIS = [
  "🚨", "😱", "🤯", "🤬", "🔥", "💸", "⚡", "🎯", "👑", "💥", "🥊", "🏆", "👀", "❌", "💯", "📈"
];

const THUMBNAIL_BADGES = [
  { text: "🚨 ALERT", bg: "#dc2626", fill: "#ffffff" },
  { text: "🔥 100% EXPOSED", bg: "#ea580c", fill: "#ffffff" },
  { text: "₹ HUGE DISCOUNT", bg: "#16a34a", fill: "#ffffff" },
  { text: "🤬 SHOCKING TRUTH", bg: "#7f1d1d", fill: "#fef08a" },
  { text: "⚡ EXCLUSIVE", bg: "#2563eb", fill: "#ffffff" },
  { text: "✔️ VERIFIED", bg: "#0284c7", fill: "#ffffff" },
];

interface EditorToolsPanelDrawerProps {
  activeDrawer: DrawerType;
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setImageModalOpen: (open: boolean) => void;
}

export function EditorToolsPanelDrawer({
  activeDrawer,
  editor,
  fileInputRef,
  setImageModalOpen,
}: EditorToolsPanelDrawerProps) {
  const [imageUrlInput, setImageUrlInput] = useState("");

  if (!activeDrawer) return null;

  return (
    <div className="space-y-4">
      {/* DRAWER: TEXT */}
      {activeDrawer === 'text' && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/50 leading-relaxed">
            Click to add a customizable text layer to your canvas.
          </p>
          <button
            onClick={() => editor.addTextLayer()}
            className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-600/10 group"
          >
            <div>
              <div className="text-lg font-black text-white group-hover:text-violet-300">Add a heading</div>
              <div className="text-[10px] text-white/40">Large bold title layer</div>
            </div>
            <Plus size={16} className="text-white/40 group-hover:text-white" />
          </button>

          <button
            onClick={() => editor.addTextLayer()}
            className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-600/10 group"
          >
            <div>
              <div className="text-sm font-bold text-white group-hover:text-violet-300">Add a subheading</div>
              <div className="text-[10px] text-white/40">Medium subtitle layer</div>
            </div>
            <Plus size={16} className="text-white/40 group-hover:text-white" />
          </button>

          <button
            onClick={() => editor.addTextLayer()}
            className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-600/10 group"
          >
            <div>
              <div className="text-xs font-medium text-white/80 group-hover:text-violet-300">Add paragraph text</div>
              <div className="text-[10px] text-white/40">Regular descriptive body text</div>
            </div>
            <Plus size={16} className="text-white/40 group-hover:text-white" />
          </button>

          {/* 1-Click Viral Headline Presets */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Flame size={12} /> Viral Headline Presets
              </span>
            </div>
            <div className="space-y-1.5">
              {THUMBNAIL_TEXT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    editor.addTextLayer({
                      text: p.text,
                      fontFamily: p.fontFamily,
                      fontSize: p.fontSize,
                      fontWeight: p.fontWeight,
                      fill: p.fill,
                      stroke: p.stroke,
                      strokeWidth: p.strokeWidth,
                      paintFirst: p.paintFirst,
                      backgroundColor: p.backgroundColor,
                      skewX: p.skewX,
                      shadowColor: p.shadowColor,
                      shadowBlur: p.shadowBlur,
                      shadowOffsetX: p.shadowOffsetX,
                      shadowOffsetY: p.shadowOffsetY,
                    });
                    toast.success(`Inserted "${p.name}" headline!`);
                  }}
                  className="w-full flex flex-col items-start rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-left transition hover:border-amber-500/50 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-white">{p.name}</span>
                    <span className="text-[9px] text-amber-400 font-mono">{p.fontFamily}</span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: SHAPES */}
      {activeDrawer === 'shapes' && (
        <div className="space-y-4">
          <p className="text-[11px] text-white/50">
            Click any shape to draw or insert onto the canvas.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                editor.onShapeClick("rectangle");
                toast.info("Click and drag on the canvas to draw a rectangle");
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-white/80 transition hover:border-violet-500/50 hover:bg-white/[0.06] hover:text-white"
            >
              <div className="h-8 w-12 rounded border-2 border-violet-400 bg-violet-400/20" />
              <span className="text-[11px] font-semibold">Rectangle</span>
            </button>

            <button
              onClick={() => {
                editor.onShapeClick("circle");
                toast.info("Click and drag on the canvas to draw a circle");
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-white/80 transition hover:border-violet-500/50 hover:bg-white/[0.06] hover:text-white"
            >
              <div className="h-10 w-10 rounded-full border-2 border-violet-400 bg-violet-400/20" />
              <span className="text-[11px] font-semibold">Circle</span>
            </button>

            <button
              onClick={() => {
                editor.onShapeClick("triangle");
                toast.info("Click and drag on the canvas to draw a triangle");
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-white/80 transition hover:border-violet-500/50 hover:bg-white/[0.06] hover:text-white"
            >
              <Triangle size={28} className="text-violet-400" />
              <span className="text-[11px] font-semibold">Triangle</span>
            </button>

            <button
              onClick={() => {
                editor.onShapeClick("polyline");
                toast.info("Click points to draw polyline, double-click to finish");
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-white/80 transition hover:border-violet-500/50 hover:bg-white/[0.06] hover:text-white"
            >
              <SquarePen size={28} className="text-violet-400" />
              <span className="text-[11px] font-semibold">Polyline</span>
            </button>
          </div>

          {/* Attention Arrows for Thumbnails */}
          <div className="pt-2 border-t border-white/[0.08] space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <ArrowUpRight size={12} /> Attention Arrows
            </span>
            <div className="grid grid-cols-1 gap-2">
              {THUMBNAIL_ARROWS.map((arr) => (
                <button
                  key={arr.name}
                  type="button"
                  onClick={() => {
                    editor.insertPath(arr.path, {
                      fill: arr.fill,
                      stroke: arr.stroke,
                      strokeWidth: arr.strokeWidth,
                      scale: arr.scale,
                    });
                    toast.success(`Inserted ${arr.name}!`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-left transition hover:border-rose-500/50 hover:bg-white/[0.07]"
                >
                  <div>
                    <div className="text-[11px] font-bold text-white">{arr.name}</div>
                    <div className="text-[9px] text-white/40">{arr.desc}</div>
                  </div>
                  <div 
                    className="h-6 w-6 rounded-lg flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: arr.fill }}
                  >
                    <ArrowUpRight size={14} className={arr.fill === '#facc15' ? 'text-black' : 'text-white'} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: DRAW / BRUSH */}
      {activeDrawer === 'draw' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Brush Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Pencil", type: "pencil" },
                { label: "Spray", type: "spray" },
                { label: "Pattern", type: "pattern" },
                { label: "Eraser", type: "eraser" },
              ].map((b) => (
                <button
                  key={b.type}
                  onClick={() => editor.setBrushType(b.type as any)}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    editor.brushType === b.type 
                      ? 'bg-violet-600 text-white shadow-sm' 
                      : 'border border-white/[0.06] bg-white/[0.02] text-white/60 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Brush Size</span>
              <span className="font-bold text-violet-400">{editor.eraserSize}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={100}
              value={editor.eraserSize}
              onChange={(e) => editor.setEraserSize(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* DRAWER: IMAGES */}
      {activeDrawer === 'images' && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-500/40 bg-violet-600/10 p-6 text-center transition hover:border-violet-500 hover:bg-violet-600/15"
          >
            <UploadCloud size={28} className="text-violet-400" />
            <div>
              <div className="text-xs font-bold text-white">Upload from Computer</div>
              <div className="text-[10px] text-white/50 mt-0.5">PNG, JPG, WebP supported</div>
            </div>
          </button>

          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Or Add by URL
            </div>
            <div className="flex gap-1.5">
              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
              <button
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    editor.insertImageFromUrl(imageUrlInput.trim());
                    setImageUrlInput("");
                    toast.success("Image loading onto canvas");
                  }
                }}
                className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
              >
                Add
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-white/50 leading-relaxed">
            💡 <strong className="text-white/80">Pro-tip:</strong> You can also directly paste an image from your clipboard (<code className="rounded bg-white/10 px-1 py-0.5 text-white/80">Ctrl + V</code>) or drag and drop any image into the workspace!
          </div>
        </div>
      )}

      {/* DRAWER: AI MAGIC */}
      {activeDrawer === 'ai' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/80 leading-relaxed">
            ✨ Browser-local AI runs 100% on your GPU/CPU via WebGPU and WebAssembly. No data leaves your machine.
          </div>

          <button
            onClick={() => {
              if (!editor.activeId) {
                toast.error("Please select an image on the canvas first!");
                return;
              }
              editor.setLayerMenu("AI Features");
              editor.setRightPanelOpen(true);
              toast.info("Opened AI Studio in Inspector panel");
            }}
            className="w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-violet-500/40 hover:bg-white/[0.06]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Scissors size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Background Removal</div>
              <div className="text-[10px] text-white/50">Instant clean cutout with RMBG-1.4</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (!editor.activeId) {
                toast.error("Please select an element first to open Mask Studio!");
                return;
              }
              editor.setMaskStudioOpen(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-violet-500/40 hover:bg-white/[0.06]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Crop size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Mask Studio</div>
              <div className="text-[10px] text-white/50">Custom shape clipping & feathered masks</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (!editor.activeId) {
                toast.error("Select an image first to edit with AI tools!");
                return;
              }
              editor.setAiEdit(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-violet-500/40 hover:bg-white/[0.06]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
              <Wand2 size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Magic Object Eraser</div>
              <div className="text-[10px] text-white/50">Brush away unwanted objects</div>
            </div>
          </button>
        </div>
      )}

      {/* DRAWER: RESIZE CANVAS */}
      {activeDrawer === 'resize' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Width (px)</label>
              <input
                type="number"
                value={editor.canvasDimensions.width}
                onChange={(e) => {
                  editor.updateCanvasDimensions(Number(e.target.value), editor.canvasDimensions.height);
                }}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Height (px)</label>
              <input
                type="number"
                value={editor.canvasDimensions.height}
                onChange={(e) => {
                  editor.updateCanvasDimensions(editor.canvasDimensions.width, Number(e.target.value));
                }}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Social Aspect Ratio Presets</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "1:1 Square", w: 1080, h: 1080, desc: "Instagram Post" },
                { label: "9:16 Story", w: 1080, h: 1920, desc: "Reels / TikTok" },
                { label: "16:9 Landscape", w: 1280, h: 720, desc: "YouTube Thumbnail" },
                { label: "4:5 Portrait", w: 1080, h: 1350, desc: "Instagram Feed" },
                { label: "3:1 Banner", w: 1500, h: 500, desc: "Twitter / LinkedIn" },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    editor.updateCanvasDimensions(p.w, p.h);
                    toast.success(`Canvas resized to ${p.w}×${p.h} (${p.label})`);
                  }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 px-2.5 text-left text-[11px] font-semibold text-white/70 hover:border-violet-500/40 hover:bg-white/[0.06] hover:text-white transition"
                >
                  <div className="font-bold text-white">{p.label}</div>
                  <div className="text-[9px] text-white/40">{p.w}×{p.h} • {p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: YOUTUBE THUMBNAIL STUDIO */}
      {activeDrawer === 'thumbnail' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">YouTube 16:9 Preset</span>
              <button
                type="button"
                onClick={() => {
                  editor.updateCanvasDimensions(1280, 720);
                  toast.success("Canvas set to 1280×720 (16:9 YouTube Thumbnail)");
                }}
                className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-rose-500 transition"
              >
                Set 1280×720
              </button>
            </div>
            <p className="mt-1 text-[10px] text-white/50">
              Standard YouTube 1280×720 resolution for crisp mobile & desktop rendering.
            </p>
          </div>

          {/* 1-Click Viral Headlines */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Flame size={12} /> Viral Headlines & Hooks
            </span>
            <div className="space-y-1.5">
              {THUMBNAIL_TEXT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    editor.addTextLayer({
                      text: p.text,
                      fontFamily: p.fontFamily,
                      fontSize: p.fontSize,
                      fontWeight: p.fontWeight,
                      fill: p.fill,
                      stroke: p.stroke,
                      strokeWidth: p.strokeWidth,
                      paintFirst: p.paintFirst,
                      backgroundColor: p.backgroundColor,
                      skewX: p.skewX,
                      shadowColor: p.shadowColor,
                      shadowBlur: p.shadowBlur,
                      shadowOffsetX: p.shadowOffsetX,
                      shadowOffsetY: p.shadowOffsetY,
                    });
                    toast.success(`Inserted "${p.name}" headline!`);
                  }}
                  className="w-full flex flex-col items-start rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-left transition hover:border-amber-500/50 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-white">{p.name}</span>
                    <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                      {p.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attention Arrows */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <ArrowUpRight size={12} /> Attention Arrows
            </span>
            <div className="grid grid-cols-1 gap-2">
              {THUMBNAIL_ARROWS.map((arr) => (
                <button
                  key={arr.name}
                  type="button"
                  onClick={() => {
                    editor.insertPath(arr.path, {
                      fill: arr.fill,
                      stroke: arr.stroke,
                      strokeWidth: arr.strokeWidth,
                      scale: arr.scale,
                    });
                    toast.success(`Inserted ${arr.name}!`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-left transition hover:border-rose-500/50 hover:bg-white/[0.07]"
                >
                  <div>
                    <div className="text-[11px] font-bold text-white">{arr.name}</div>
                    <div className="text-[9px] text-white/40">{arr.desc}</div>
                  </div>
                  <div 
                    className="h-6 w-6 rounded-lg flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: arr.fill }}
                  >
                    <ArrowUpRight size={14} className={arr.fill === '#facc15' ? 'text-black' : 'text-white'} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Viral Ribbons & Badges */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <BadgeCheck size={12} /> Viral Badges & Ribbons
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {THUMBNAIL_BADGES.map((b) => (
                <button
                  key={b.text}
                  type="button"
                  onClick={() => {
                    editor.addTextLayer({
                      text: b.text,
                      fontFamily: "Rajdhani",
                      fontSize: 28,
                      fontWeight: "bold",
                      fill: b.fill,
                      backgroundColor: b.bg,
                      stroke: "#000000",
                      strokeWidth: 3,
                      paintFirst: "stroke",
                      shadowColor: "rgba(0,0,0,0.8)",
                      shadowBlur: 14,
                    });
                    toast.success(`Inserted ${b.text} badge!`);
                  }}
                  className="rounded-lg border border-white/10 px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide text-white transition hover:scale-105"
                  style={{ backgroundColor: b.bg }}
                >
                  {b.text}
                </button>
              ))}
            </div>
          </div>

          {/* Reaction Emojis */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              High-CTR Reaction Emojis
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {THUMBNAIL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    editor.addTextLayer({
                      text: emoji,
                      fontFamily: "Segoe UI Emoji, Apple Color Emoji, sans-serif",
                      fontSize: 64,
                      fill: "#ffffff",
                      stroke: undefined,
                      strokeWidth: 0,
                      shadowColor: "rgba(0,0,0,0.6)",
                      shadowBlur: 16,
                      shadowOffsetY: 8,
                    });
                    toast.success(`Added ${emoji} sticker to canvas!`);
                  }}
                  className="flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-2xl transition hover:scale-125 hover:bg-white/[0.08]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
