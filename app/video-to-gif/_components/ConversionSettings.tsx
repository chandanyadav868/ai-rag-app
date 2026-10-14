"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Gauge,
  Maximize2,
  Zap,
  Type,
  Loader2,
  Sparkles,
  Sticker,
  Plus,
  Trash2,
  Move,
  Upload,
  Palette,
  Sliders,
  Check,
  XCircle,
} from 'lucide-react';
import { useVideoToGif } from '../_hooks/useVideoToGif';
import { getAllLocalAssets, storeLocalAsset } from '@/lib/persistent-storage';
import { toast } from 'sonner';

interface ConversionSettingsProps {
  engine: ReturnType<typeof useVideoToGif>;
}

interface SavedAsset {
  id: string;
  src: string;
  name: string;
}

// Built-in high-definition pure vector stickers with explicit dimensions & viewBox
const BUILTIN_STICKERS = [
  {
    name: 'Red Arrow',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M15 45 L65 45 L65 20 L108 60 L65 100 L65 75 L15 75 Z" fill="#ef4444" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/></svg>'
    )}`,
  },
  {
    name: 'VS Battle',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="70" viewBox="0 0 140 70"><defs><linearGradient id="vsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs><rect x="5" y="5" width="130" height="60" rx="14" fill="url(#vsg)" stroke="#ffffff" stroke-width="5"/><text x="70" y="47" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-style="italic" font-size="38" fill="#ffffff" text-anchor="middle">VS</text></svg>'
    )}`,
  },
  {
    name: 'DISS',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="70" viewBox="0 0 140 70"><rect x="5" y="5" width="130" height="60" rx="14" fill="#000000" stroke="#f43f5e" stroke-width="5"/><text x="70" y="47" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#f43f5e" text-anchor="middle">DISS</text></svg>'
    )}`,
  },
  {
    name: 'Fire',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="fireg" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#f97316"/><stop offset="50%" stop-color="#ef4444"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><path d="M50 5 C50 5 62 25 55 40 C60 30 72 38 72 52 C72 75 55 95 38 85 C25 76 25 58 35 48 C38 45 40 40 38 35 C32 45 20 60 25 75 C18 68 15 55 22 42 C30 25 50 5 50 5 Z" fill="url(#fireg)" stroke="#ffffff" stroke-width="3"/></svg>'
    )}`,
  },
  {
    name: 'Alert',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,10 92,85 8,85" fill="#facc15" stroke="#000000" stroke-width="6" stroke-linejoin="round"/><rect x="46" y="38" width="8" height="24" rx="3" fill="#000000"/><circle cx="50" cy="72" r="5" fill="#000000"/></svg>'
    )}`,
  },
  {
    name: 'Shock',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="55,5 20,55 48,55 35,95 85,42 55,42" fill="#facc15" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/></svg>'
    )}`,
  },
  {
    name: '100%',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#dc2626" stroke="#ffffff" stroke-width="5"/><text x="50" y="60" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">100</text><line x1="22" y1="72" x2="78" y2="72" stroke="#ffffff" stroke-width="4"/></svg>'
    )}`,
  },
  {
    name: 'Target',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#ef4444" stroke="#ffffff" stroke-width="4"/><circle cx="50" cy="50" r="32" fill="#ffffff"/><circle cx="50" cy="50" r="20" fill="#ef4444"/><circle cx="50" cy="50" r="8" fill="#ffffff"/></svg>'
    )}`,
  },
  {
    name: 'Crown',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="12,78 22,30 42,55 50,20 58,55 78,30 88,78" fill="#facc15" stroke="#b45309" stroke-width="4" stroke-linejoin="round"/><rect x="12" y="78" width="76" height="12" rx="3" fill="#eab308" stroke="#b45309" stroke-width="3"/></svg>'
    )}`,
  },
  {
    name: 'Boom',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><polygon points="10,40 25,18 45,28 60,8 75,28 95,18 110,40 100,58 112,72 88,68 75,80 60,68 45,80 32,68 8,72 20,58" fill="#f97316" stroke="#ffffff" stroke-width="4"/><text x="60" y="49" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">BOOM!</text></svg>'
    )}`,
  },
];

