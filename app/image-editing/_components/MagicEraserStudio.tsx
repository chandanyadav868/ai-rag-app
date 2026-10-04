"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Wand2, 
  X, 
  RotateCcw, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Brush, 
  Eraser, 
  Sparkles, 
  Loader2, 
  Sliders, 
  Eye, 
  Cpu, 
  Zap,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { FabricImage } from 'fabric';
import { useMagicEraser } from '../_hooks/useMagicEraser';

interface MagicEraserStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | null;
  mainFabricCanvas: any;
  onApply: (newSrc: string) => void;
}

export function MagicEraserStudio({
  isOpen,
  onClose,
  selectedId,
  mainFabricCanvas,
  onApply
}: MagicEraserStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  // Magic eraser neural hook
  const { status, isProcessing, progressMessage, deviceType, inpaint } = useMagicEraser();

  // State
  const [brushSize, setBrushSize] = useState<number>(32);
  const [brushMode, setBrushMode] = useState<'paint' | 'unmask'>('paint');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [inpaintedResult, setInpaintedResult] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);

  // Track cursor position for custom brush ring
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Load the selected Fabric image
  useEffect(() => {
    if (!isOpen || !mainFabricCanvas) return;

    let targetObj: any = null;
    if (selectedId) {
      targetObj = mainFabricCanvas.getObjects().find((o: any) => o.id === selectedId);
    }
    if (!targetObj) {
      targetObj = mainFabricCanvas.getActiveObject();
    }

    if (targetObj && targetObj.type === 'image') {
      const src = (targetObj as FabricImage).getSrc();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setSourceImage(img);
        setInpaintedResult(null);
        setHasMask(false);
        setMaskHistory([]);
        setPan({ x: 0, y: 0 });
      };
      img.src = src;
    } else {
      toast.error('Please select an image on the canvas to use Magic Eraser.');
      onClose();
    }
  }, [isOpen, selectedId, mainFabricCanvas, onClose]);

  // Render image onto imageCanvas
  useEffect(() => {
    if (!sourceImage || !imageCanvasRef.current || !maskCanvasRef.current) return;

    const imgCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;

    imgCanvas.width = w;
    imgCanvas.height = h;
    maskCanvas.width = w;
    maskCanvas.height = h;

    const ctx = imgCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    if (inpaintedResult && !showOriginal) {
      const inpaintImg = new Image();
      inpaintImg.onload = () => {
        ctx.drawImage(inpaintImg, 0, 0, w, h);
      };
      inpaintImg.src = inpaintedResult;
    } else {
      ctx.drawImage(sourceImage, 0, 0, w, h);
    }
  }, [sourceImage, inpaintedResult, showOriginal]);

  // Coordinate conversion helper
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!maskCanvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const scaleX = maskCanvasRef.current.width / rect.width;
    const scaleY = maskCanvasRef.current.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Save mask state for Undo
  const saveMaskStep = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    const state = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setMaskHistory(prev => [...prev.slice(-10), state]);
  }, []);

  // Drawing handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!maskCanvasRef.current) return;

    saveMaskStep();
    setIsDrawing(true);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    drawOnMask(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (!isDrawing) return;
    drawOnMask(coords.x, coords.y);
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      checkIfMaskExists();
    }
  };

  const drawOnMask = (x: number, y: number) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;

    ctx.save();
    if (brushMode === 'paint') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(244, 63, 94, 0.65)'; // Neon Pink / Rose
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    setHasMask(true);
  };

  const checkIfMaskExists = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    const data = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height).data;
    let found = false;
    for (let i = 3; i < data.length; i += 40) {
      if (data[i] > 10) {
        found = true;
        break;
      }
    }
    setHasMask(found);
  };

  const clearMask = () => {
    if (!maskCanvasRef.current) return;
    saveMaskStep();
    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setHasMask(false);
  };

  const undoMask = () => {
    if (maskHistory.length === 0 || !maskCanvasRef.current) return;
    const prevState = maskHistory[maskHistory.length - 1];
    setMaskHistory(prev => prev.slice(0, -1));

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(prevState, 0, 0);
    checkIfMaskExists();
  };

  // Run inpainting
  const handleInpaint = async () => {
    if (!sourceImage || !maskCanvasRef.current) return;
    if (!hasMask) {
      toast.error('Please brush over the object or watermark you want to erase.');
      return;
    }

    try {
      const activeSource = (inpaintedResult ? imageCanvasRef.current : sourceImage) as any;
      const resultDataUrl = await inpaint(activeSource, maskCanvasRef.current);
      setInpaintedResult(resultDataUrl);
      clearMask();
      toast.success('Object cleanly erased and background restored!');
    } catch (err: any) {
      console.error(err);
      toast.error('Inpainting failed. Please try again.');
    }
  };

  // Commit result back to canvas layer
  const handleApply = () => {
    if (inpaintedResult) {
      onApply(inpaintedResult);
      toast.success('Updated layer with restored image.');
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-2xl text-white select-none animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-pink-200">
                Magic Eraser Studio
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                <Sparkles className="w-3 h-3" /> Neural Inpaint
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Brush over photobombers, wires, or watermarks to seamlessly restore the background
            </p>
          </div>
        </div>

        {/* Hardware & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{deviceType === 'webgpu' ? 'WebGPU Accelerated' : 'WASM SIMD Engine'}</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-1 text-slate-300">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(3, z + 0.2))} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewport & Canvas Area */}
      <main 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { setIsDrawing(false); setCursorPos(null); }}
        className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-4 cursor-crosshair touch-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div 
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-slate-900"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            maxWidth: '90vw',
            maxHeight: '75vh'
          }}
        >
          {/* Base Image Canvas */}
          <canvas 
            ref={imageCanvasRef} 
            className="block max-w-full max-h-[72vh] object-contain pointer-events-none" 
          />

          {/* Mask Drawing Overlay Canvas */}
          <canvas 
            ref={maskCanvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none" 
          />
        </div>

        {/* Custom Brush Ring Cursor */}
        {cursorPos && (
          <div 
            className="fixed pointer-events-none rounded-full border-2 border-pink-400 bg-pink-500/20 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_12px_rgba(244,63,94,0.5)] z-50 transition-[width,height] duration-75"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              width: `${brushSize * zoom}px`,
              height: `${brushSize * zoom}px`
            }}
          />
        )}

        {/* Processing Indicator Badge */}
        {isProcessing && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-pink-300 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
            <span className="text-sm font-semibold">{progressMessage || 'Synthesizing neural inpaint...'}</span>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl shrink-0 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brush Tools */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Brush / Unmask Mode */}
          <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setBrushMode('paint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                brushMode === 'paint' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brush className="w-3.5 h-3.5" />
              <span>Paint Mask</span>
            </button>
            <button
              onClick={() => setBrushMode('unmask')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                brushMode === 'unmask' 
                  ? 'bg-white/20 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Un-mask</span>
            </button>
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 hidden sm:inline">Size:</span>
            <input
              type="range"
              min="8"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 sm:w-32 accent-pink-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-pink-300 w-7">{brushSize}px</span>
          </div>

          {/* Undo Mask Stroke */}
          <button
            onClick={undoMask}
            disabled={maskHistory.length === 0}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Undo Mask Stroke"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Clear Mask */}
          {hasMask && (
            <button
              onClick={clearMask}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Before / After toggle if inpainted */}
          {inpaintedResult && (
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 active:scale-95 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hold for Before</span>
            </button>
          )}

          {/* Erase Object Button */}
          <button
            onClick={handleInpaint}
            disabled={!hasMask || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Erasing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Erase Object</span>
              </>
            )}
          </button>

          {/* Apply to Canvas */}
          <button
            onClick={handleApply}
            disabled={!inpaintedResult}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Layer</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
