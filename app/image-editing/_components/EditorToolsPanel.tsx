"use client";

import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Crop, 
  Download, 
  Eraser, 
  FolderArchive, 
  HelpCircle, 
  Image as ImageIcon, 
  ImageUpIcon, 
  Layers, 
  Maximize2, 
  MousePointer2, 
  PenTool, 
  Plus, 
  Scissors, 
  ShapesIcon, 
  Sliders, 
  Sparkles, 
  Square, 
  SquarePen, 
  Trash2, 
  Triangle, 
  Type, 
  UploadCloud, 
  Wand2, 
  X,
  Flame,
  ArrowUpRight,
  BadgeCheck
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { InsertImageModal } from './InsertImageModal';

interface EditorToolsPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
  exportDialogOpen?: boolean;
  setExportDialogOpen?: (open: boolean) => void;
  resizeDrawerOpen?: boolean;
  setResizeDrawerOpen?: (open: boolean) => void;
}

type DrawerType = 'text' | 'shapes' | 'draw' | 'images' | 'ai' | 'resize' | 'thumbnail' | null;
type ExportFormatOption = "png" | "jpeg" | "webp";

interface ExportFormState {
  format: ExportFormatOption;
  quality: number;
  multiplier: number;
  filename: string;
  enableRetinaScaling: boolean;
}

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

