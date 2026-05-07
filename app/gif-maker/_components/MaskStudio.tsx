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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'paste' | 'assets'>('upload');
  const [url, setUrl] = useState('');

  // Initialization
  useEffect(() => {
    if (!isOpen || !canvasElementRef.current || !mainFabricCanvas.current || !selectedId) return;

    const mainCanvas = mainFabricCanvas.current;
    const targetObject = mainCanvas.getObjects().find(obj =>
      (obj as any).id === selectedId || (obj as any).get?.('id') === selectedId
    );

    if (!targetObject) {
      console.warn("Mask Studio: Target object not found.", selectedId);
      toast.error("Could not find layer to mask.");
      onClose();
      return;
    }

    // Initialize with container dimensions
    const container = containerRef.current;
    if (!container) return;

    const stageWidth = container.clientWidth;
    const stageHeight = container.clientHeight;

    const studioCanvas = new Canvas(canvasElementRef.current, {
      width: stageWidth,
      height: stageHeight,
      backgroundColor: '#050c17',
    });
    studioCanvasRef.current = studioCanvas;

    // Clone target object for preview
    targetObject.clone().then((cloned) => {
      // Calculate fit scale for the clone to start comfortably
      const fitScale = Math.min(
        (stageWidth * 0.8) / cloned.getScaledWidth(),
        (stageHeight * 0.8) / cloned.getScaledHeight(),
        1
      );

      cloned.set({
        selectable: false,
        evented: false,
        opacity: 0.5,
        left: stageWidth / 2,
        top: stageHeight / 2,
        originX: 'center',
        originY: 'center',
        scaleX: cloned.scaleX! * fitScale,
        scaleY: cloned.scaleY! * fitScale,
      });

      studioCanvas.add(cloned);
      (studioCanvas as any).targetLayer = cloned;

      // Add workspace bounds rect
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
      (studioCanvas as any).workspaceBounds = bounds;

      studioCanvas.renderAll();
    });

    const handleResize = () => {
      const container = containerRef.current;
      if (!studioCanvasRef.current || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      studioCanvasRef.current.setDimensions({ width, height });
      studioCanvasRef.current.renderAll();
    };
    window.addEventListener('resize', handleResize);

    // Initial Resize to fit container
    setTimeout(handleResize, 100);

    // Panning Logic
    let isDragging = false;
    let isSpaceDown = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        isSpaceDown = true;
        if (studioCanvasRef.current) studioCanvasRef.current.defaultCursor = 'grab';
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDown = false;
        if (studioCanvasRef.current) studioCanvasRef.current.defaultCursor = 'default';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    studioCanvas.on('mouse:down', (opt) => {
      const evt = opt.e as any;
      const target = opt.target;

      // Pan if: Space is held OR middle click OR no mask is targeted
      const isMask = target && (target as any).isMaskSource;
      if (isSpaceDown || evt.button === 1 || !isMask) {
        isDragging = true;
        studioCanvas.selection = false;
        lastPosX = evt.clientX || evt.touches?.[0]?.clientX;
        lastPosY = evt.clientY || evt.touches?.[0]?.clientY;
        studioCanvas.defaultCursor = 'grabbing';
      }
    });

    studioCanvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const evt = opt.e as any;
        const currentX = evt.clientX || evt.touches?.[0]?.clientX;
        const currentY = evt.clientY || evt.touches?.[0]?.clientY;

        const vpt = studioCanvas.viewportTransform!;
        vpt[4] += currentX - lastPosX;
        vpt[5] += currentY - lastPosY;

        studioCanvas.requestRenderAll();
        lastPosX = currentX;
        lastPosY = currentY;
      }
    });

    studioCanvas.on('mouse:up', () => {
      isDragging = false;
      studioCanvas.selection = true;
      studioCanvas.defaultCursor = isSpaceDown ? 'grab' : 'default';
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
      if (zoom > 10) zoom = 10;
      if (zoom < 0.05) zoom = 0.05;

      setViewportScale(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      window.removeEventListener('keydown', handleStudioKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('resize', handleResize);
      studioCanvas.dispose();
      studioCanvasRef.current = null;
    };
  }, [isOpen, selectedId]);

  // Handle Zoom
  useEffect(() => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;

    const zoom = viewportScale;
    canvas.zoomToPoint(new Point(canvas.width! / 2, canvas.height! / 2), zoom);
    canvas.requestRenderAll();
  }, [viewportScale]);

  const resetView = () => {
    const canvas = studioCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const stageWidth = container.clientWidth;
    const stageHeight = container.clientHeight;
    const target = (canvas as any).targetLayer as FabricObject;

    if (target) {
      setViewportScale(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      target.set({
        left: stageWidth / 2,
        top: stageHeight / 2
      });

      const bounds = (canvas as any).workspaceBounds as FabricObject;
      if (bounds) {
        bounds.set({
          left: target.left,
          top: target.top
        });
      }
    }

    canvas.renderAll();
  };

  const loadMaskImage = async (dataUrl: string) => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;

    setLoading(true);
    try {
      // 1. Attempt direct load first (highest performance)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });

      let loadedImg: HTMLImageElement;
      try {
        loadedImg = await loadImg(dataUrl);
      } catch (err) {
        console.warn("Direct image load failed (CORS), trying proxy fallback...");
        // 2. Fallback to a CORS proxy if direct load fails
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(dataUrl)}`;
        loadedImg = await loadImg(proxyUrl);
      }

      const maskImg = new FabricImage(loadedImg);

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
    const relativeLeft = (maskObject.left! - targetObject.left!) / (targetObject.scaleX || 1);
    const relativeTop = (maskObject.top! - targetObject.top!) / (targetObject.scaleY || 1);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/95 backdrop-blur-md p-2 md:p-6">
      <div className="flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[40px] border border-white/10 bg-[#0a182b] shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 bg-[#0a182b] px-6 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className="hidden sm:flex rounded-2xl bg-cyan-500/20 p-2.5 md:p-3 text-cyan-400 shrink-0">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-black text-white truncate">Mask Studio</h3>
              <p className="hidden xs:block text-[10px] font-bold uppercase tracking-widest text-white/40 truncate">Refine your mask</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-4">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 rounded-xl md:rounded-2xl bg-cyan-500 px-4 py-2.5 md:px-6 md:py-3 text-xs md:text-sm font-black text-white shadow-lg transition hover:bg-cyan-400 active:scale-95 whitespace-nowrap"
            >
              <Check size={18} className="hidden sm:block" />
              Apply
            </button>
            <button
              onClick={onClose}
              className="rounded-xl md:rounded-2xl bg-white/5 p-2.5 md:p-3 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Open Sidebar Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute left-6 top-6 z-50 flex h-14 w-14 items-center justify-center rounded-[24px] border border-white/10 bg-[#09182b]/90 text-white shadow-2xl backdrop-blur-xl transition-all hover:bg-cyan-500 hover:text-black animate-in fade-in zoom-in duration-300"
              title="Open Controls"
            >
              <ImageIcon size={24} />
            </button>
          )}

          {/* Floating Sidebar */}
          <aside className={`absolute w-full top-6 z-40 w-72 rounded-[32px] border border-white/10 bg-[#09182b]/95 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <div className='rounded-2xl bg-cyan-400/15 p-3 text-cyan-100'>
                  <Layers size={18} />
                </div>
                <div>
                  <div className='text-sm font-semibold text-white'>Mask Tools</div>
                  <div className='text-[10px] uppercase tracking-widest text-white/40'>Controls</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className='p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all'
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto historyScrollbar pr-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50">1. Select Mask Source</label>
                <div className="mt-4 flex gap-1 rounded-2xl bg-white/5 p-1">
                  {(['upload', 'url', 'paste', 'assets'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-xl py-2 text-[9px] font-black uppercase transition ${activeTab === tab ? 'bg-white text-slate-950 shadow-lg' : 'text-white/40 hover:bg-white/5'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {activeTab === 'assets' && (
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto historyScrollbar pr-1">
                      {assets && assets.length > 0 ? (
                        assets.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => loadMaskImage(asset.src)}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20 transition hover:border-cyan-400/50"
                          >
                            <img src={asset.src} alt={asset.name} className="h-full w-full object-cover opacity-60 transition group-hover:opacity-100" />
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 py-6 text-center text-[10px] text-white/20 font-bold uppercase">No assets</div>
                      )}
                    </div>
                  )}
                  {activeTab === 'upload' && (
                    <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/10 bg-white/5 transition hover:border-cyan-500/40 hover:bg-cyan-500/5">
                      <Upload size={18} className="mb-1 text-white/20" />
                      <span className="text-[10px] font-bold text-white/60">Upload</span>
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
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste URL..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400/40"
                      />
                      <button onClick={() => loadMaskImage(url)} className="rounded-xl bg-white/10 py-2.5 text-[10px] font-bold text-white transition hover:bg-white/20 uppercase">Fetch</button>
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
                      className="flex w-full h-24 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/10 bg-white/5 transition hover:bg-emerald-500/5 hover:border-emerald-500/40"
                    >
                      <Clipboard size={18} className="mb-1 text-emerald-400/40" />
                      <span className="text-[10px] font-bold text-emerald-400/60">Paste</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50">2. Adjust Settings</label>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Opacity</span>
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

                  <button
                    onClick={extractAlphaMask}
                    disabled={!maskLoaded || loading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-4 text-[10px] font-black uppercase text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-30 disabled:grayscale"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Auto-Extract Mask
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section ref={containerRef} className="relative flex-1 bg-[#050c17] overflow-hidden">
            <div className="absolute inset-0">
              <canvas ref={canvasElementRef} />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-black/60 px-6 py-3 backdrop-blur-xl z-50">
              <button onClick={() => setViewportScale(prev => Math.max(0.1, prev - 0.1))} className="text-white/40 hover:text-white transition"><Minus size={18} /></button>
              <div className="text-[10px] font-black text-white/60 tabular-nums w-12 text-center">{Math.round(viewportScale * 100)}%</div>
              <button onClick={() => setViewportScale(prev => prev + 0.1)} className="text-white/40 hover:text-white transition"><Plus size={18} /></button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <button onClick={() => setViewportScale(1)} className="text-white/40 hover:text-white transition"><RefreshCw size={16} /></button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <button
                onClick={resetView}
                title="Reset View"
                className="text-cyan-400 hover:text-cyan-300 transition"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-cyan-400" size={48} />
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Loading Mask...</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
