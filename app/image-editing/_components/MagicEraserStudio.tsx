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
  Undo2,
  Search,
  ArrowRight,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { FabricImage } from 'fabric';
import { useMagicEraser } from '../_hooks/useMagicEraser';
import { useBackgroundRemoval } from '../_hooks/useBackgroundRemoval';

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

  // Magic eraser neural hook (LaMa ONNX)
  const { 
    status, 
    isProcessing, 
    isLoading, 
    progressMessage, 
    progressPercent, 
    deviceType, 
    inpaint 
  } = useMagicEraser();

  // Background removal hook for CLIPSeg prompt-based object isolation
  const { removeBackground } = useBackgroundRemoval();

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

  // Prompt-guided object detection
  const [promptText, setPromptText] = useState('');
  const [isPromptDetecting, setIsPromptDetecting] = useState(false);

  // Track cursor position for custom brush ring
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Quick prompt suggestions
  const QUICK_PROMPTS = [
    { label: '👔 Tie', prompt: 'tie' },
    { label: '👓 Glasses', prompt: 'glasses' },
    { label: '🏷️ Watermark', prompt: 'watermark' },
    { label: '⌚ Watch', prompt: 'watch' },
    { label: '☕ Cup', prompt: 'cup' }
  ];

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
        setPromptText('');
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
      ctx.fillStyle = 'rgba(244, 63, 94, 0.7)'; // Neon Rose Pink
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

  // Run LaMa neural inpainting on drawn mask
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
      toast.success('Cleanly erased with LaMa Neural Model!');
    } catch (err: any) {
      console.error(err);
      toast.error('Inpainting failed. Please check your network and try again.');
    }
  };

  // Handle prompt-driven object detection + LaMa inpainting
  const handlePromptErase = async (textToErase: string) => {
    if (!sourceImage || !maskCanvasRef.current) return;
    const target = textToErase.trim();
    if (!target) {
      toast.error('Please enter what you want to erase (e.g. tie, glasses, watermark).');
      return;
    }

    try {
      setIsPromptDetecting(true);
      toast.info(`Detecting "${target}" with Neural Vision...`);

      // Use CLIPSeg to locate the target object
      const activeSourceSrc = inpaintedResult || sourceImage.src;
      const resultUrl = await removeBackground(activeSourceSrc, {
        mode: 'prompt',
        prompt: target,
        threshold: 0.28
      });

      if (resultUrl) {
        // Draw the extracted mask onto mask canvas
        const maskImg = new Image();
        maskImg.crossOrigin = 'anonymous';
        maskImg.onload = async () => {
          const mCanvas = maskCanvasRef.current!;
          const mCtx = mCanvas.getContext('2d')!;
          mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);

          // Render neon mask
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = mCanvas.width;
          tempCanvas.height = mCanvas.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(maskImg, 0, 0, tempCanvas.width, tempCanvas.height);
          const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

          for (let i = 0; i < imgData.data.length; i += 4) {
            if (imgData.data[i + 3] > 25) {
              imgData.data[i] = 244;
              imgData.data[i + 1] = 63;
              imgData.data[i + 2] = 94;
              imgData.data[i + 3] = 190;
            } else {
              imgData.data[i + 3] = 0;
            }
          }

          mCtx.putImageData(imgData, 0, 0);
          setHasMask(true);

          toast.success(`Found "${target}"! Inpainting with LaMa...`);
          const activeSource = (inpaintedResult ? imageCanvasRef.current : sourceImage) as any;
          const inpaintedUrl = await inpaint(activeSource, mCanvas);
          setInpaintedResult(inpaintedUrl);
          clearMask();
          toast.success(`Successfully removed "${target}"!`);
        };
        maskImg.src = resultUrl;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Could not automatically locate "${target}". You can brush over it manually.`);
    } finally {
      setIsPromptDetecting(false);
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-slate-900/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-pink-200">
                LaMa Neural Magic Eraser
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                <Sparkles className="w-2.5 h-2.5" /> LaMa ONNX
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Type what to erase or brush manually to restore background with Fast Fourier Convolutions
            </p>
          </div>
        </div>

        {/* Hardware & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{deviceType === 'webgpu' ? 'WebGPU Accelerated' : 'WASM Engine'}</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} 
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(3, z + 0.2))} 
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Model Download Progress Bar Banner (Shown during first-time download) */}
      {isLoading && (
        <div className="bg-gradient-to-r from-pink-950/80 via-slate-900 to-indigo-950/80 border-b border-pink-500/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-pink-300">
            <Download className="w-4 h-4 animate-bounce text-pink-400" />
            <span className="font-semibold">{progressMessage || 'Downloading LaMa Neural Model (208 MB)...'}</span>
          </div>
          <div className="flex items-center gap-3 sm:w-64">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-pink-300 font-bold">{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Prompt-Guided Removal Bar (Freedom of removing by prompt box as requested) */}
      <div className="bg-slate-900/90 border-b border-white/10 px-4 py-2 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-white/5 rounded-2xl px-3 py-1.5 border border-white/10 focus-within:border-pink-500/50 transition">
          <Search className="w-4 h-4 text-pink-400 shrink-0" />
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePromptErase(promptText);
            }}
            placeholder="Type what to erase (e.g. tie, glasses, coffee cup, watermark)..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => handlePromptErase(promptText)}
            disabled={!promptText.trim() || isPromptDetecting || isProcessing}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-pink-500/25 disabled:opacity-40 transition"
          >
            {isPromptDetecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Erase</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1 hidden sm:inline">Quick:</span>
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.prompt}
              onClick={() => {
                setPromptText(item.prompt);
                handlePromptErase(item.prompt);
              }}
              disabled={isPromptDetecting || isProcessing}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 text-xs border border-white/10 hover:border-pink-500/30 transition shrink-0 active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

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
            maxHeight: '70vh'
          }}
        >
          {/* Base Image Canvas */}
          <canvas 
            ref={imageCanvasRef} 
            className="block max-w-full max-h-[68vh] object-contain pointer-events-none" 
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
        {(isProcessing || isPromptDetecting) && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-pink-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-pink-300 animate-pulse z-50">
            <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
            <span className="text-sm font-semibold">
              {isPromptDetecting 
                ? 'Locating object with Neural Vision...' 
                : progressMessage || 'LaMa is reconstructing background...'}
            </span>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brush Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
              className="w-20 sm:w-28 accent-pink-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-pink-300 w-6">{brushSize}px</span>
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
            disabled={!hasMask || isProcessing || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>LaMa Inpainting...</span>
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