export function EditorToolsPanel({ 
  editor, 
  exportDialogOpen: externalExportOpen, 
  setExportDialogOpen: setExternalExportOpen,
  resizeDrawerOpen,
  setResizeDrawerOpen
}: EditorToolsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [localExportOpen, setLocalExportOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const isExportOpen = externalExportOpen !== undefined ? externalExportOpen : localExportOpen;
  const setExportOpen = setExternalExportOpen || setLocalExportOpen;

  const [exportForm, setExportForm] = useState<ExportFormState>({
    format: "png",
    quality: 1,
    multiplier: 1,
    filename: "canvas-export",
    enableRetinaScaling: true,
  });

  const qualitySupported = exportForm.format === "jpeg" || exportForm.format === "webp";

  // Respond to resize trigger from TopBar
  useEffect(() => {
    if (resizeDrawerOpen) {
      setActiveDrawer('resize');
      setResizeDrawerOpen?.(false);
    }
  }, [resizeDrawerOpen, setResizeDrawerOpen]);

  // Synchronize active tool with drawer
  const handleToolClick = (drawer: DrawerType) => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
      return;
    }
    setActiveDrawer(drawer);
  };

  return (
    <>
      {/* Tool Rail (Width: 64px) & Slide-out Drawer */}
      <aside className={`fixed left-0 top-14 bottom-0 z-30 flex transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        editor.leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sleek Tool Icon Rail */}
        <div className="flex h-full w-16 flex-col items-center justify-between border-r border-white/[0.08] bg-[#0c1017]/95 py-3 backdrop-blur-xl">
          <div className="flex w-full flex-col items-center gap-1.5 px-2">
            {/* Select Tool */}
            <button
              onClick={() => {
                editor.resetToSelectMode();
                setActiveDrawer(null);
              }}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                editor.activeTool === "select" && !activeDrawer
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Select / Move (V)"
            >
              <MousePointer2 size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Select</span>
            </button>

            {/* Text Tool */}
            <button
              onClick={() => handleToolClick('text')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'text' || editor.activeTool === "text"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Add Text (T)"
            >
              <Type size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Text</span>
            </button>

            {/* Shapes Tool */}
            <button
              onClick={() => handleToolClick('shapes')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'shapes' || ["rectangle", "circle", "triangle", "polyline"].includes(editor.activeTool)
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Shapes & Lines"
            >
              <ShapesIcon size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Shapes</span>
            </button>

            {/* Free Draw Tool */}
            <button
              onClick={() => {
                handleToolClick('draw');
                if (editor.activeTool !== "freeDrawing") {
                  editor.onShapeClick("freeDrawing");
                }
              }}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'draw' || editor.activeTool === "freeDrawing"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Brush & Drawing"
            >
              <PenTool size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Draw</span>
            </button>

            {/* Images & Uploads */}
            <button
              onClick={() => handleToolClick('images')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'images' || editor.activeTool === "image"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Upload & Images"
            >
              <ImageUpIcon size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Images</span>
            </button>

            {/* AI Studio */}
            <button
              onClick={() => handleToolClick('ai')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'ai'
                  ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="AI Magic Tools"
            >
              <Sparkles size={17} className="text-amber-300" />
              <span className="mt-0.5 text-[9px] font-bold">AI</span>
            </button>

            {/* YouTube Thumbnails Tool */}
            <button
              onClick={() => handleToolClick('thumbnail')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'thumbnail'
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="YouTube Thumbnail Superpowers"
            >
              <Flame size={17} className="text-amber-400 shrink-0" />
              <span className="mt-0.5 text-[8px] font-black uppercase tracking-tighter text-center leading-none max-w-[42px] truncate">YT Studio</span>
            </button>
          </div>

          {/* Bottom Settings in Rail */}
          <div className="flex flex-col items-center gap-1.5 px-2">
            <button
              onClick={() => handleToolClick('resize')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'resize'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Canvas Dimensions"
            >
              <Sliders size={16} />
              <span className="mt-0.5 text-[9px] font-bold">Canvas</span>
            </button>
          </div>
        </div>

        {/* Contextual Secondary Drawer */}
        {activeDrawer && (
          <div className="h-full w-72 border-r border-white/[0.08] bg-[#0f141f]/95 p-4 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {activeDrawer === 'text' && 'Typography'}
                  {activeDrawer === 'shapes' && 'Shapes & Lines'}
                  {activeDrawer === 'draw' && 'Drawing & Brushes'}
                  {activeDrawer === 'images' && 'Add Images'}
                  {activeDrawer === 'ai' && 'AI Magic Studio'}
                  {activeDrawer === 'thumbnail' && 'YouTube Thumbnail Studio'}
                  {activeDrawer === 'resize' && 'Canvas Dimensions'}
                </span>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* DRAWER: TEXT */}
              {activeDrawer === 'text' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Click to add a customizable text layer to your canvas.
                  </p>
                  <button
                    onClick={() => {
                      editor.addTextLayer();
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-600/10 group"
                  >
                    <div>
                      <div className="text-lg font-black text-white group-hover:text-violet-300">Add a heading</div>
                      <div className="text-[10px] text-white/40">Large bold title layer</div>
                    </div>
                    <Plus size={16} className="text-white/40 group-hover:text-white" />
                  </button>

                  <button
                    onClick={() => {
                      editor.addTextLayer();
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-600/10 group"
                  >
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-violet-300">Add a subheading</div>
                      <div className="text-[10px] text-white/40">Medium subtitle layer</div>
                    </div>
                    <Plus size={16} className="text-white/40 group-hover:text-white" />
                  </button>

                  <button
                    onClick={() => {
                      editor.addTextLayer();
                    }}
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
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Popular Presets</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "1:1 Square", w: 1080, h: 1080 },
                        { label: "9:16 Story", w: 1080, h: 1920 },
                        { label: "16:9 Landscape", w: 1280, h: 720 },
                        { label: "4:5 Portrait", w: 1080, h: 1350 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => editor.updateCanvasDimensions(p.w, p.h)}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 px-2.5 text-left text-[11px] font-semibold text-white/70 hover:border-violet-500/40 hover:bg-white/[0.06] hover:text-white transition"
                        >
                          <div>{p.label}</div>
                          <div className="text-[9px] text-white/40">{p.w}×{p.h}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DRAWER: YOUTUBE THUMBNAIL STUDIO */}
              {activeDrawer === 'thumbnail' && (
                <div className="space-y-4">
                  {/* YouTube 16:9 Quick Format */}
                  <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <Flame size={14} className="text-amber-400" />
                        <span>YouTube 16:9 Canvas</span>
                      </div>
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
          </div>
        )}
      </aside>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            editor.fileInserting(e.target.files);
          }
        }}
      />

      {/* Export Dialog Portal */}
      {isExportOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0d121d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Export Canvas</h3>
                <p className="text-xs text-white/50">Download high-resolution image</p>
              </div>
              <button
                onClick={() => setExportOpen(false)}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70">Filename</label>
                <input
                  type="text"
                  value={exportForm.filename}
                  onChange={(e) => setExportForm((prev) => ({ ...prev, filename: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as ExportFormatOption[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportForm((prev) => ({ ...prev, format: fmt }))}
                    className={`rounded-xl py-2 text-xs font-bold uppercase transition ${
                      exportForm.format === fmt
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'border border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {qualitySupported && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/70 mb-1">
                    <span>Quality</span>
                    <span className="text-violet-400">{Math.round(exportForm.quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={exportForm.quality}
                    onChange={(e) => setExportForm((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs font-semibold text-white/70 mb-1">
                  <span>Resolution Scale</span>
                  <span className="text-violet-400">{exportForm.multiplier}x</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setExportForm((prev) => ({ ...prev, multiplier: scale }))}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                        exportForm.multiplier === scale
                          ? 'border border-violet-500 bg-violet-600/20 text-violet-300'
                          : 'border border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setExportOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    editor.exportCanvas(exportForm);
                    setExportOpen(false);
                    toast.success("Canvas exported successfully!");
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:brightness-110 transition"
                >
                  Download Image
                </button>
              </div>

              <button
                onClick={() => {
                  editor.bulkExportAsZip();
                  setExportOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 py-2.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 transition"
              >
                <FolderArchive size={14} />
                <span>Export All Layers (ZIP Archive)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Insert Image Modal */}
      {imageModalOpen && createPortal(
        <InsertImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onUrlInsert={editor.insertImageFromUrl}
          onFileUpload={() => fileInputRef.current?.click()}
        />,
        document.body
      )}
    </>
  );
}