// Clean viral typography presets with balanced stroke widths
const TYPOGRAPHY_PRESETS = [
  {
    label: '🇮🇳 Hindi Breaking News',
    name: 'Hindi News',
    text: 'बड़ी खबर!',
    fontFamily: 'Mukta',
    fontSize: 32,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2.5,
    backgroundColor: '#dc2626',
  },
  {
    label: '⚡ Viral Yellow Hook',
    name: 'Yellow Shock',
    text: 'WAIT FOR END 😱',
    fontFamily: 'Anton',
    fontSize: 30,
    fill: '#facc15',
    stroke: '#000000',
    strokeWidth: 2.5,
    backgroundColor: 'transparent',
  },
  {
    label: '🥊 VS Battle Tag',
    name: 'VS Tag',
    text: 'ROUND 1 • FIGHT',
    fontFamily: 'Bebas Neue',
    fontSize: 28,
    fill: '#ffffff',
    stroke: '#ef4444',
    strokeWidth: 2,
    backgroundColor: '#000000cc',
  },
  {
    label: '💥 Classic Meme Hook',
    name: 'POV Meme',
    text: 'POV: ME WHEN...',
    fontFamily: 'Anton',
    fontSize: 28,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2.5,
    backgroundColor: 'transparent',
  },
  {
    label: '💎 Modern Frosted Pill',
    name: 'Cyan Pill',
    text: 'WATCH THIS 🚀',
    fontFamily: 'Poppins',
    fontSize: 24,
    fill: '#22d3ee',
    stroke: '#000000',
    strokeWidth: 1.5,
    backgroundColor: '#0f172acc',
  },
  {
    label: '🚨 Alert Banner',
    name: 'Breaking Alert',
    text: 'ATTENTION ⚠️',
    fontFamily: 'Bebas Neue',
    fontSize: 30,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    backgroundColor: '#b91c1c',
  },
];

const AVAILABLE_FONTS = [
  'Anton',
  'Bebas Neue',
  'Mukta',
  'Poppins',
  'Oswald',
  'Hind',
  'Rozha One',
  'Arial',
  'Impact',
];

