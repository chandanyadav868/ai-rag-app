"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Check, 
  Upload, 
  Link as LinkIcon, 
  Clipboard, 
  Move, 
  Maximize2, 
  Layers, 
  Image as ImageIcon,
  Loader2,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { Canvas, FabricImage, FabricObject, Point, Rect, util } from 'fabric';
import { toast } from 'sonner';

interface MaskStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | null;
  mainFabricCanvas: React.MutableRefObject<Canvas | null>;
  onApply: (maskDataUrl: string, options: { left: number, top: number, scaleX: number, scaleY: number, angle: number }) => void;
  assets?: { id: string, src: string, name: string }[];
}

export function MaskStudio({ isOpen, onClose, selectedId, mainFabricCanvas, onApply, assets }: MaskStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const studioCanvasRef = useRef<Canvas | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [maskLoaded, setMaskLoaded] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'paste' | 'assets'>('upload');
  const [url, setUrl] = useState('');

  // Initialization
  useEffect(() => {
    if (!isOpen || !canvasElementRef.current || !mainFabricCanvas.current || !selectedId) return;

    const mainCanvas = mainFabricCanvas.current;
    const targetObject = mainCanvas.getObjects().find(obj => (obj as any).id === selectedId);
    
    if (!targetObject) {
      toast.error("Could not find layer to mask.");
      onClose();
      return;
    }

    // Initialize Studio Canvas
    const studioCanvas = new Canvas(canvasElementRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#050c17',
    });
    studioCanvasRef.current = studioCanvas;

    // Clone target object for preview
    targetObject.clone().then((cloned) => {
      cloned.set({
        selectable: false,
        evented: false,
        opacity: 0.5, // Ghosting effect
        left: studioCanvas.width! / 2,
        top: studioCanvas.height! / 2,
        originX: 'center',
        originY: 'center',
      });
      studioCanvas.add(cloned);
      (studioCanvas as any).targetLayer = cloned;
      
      // Add a workspace bounds rect
      const bounds = new Rect({
        width: cloned.getScaledWidth(),
        height: cloned.getScaledHeight(),
        left: cloned.left,
        top: cloned.top,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#22d3ee',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      studioCanvas.add(bounds);
      
      studioCanvas.renderAll();
    });

    // Handle Deletion inside Studio
    const handleStudioKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = studioCanvas.getActiveObject();
        if (active && (active as any).isMaskSource) {
          studioCanvas.remove(active);
          setMaskLoaded(false);
          studioCanvas.renderAll();
          
          // Also reset the target layer's clipPath if it was previewing
          const target = (studioCanvas as any).targetLayer as FabricObject;
          if (target) {
            target.set({ clipPath: undefined, opacity: 0.5 });
            studioCanvas.renderAll();
          }
        }
      }
    };
    window.addEventListener('keydown', handleStudioKeyDown);

    // Handle Ctrl+V inside Studio
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (ev) => loadMaskImage(ev.target?.result as string);
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);

    // Mouse Wheel Zoom
    studioCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = studioCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      setViewportScale(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      window.removeEventListener('keydown', handleStudioKeyDown);
      window.removeEventListener('paste', handleGlobalPaste);
      studioCanvas.dispose();
      studioCanvasRef.current = null;
    };
  }, [isOpen, selectedId]);

  // Handle Zoom
  useEffect(() => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;

    canvas.setZoom(viewportScale);
    canvas.requestRenderAll();
  }, [viewportScale]);

  const loadMaskImage = async (dataUrl: string) => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;

    setLoading(true);
    try {
      const maskImg = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
      
      // Remove existing mask if any
      const existingMask = studioCanvas.getObjects().find(obj => (obj as any).isMaskSource);
      if (existingMask) studioCanvas.remove(existingMask);

      (maskImg as any).isMaskSource = true;
      (maskImg as any).originalDataUrl = dataUrl;
      
      const target = (studioCanvas as any).targetLayer as FabricObject;
      if (target) {
        const scale = Math.min(target.getScaledWidth() / maskImg.width!, target.getScaledHeight() / maskImg.height!);
        maskImg.set({
          scaleX: scale,
          scaleY: scale,
          left: target.left,
          top: target.top,
          originX: 'center',
          originY: 'center',
          opacity: 0.6, // Overlay opacity
          cornerColor: '#22d3ee',
          cornerStyle: 'circle',
          borderColor: '#22d3ee',
          transparentCorners: false,
          hasBorders: true,
        });
      }

      studioCanvas.add(maskImg);
      studioCanvas.setActiveObject(maskImg);
      studioCanvas.renderAll();
      setMaskLoaded(true);
    } catch (err) {
      toast.error("Failed to load mask image.");
    } finally {
      setLoading(false);
    }
  };

  const extractAlphaMask = () => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;

    const maskObject = studioCanvas.getObjects().find(obj => (obj as any).isMaskSource) as FabricImage;
    if (!maskObject) return;

    setLoading(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgElement = maskObject.getElement() as HTMLImageElement;

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx?.drawImage(imgElement, 0, 0);

    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    if (imageData) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Threshold: If pixel is light (avg > 100), make it transparent
        const avg = (r + g + b) / 3;
        if (avg > 120) {
          data[i + 3] = 0;
        } else {
          // Boost contrast for the dark parts
          data[i + 3] = 255;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
      ctx?.putImageData(imageData, 0, 0);
      loadMaskImage(canvas.toDataURL());
    }
    setLoading(false);
  };

  const handleApply = async () => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;

    const maskObject = studioCanvas.getObjects().find(obj => (obj as any).isMaskSource) as FabricImage;
    const targetObject = (studioCanvas as any).targetLayer as FabricObject;

    if (!maskObject || !targetObject) {
      toast.error("Please add a mask image first.");
      return;
    }

    // Calculate relative coordinates for the clipPath
    // In Fabric, clipPath origin is (0,0) at the center of the object.
    // We calculate the difference between mask center and target center in world space,
    // then divide by the target's current scale to get the local offset.
    const relativeLeft = (maskObject.left! - targetObject.left!) / (targetObject.scaleX || 1);
    const relativeTop = (maskObject.top! - targetObject.top!) / (targetObject.scaleY || 1);

    // Use the original source to avoid quality loss and double scaling
    const maskDataUrl = (maskObject as any).originalDataUrl || maskObject.toDataURL();
    
    onApply(maskDataUrl, {
      left: relativeLeft,
      top: relativeTop,
      scaleX: maskObject.scaleX!,
      scaleY: maskObject.scaleY!,
      angle: maskObject.angle!
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/95 backdrop-blur-md p-6">
      <div className="flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[40px] border border-white/10 bg-[#0a182b] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-cyan-500/20 p-3 text-cyan-400">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Mask Studio</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">Adjust mask position and scale</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleApply} 
              className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-cyan-400 active:scale-95"
            >
              <Check size={18} />
              Apply Mask
            </button>
            <button 
              onClick={onClose} 
              className="rounded-2xl bg-white/5 p-3 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Controls */}
          <div className="w-80 border-r border-white/5 p-8 overflow-y-auto historyScrollbar">
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50">1. Select Mask Source</label>
              <div className="mt-4 flex gap-1 rounded-2xl bg-white/5 p-1">
                {(['upload', 'url', 'paste', 'assets'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-xl py-2 text-[9px] font-black uppercase transition ${activeTab === tab ? 'bg-white text-slate-950' : 'text-white/40 hover:bg-white/5'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {activeTab === 'assets' && (
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto historyScrollbar pr-1">
                    {assets && assets.length > 0 ? (
                      assets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => loadMaskImage(asset.src)}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20 transition hover:border-cyan-400/50"
                        >
                          <img src={asset.src} alt={asset.name} className="h-full w-full object-cover opacity-60 transition group-hover:opacity-100" />
                          <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/0 transition group-hover:bg-cyan-500/20">
                            <Plus size={14} className="text-white opacity-0 transition group-hover:opacity-100" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center">
                        <p className="text-[10px] text-white/20 font-bold uppercase">No assets found</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'upload' && (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 transition hover:border-cyan-500/40 hover:bg-cyan-500/5">
                    <Upload size={20} className="mb-2 text-white/20" />
                    <span className="text-[11px] font-bold text-white/60">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => loadMaskImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                )}
                {activeTab === 'url' && (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste URL..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400/40"
                    />
                    <button onClick={() => loadMaskImage(url)} className="w-full rounded-2xl bg-white/10 py-3 text-[11px] font-bold text-white transition hover:bg-white/20">Fetch Image</button>
                  </div>
                )}
                {activeTab === 'paste' && (
                  <button 
                    onClick={async () => {
                      try {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                          for (const type of item.types) {
                            if (type.startsWith('image/')) {
                              const blob = await item.getType(type);
                              const reader = new FileReader();
                              reader.onload = (ev) => loadMaskImage(ev.target?.result as string);
                              reader.readAsDataURL(blob);
                              return;
                            }
                          }
                        }
                        toast.error("No image in clipboard.");
                      } catch (e) { toast.error("Paste failed."); }
                    }}
                    className="flex w-full h-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 transition hover:bg-emerald-500/5 hover:border-emerald-500/40"
                  >
                    <Clipboard size={20} className="mb-2 text-emerald-400/40" />
                    <span className="text-[11px] font-bold text-emerald-400/60">Paste Image</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50">2. Adjust Settings</label>
              <div className="mt-4 space-y-4">
                {/* Opacity Slider */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Mask Opacity</span>
                    <span className="text-[10px] font-bold text-cyan-400 tabular-nums">70%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    defaultValue="0.7"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const studioCanvas = studioCanvasRef.current;
                      const mask = studioCanvas?.getObjects().find(obj => (obj as any).isMaskSource);
                      if (mask) {
                        mask.set('opacity', val);
                        studioCanvas?.renderAll();
                      }
                    }}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Move size={14} className="text-white/20" />
                    <span className="text-xs font-bold text-white/60">Positioning</span>
                  </div>
                  <span className="text-[10px] text-white/30 italic">Drag mask</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-white/20" />
                    <span className="text-xs font-bold text-white/60">Resizing</span>
                  </div>
                  <span className="text-[10px] text-white/30 italic">Drag corners</span>
                </div>
                
                <button 
                  onClick={extractAlphaMask}
                  disabled={!maskLoaded || loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-3 text-[11px] font-black uppercase text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-30 disabled:grayscale"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Auto-Extract Mask (Remove BG)
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3">
                <ImageIcon size={18} className="text-cyan-400" />
                <span className="text-sm font-black text-white">How it works</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/40 font-medium">
                The bright blue dashed line represents your layer. The semi-transparent image is your mask. Only parts of your layer that overlap with the mask will remain visible.
              </p>
            </div>
          </div>

          {/* Main Studio Viewport */}
          <div className="relative flex-1 bg-[#050c17] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-2xl">
                <canvas ref={canvasElementRef} />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-black/60 px-6 py-3 backdrop-blur-xl">
              <button onClick={() => setViewportScale(prev => Math.max(0.1, prev - 0.1))} className="text-white/40 hover:text-white transition"><Minus size={18} /></button>
              <div className="text-[10px] font-black text-white/60 tabular-nums w-12 text-center">{Math.round(viewportScale * 100)}%</div>
              <button onClick={() => setViewportScale(prev => prev + 0.1)} className="text-white/40 hover:text-white transition"><Plus size={18} /></button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <button onClick={() => setViewportScale(1)} className="text-white/40 hover:text-white transition"><RefreshCw size={16} /></button>
            </div>

            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-cyan-400" size={48} />
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Loading Mask...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