export function ConversionSettings({ engine }: ConversionSettingsProps) {
  const {
    fps,
    setFps,
    targetWidth,
    setTargetWidth,
    speed,
    setSpeed,
    conversionStage,
    progress,
    statusMessage,
    convertToGif,
    cancelConversion,
    videoMeta,
    selectedDuration,
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    addTextOverlay,
    addImageOverlay,
    updateOverlay,
    removeOverlay,
  } = engine;

  const [activeTab, setActiveTab] = useState<'typography' | 'stickers' | 'settings'>('typography');
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  const isConverting = conversionStage === 'extracting' || conversionStage === 'encoding';
  const estimatedFrames = Math.max(1, Math.round((selectedDuration / speed) * fps));

  // Load saved assets from IndexedDB (persistent-storage), localStorage, and Appwrite
  useEffect(() => {
    let isMounted = true;

    const loadAllAssets = async () => {
      const combined: SavedAsset[] = [];
      const seenIds = new Set<string>();

      // 1. Load from IndexedDB (stores the 68 assets from Image Editing!)
      try {
        const storedLocal = await getAllLocalAssets();
        for (const item of storedLocal) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            combined.push({
              id: item.id,
              src: URL.createObjectURL(item.blob),
              name: item.name || 'Saved Asset',
            });
          }
        }
      } catch (err) {
        console.warn('Could not load IndexedDB assets:', err);
      }

      // 2. Load from localStorage (polish_ai_assets)
      try {
        const rawAssets = localStorage.getItem('polish_ai_assets');
        if (rawAssets) {
          const parsed: SavedAsset[] = JSON.parse(rawAssets);
          for (const item of parsed) {
            if (!seenIds.has(item.id) && !seenIds.has(item.src)) {
              seenIds.add(item.id);
              combined.push(item);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load localStorage assets:', err);
      }

      // 3. Load from Appwrite (public assets)
      try {
        const { appwriteAssets } = await import('@/lib/appwrite-assets');
        const publicAssets = await appwriteAssets.listAssets();
        for (const item of publicAssets) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            combined.push({
              id: item.id,
              src: item.url,
              name: item.name,
            });
          }
        }
      } catch (err) {
        console.warn('Could not load Appwrite public assets:', err);
      }

      // 4. Load custom fonts
      try {
        const rawFonts = localStorage.getItem('polish_ai_custom_fonts');
        if (rawFonts) {
          const fonts = JSON.parse(rawFonts);
          setCustomFonts(fonts.map((f: any) => f.name || f));
        }
      } catch (err) {
        console.warn('Could not load custom fonts:', err);
      }

      if (isMounted) {
        setSavedAssets(combined);
      }
    };

    loadAllAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle uploading custom asset / sticker and persisting to IndexedDB & localStorage
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    try {
      // 1. Persist to IndexedDB so it's accessible across image-editing, gif-maker, and video-to-gif
      const storedId = await storeLocalAsset(file, file.name);
      const blobUrl = URL.createObjectURL(file);

      const newAsset: SavedAsset = {
        id: storedId,
        src: blobUrl,
        name: file.name.replace(/\.[^/.]+$/, ''),
      };

      const updated = [newAsset, ...savedAssets];
      setSavedAssets(updated);

      // 2. Also keep in localStorage metadata
      try {
        localStorage.setItem(
          'polish_ai_assets',
          JSON.stringify(updated.map((a) => ({ id: a.id, src: a.src, name: a.name })))
        );
      } catch {}

      // 3. Insert onto video away from center play button
      addImageOverlay(blobUrl, newAsset.name);
      toast.success('Sticker uploaded and added to video!');
    } catch (err) {
      console.error('Failed to store asset:', err);
      toast.error('Failed to save asset locally.');
    }
    e.target.value = '';
  };

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId);

  const fpsOptions = [
    { value: 5, label: '5 FPS', desc: 'Light' },
    { value: 10, label: '10 FPS', desc: 'Balanced' },
    { value: 15, label: '15 FPS', desc: 'Smooth' },
    { value: 20, label: '20 FPS', desc: 'Fluid' },
    { value: 24, label: '24 FPS', desc: 'Cinematic' },
  ];

  const resolutionPresets = [
    { width: 320, label: '320p', desc: 'Small size' },
    { width: 480, label: '480p', desc: 'Standard' },
    { width: 640, label: '640p', desc: 'High Quality' },
    { width: videoMeta?.width || 800, label: 'Original', desc: `${videoMeta?.width || 0}px` },
  ];

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1.0x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2.0x' },
  ];

  const colorSwatches = [
    { label: 'White', color: '#ffffff' },
    { label: 'Yellow', color: '#facc15' },
    { label: 'Red', color: '#ef4444' },
    { label: 'Cyan', color: '#06b6d4' },
    { label: 'Green', color: '#22c55e' },
    { label: 'Pink', color: '#ec4899' },
    { label: 'Black', color: '#000000' },
  ];

  const strokeSwatches = [
    { label: 'Black', color: '#000000' },
    { label: 'White', color: '#ffffff' },
    { label: 'Red', color: '#ef4444' },
    { label: 'Yellow', color: '#facc15' },
    { label: 'None', color: 'transparent' },
  ];

  const backgroundStyles = [
    { label: 'None', value: 'transparent' },
    { label: 'Red Ribbon', value: '#dc2626' },
    { label: 'Dark Glass', value: '#000000cc' },
    { label: 'Yellow Box', value: '#facc15' },
    { label: 'Cyan Pill', value: '#0891b2' },
  ];

  const allAvailableFonts = Array.from(new Set([...AVAILABLE_FONTS, ...customFonts]));

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#09182b]/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 font-black text-xs">
            <Sliders size={14} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Studio Controls
          </h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'typography'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Type size={13} />
            <span>Viral Fonts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'stickers'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sticker size={13} />
            <span>Stickers & Assets ({savedAssets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Gauge size={13} />
            <span>GIF Settings</span>
          </button>
        </div>
      </div>

      {/* SELECTED OVERLAY LIVE EDITING TOOLBAR */}
      {selectedOverlay && (
        <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/40 bg-cyan-950/30 p-3.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Selected {selectedOverlay.type === 'text' ? 'Text Overlay' : 'Sticker'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateOverlay(selectedOverlay.id, { x: 50, y: 50 })}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-white/20 transition"
                title="Center on Video"
              >
                <Move size={10} />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => removeOverlay(selectedOverlay.id)}
                className="flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition"
                title="Delete Overlay"
              >
                <Trash2 size={10} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {selectedOverlay.type === 'text' ? (
            <div className="flex flex-col gap-3">
              {/* Text Content Input */}
              <input
                type="text"
                value={selectedOverlay.text || ''}
                onChange={(e) => updateOverlay(selectedOverlay.id, { text: e.target.value })}
                placeholder="Type overlay text here..."
                className="w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400 shadow-inner"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Font Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Font Family:</label>
                  <select
                    value={selectedOverlay.fontFamily || 'Anton'}
                    onChange={(e) => updateOverlay(selectedOverlay.id, { fontFamily: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-cyan-400"
                  >
                    {allAvailableFonts.map((font) => (
                      <option key={font} value={font} className="bg-slate-900 text-white">
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Scale Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/50">
                    <span>Size / Scale</span>
                    <span className="text-cyan-400">{Math.round((selectedOverlay.scale || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={selectedOverlay.scale || 1}
                    onChange={(e) => updateOverlay(selectedOverlay.id, { scale: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Color Swatches & Custom Picker */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Text Color:</label>
                <div className="flex flex-wrap items-center gap-2">
                  {colorSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => updateOverlay(selectedOverlay.id, { fill: swatch.color })}
                      className={`relative h-7 w-7 rounded-full border-2 transition hover:scale-110 active:scale-95 flex items-center justify-center ${
                        selectedOverlay.fill === swatch.color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.label}
                    >
                      {selectedOverlay.fill === swatch.color && (
                        <Check size={13} className={swatch.color === '#ffffff' || swatch.color === '#facc15' ? 'text-black' : 'text-white'} />
                      )}
                    </button>
                  ))}
                  {/* Custom Color Input */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="color"
                      value={selectedOverlay.fill || '#ffffff'}
                      onChange={(e) => updateOverlay(selectedOverlay.id, { fill: e.target.value })}
                      className="h-7 w-7 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
                      title="Custom Color"
                    />
                    <span className="text-[10px] text-white/50 font-mono uppercase">{selectedOverlay.fill || '#fff'}</span>
                  </div>
                </div>
              </div>

              {/* Text Outline / Stroke Control */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Stroke / Outline Color:</label>
                <div className="flex flex-wrap items-center gap-2">
                  {strokeSwatches.map((swatch) => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => updateOverlay(selectedOverlay.id, { 
                        stroke: swatch.color,
                        strokeWidth: swatch.color === 'transparent' ? 0 : (selectedOverlay.strokeWidth || 2)
                      })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        selectedOverlay.stroke === swatch.color
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {swatch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Ribbon / Pill Style */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Ribbon / Background Box:</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {backgroundStyles.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => updateOverlay(selectedOverlay.id, { backgroundColor: bg.value })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        selectedOverlay.backgroundColor === bg.value
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Selected Image Overlay Controls */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Sticker Size / Scale:</span>
                <span className="font-bold text-cyan-400">{Math.round((selectedOverlay.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.05"
                value={selectedOverlay.scale || 1}
                onChange={(e) => updateOverlay(selectedOverlay.id, { scale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 1: VIRAL TYPOGRAPHY & PRESETS */}
      {activeTab === 'typography' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">
              1-Click Viral Typography Presets
            </span>
            <button
              type="button"
              onClick={() => addTextOverlay({ text: 'NEW TEXT', fill: '#ffffff', stroke: '#000000', strokeWidth: 2, fontSize: 28 })}
              className="flex items-center gap-1 rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition active:scale-95 shadow-md"
            >
              <Plus size={13} />
              <span>Add Custom Text</span>
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TYPOGRAPHY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  addTextOverlay({
                    text: preset.text,
                    fontFamily: preset.fontFamily,
                    fontSize: preset.fontSize,
                    fill: preset.fill,
                    stroke: preset.stroke,
                    strokeWidth: preset.strokeWidth,
                    backgroundColor: preset.backgroundColor,
                  })
                }
                className="group relative flex flex-col items-start gap-1 p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition text-left active:scale-95 shadow-sm"
              >
                <span className="text-[11px] font-black text-white/90 group-hover:text-cyan-300 transition">
                  {preset.label}
                </span>
                <span
                  className="mt-1 text-xs font-black truncate max-w-full px-2 py-0.5 rounded shadow-sm"
                  style={{
                    fontFamily: `${preset.fontFamily}, sans-serif`,
                    color: preset.fill,
                    backgroundColor: preset.backgroundColor !== 'transparent' ? preset.backgroundColor : '#00000044',
                  }}
                >
                  {preset.text}
                </span>
                <span className="text-[9px] text-white/40 mt-0.5">Click to insert & drag</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS & ASSETS DRAWER */}
      {activeTab === 'stickers' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Header & Upload Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">
              Click any Sticker or Saved Asset to insert onto video
            </span>
            <input
              ref={assetFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleAssetUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => assetFileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 hover:text-black transition active:scale-95 shadow-sm"
            >
              <Upload size={13} />
              <span>Upload Sticker</span>
            </button>
          </div>

          {/* Trending Viral Built-in Stickers */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              Trending Viral Stickers:
            </label>
            <div className="grid grid-cols-3 xs:grid-cols-5 sm:grid-cols-5 gap-2">
              {BUILTIN_STICKERS.map((stk) => (
                <button
                  key={stk.name}
                  type="button"
                  onClick={() => addImageOverlay(stk.src, stk.name)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400 hover:bg-cyan-500/10 transition active:scale-95 group"
                  title={`Insert ${stk.name}`}
                >
                  <img
                    src={stk.src}
                    alt={stk.name}
                    className="h-10 w-10 object-contain drop-shadow group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[9px] font-bold text-white/60 group-hover:text-white mt-1 text-center truncate max-w-full">
                    {stk.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Assets from App Library (shared across Image Editing, GIF Maker & Video to GIF) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Saved Assets in Your Library ({savedAssets.length}):
              </label>
              {savedAssets.length === 0 && (
                <span className="text-[10px] text-white/30">Loading library...</span>
              )}
            </div>

            {savedAssets.length > 0 ? (
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto no-scrollbar p-1">
                {savedAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => addImageOverlay(asset.src, asset.name)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400 hover:bg-cyan-500/10 transition active:scale-95 group aspect-square"
                    title={`Insert ${asset.name}`}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="h-12 w-12 object-contain rounded drop-shadow group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-medium text-white/60 group-hover:text-white mt-1 truncate max-w-full">
                      {asset.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
                Upload your own transparent PNGs, emojis, or logos to use across all tools!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GIF CONVERSION SETTINGS (FPS, Resolution, Speed) */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Frame Rate (FPS) Selector */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
              <Gauge size={14} className="text-cyan-400" />
              <span>Frame Rate (Smoothness)</span>
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
              {fpsOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFps(opt.value)}
                  disabled={isConverting}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                    fps === opt.value
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-black">{opt.label}</span>
                  <span className="text-[9px] text-white/40 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Resolution Presets */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
              <Maximize2 size={14} className="text-cyan-400" />
              <span>GIF Dimensions & Resolution</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {resolutionPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTargetWidth(preset.width)}
                  disabled={isConverting}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                    targetWidth === preset.width
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-black">{preset.label}</span>
                  <span className="text-[9px] text-white/40 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Playback Speed Multiplier */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white/80">
              <Zap size={14} className="text-cyan-400" />
              <span>Playback Speed</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {speedOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpeed(opt.value)}
                  disabled={isConverting}
                  className={`flex-1 min-w-[50px] py-1.5 rounded-xl border text-xs font-bold text-center transition active:scale-95 ${
                    speed === opt.value
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversion Progress Bar & Status */}
      {isConverting && (
        <div className="flex flex-col gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3.5 shadow-lg animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span>{statusMessage}</span>
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={cancelConversion}
            className="self-end flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition"
          >
            <XCircle size={13} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Main Action CTA Button */}
      <button
        type="button"
        onClick={convertToGif}
        disabled={isConverting}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 py-3.5 px-6 font-black text-black shadow-xl shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? (
          <>
            <Loader2 size={18} className="animate-spin text-black" />
            <span>Converting Video to GIF...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Convert to Animated GIF</span>
          </>
        )}
      </button>
    </div>
  );
}
