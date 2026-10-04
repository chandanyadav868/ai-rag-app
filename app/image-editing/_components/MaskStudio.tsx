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
  RefreshCw,
  Sparkles,
  BrainCircuit,
  Zap,
  Circle,
  Square,
  Star,
  Heart,
  Hexagon,
  Shield,
  Sliders,
  Trash2,
  Contrast,
  Shapes
} from 'lucide-react';
import { Canvas, FabricImage, FabricObject, Point, Rect, util } from 'fabric';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '../_hooks/useBackgroundRemoval';

interface MaskStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | null;
  mainFabricCanvas: React.MutableRefObject<Canvas | null>;
  onApply: (maskDataUrl: string, options: { 
    left: number; 
    top: number; 
    scaleX: number; 
    scaleY: number; 
    angle: number; 
    feather?: number;
    isRasterized?: boolean;
    rasterizedDataUrl?: string;
  }) => void;
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
  const [activeTab, setActiveTab] = useState<'shapes' | 'upload' | 'url' | 'paste' | 'assets'>('shapes');
  const [url, setUrl] = useState('');
  const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null);
  const [feather, setFeather] = useState(0);
  const [opacity, setOpacity] = useState(0.7);

  const { status, isModelLoaded, removeBackground, progress, progressPercent, deviceType } = useBackgroundRemoval();

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

    // Capture source if it's an image
    if (targetObject instanceof FabricImage) {
      setTargetImageUrl(targetObject.getSrc());
    } else if (targetObject.type === 'image') {
      setTargetImageUrl((targetObject as any)._element?.src || (targetObject as any).src);
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

    // Multi-touch Zoom (Pinch-to-zoom)
    let isPinching = false;
    let lastDistance = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      isPinching = true;
      lastDistance = Math.hypot(
        event.touches[1].clientX - event.touches[0].clientX,
        event.touches[1].clientY - event.touches[0].clientY
      );
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isPinching || event.touches.length !== 2) return;
      event.preventDefault();

      const currentDistance = Math.hypot(
        event.touches[1].clientX - event.touches[0].clientX,
        event.touches[1].clientY - event.touches[0].clientY
      );

      if (lastDistance <= 0) return;

      const currentScale = currentDistance / lastDistance;
      const zoomDamping = 0.4;
      const adjustedScale = 1 + (currentScale - 1) * zoomDamping;

      setViewportScale((prev) => {
        const next = prev * adjustedScale;
        return Math.min(Math.max(next, 0.05), 10);
      });

      lastDistance = currentDistance;
    };

    const handleTouchEnd = () => {
      isPinching = false;
      lastDistance = 0;
    };

    const canvasElement = canvasElementRef.current;
    if (canvasElement) {
      canvasElement.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvasElement.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvasElement.addEventListener("touchend", handleTouchEnd);
    }

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
      if (canvasElement) {
        canvasElement.removeEventListener("touchstart", handleTouchStart);
        canvasElement.removeEventListener("touchmove", handleTouchMove);
        canvasElement.removeEventListener("touchend", handleTouchEnd);
      }
      studioCanvas.dispose();
      studioCanvasRef.current = null;
    };
  }, [isOpen, selectedId]);

  // Handle Zoom from Center
  useEffect(() => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;

    // To zoom from center while preserving pan:
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
      const loadImg = (src: string, crossOrigin?: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = crossOrigin;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });

      let loadedImg: HTMLImageElement;
      
      // 1. If it's a data URL or blob, load it directly
      if (dataUrl.startsWith('data:') || dataUrl.startsWith('blob:')) {
        loadedImg = await loadImg(dataUrl);
      } else {
        // 2. External URL: Try direct load with CORS
        try {
          loadedImg = await loadImg(dataUrl, 'anonymous');
        } catch (err) {
          console.warn("Direct CORS load failed, trying proxy 1...");
          // 3. Fallback to Proxy 1 (AllOrigins)
          try {
            const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(dataUrl)}`;
            loadedImg = await loadImg(proxyUrl1, 'anonymous');
          } catch (err2) {
            console.warn("Proxy 1 failed, trying proxy 2...");
            // 4. Fallback to Proxy 2 (CorsProxy.io)
            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(dataUrl)}`;
            loadedImg = await loadImg(proxyUrl2, 'anonymous');
          }
        }
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
      console.error("Mask Studio Load Error:", err);
      toast.error("Failed to load mask image. The source might be blocking access.");
    } finally {
      setLoading(false);
    }
  };

  // Live effect for feathering and opacity preview
  useEffect(() => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;
    const mask = studioCanvas.getObjects().find(obj => (obj as any).isMaskSource);
    if (mask) {
      mask.set('opacity', opacity);
      if (feather > 0) {
        mask.set('shadow', {
          color: '#22d3ee',
          blur: feather,
          offsetX: 0,
          offsetY: 0,
        });
      } else {
        mask.set('shadow', null);
      }
      studioCanvas.requestRenderAll();
    }
  }, [feather, opacity]);

  const applyShapeMask = (shapeType: 'circle' | 'square' | 'rounded' | 'star' | 'heart' | 'hexagon' | 'shield') => {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';

    if (shapeType === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (shapeType === 'square') {
      ctx.fillRect(24, 24, size - 48, size - 48);
    } else if (shapeType === 'rounded') {
      ctx.beginPath();
      ctx.roundRect(24, 24, size - 48, size - 48, 80);
      ctx.fill();
    } else if (shapeType === 'star') {
      const cx = size / 2;
      const cy = size / 2;
      const spikes = 5;
      const outerRadius = size / 2 - 20;
      const innerRadius = outerRadius / 2.2;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerRadius;
        let y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    } else if (shapeType === 'heart') {
      const w = size - 48;
      const h = size - 48;
      const x = 24;
      const y = 24;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h / 5);
      ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + h / 3);
      ctx.bezierCurveTo(x, y + (h * 2) / 3, x + w / 2, y + (h * 5) / 6, x + w / 2, y + h);
      ctx.bezierCurveTo(x + w / 2, y + (h * 5) / 6, x + w, y + (h * 2) / 3, x + w, y + h / 3);
      ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + h / 5);
      ctx.closePath();
      ctx.fill();
    } else if (shapeType === 'hexagon') {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 20;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else if (shapeType === 'shield') {
      const cx = size / 2;
      const top = 30;
      const w = size - 60;
      const h = size - 50;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx + w / 2, top + 40);
      ctx.quadraticCurveTo(cx + w / 2, top + h * 0.65, cx, top + h);
      ctx.quadraticCurveTo(cx - w / 2, top + h * 0.65, cx - w / 2, top + 40);
      ctx.closePath();
      ctx.fill();
    }

    loadMaskImage(canvas.toDataURL());
    toast.success(`Applied ${shapeType} shape mask!`);
  };

  const invertMask = () => {
    const studioCanvas = studioCanvasRef.current;
    if (!studioCanvas) return;

    const maskObject = studioCanvas.getObjects().find(obj => (obj as any).isMaskSource) as FabricImage;
    if (!maskObject) {
      toast.error("No mask image to invert.");
      return;
    }

    setLoading(true);
    try {
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
          data[i + 3] = 255 - data[i + 3];
        }
        ctx?.putImageData(imageData, 0, 0);
        loadMaskImage(canvas.toDataURL());
        toast.success("Mask inverted!");
      }
    } catch (e) {
      console.error("Invert error:", e);
      toast.error("Failed to invert mask.");
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

        // Threshold: If pixel is light (avg > 120), make it transparent
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

    setLoading(true);
    try {
      // Calculate relative coordinates for vector clipPath fallback
      const relativeLeft = (maskObject.left! - targetObject.left!) / (targetObject.scaleX || 1);
      const relativeTop = (maskObject.top! - targetObject.top!) / (targetObject.scaleY || 1);
      const maskDataUrl = (maskObject as any).originalDataUrl || maskObject.toDataURL();

      // 1. Clone mask to apply as clipPath on targetObject in studioCanvas
      const maskClone = await maskObject.clone();
      maskClone.set({
        left: relativeLeft,
        top: relativeTop,
        scaleX: maskObject.scaleX! / (targetObject.scaleX || 1),
        scaleY: maskObject.scaleY! / (targetObject.scaleY || 1),
        angle: (maskObject.angle || 0) - (targetObject.angle || 0),
        originX: 'center',
        originY: 'center',
        absolutePositioned: false,
        opacity: 1,
      });

      // 2. Hide mask overlay object so only the clipped target is visible
      maskObject.set('visible', false);
      targetObject.clipPath = maskClone;
      const oldBg = studioCanvas.backgroundColor;
      studioCanvas.backgroundColor = 'transparent';
      studioCanvas.discardActiveObject();
      studioCanvas.renderAll();

      // 3. Compute tightly cropped bounds around the visible mask
      const maskBounds = maskObject.getBoundingRect();
      const targetBounds = targetObject.getBoundingRect();

      const cropLeft = Math.max(0, Math.max(maskBounds.left, targetBounds.left));
      const cropTop = Math.max(0, Math.max(maskBounds.top, targetBounds.top));
      const cropRight = Math.min(studioCanvas.width || 1000, Math.min(maskBounds.left + maskBounds.width, targetBounds.left + targetBounds.width));
      const cropBottom = Math.min(studioCanvas.height || 1000, Math.min(maskBounds.top + maskBounds.height, targetBounds.top + targetBounds.height));
      const cropWidth = Math.max(1, cropRight - cropLeft);
      const cropHeight = Math.max(1, cropBottom - cropTop);

      // 4. Export transparent PNG of the tightly clipped region
      const rasterizedDataUrl = studioCanvas.toDataURL({
        format: 'png',
        multiplier: 2,
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      });

      // 5. Restore studioCanvas state
      targetObject.clipPath = undefined;
      maskObject.set('visible', true);
      studioCanvas.backgroundColor = oldBg;
      studioCanvas.renderAll();

      // 6. Deliver to main editor with rasterized output
      onApply(maskDataUrl, {
        left: relativeLeft,
        top: relativeTop,
        scaleX: maskObject.scaleX!,
        scaleY: maskObject.scaleY!,
        angle: maskObject.angle!,
        feather,
        isRasterized: true,
        rasterizedDataUrl,
      });
    } catch (err) {
      console.error("Mask apply error:", err);
      toast.error("Failed to generate masked image.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/95 backdrop-blur-md p-2">
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
            {/* Zoom Controls moved to header */}
            <div className="flex items-center gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 mr-1 md:mr-2">
              <button onClick={() => setViewportScale(prev => Math.max(0.1, prev - 0.1))} className="text-white/40 hover:text-white transition"><Minus size={14} /></button>
              <div className="text-[10px] font-black text-white/60 tabular-nums w-8 md:w-10 text-center">{Math.round(viewportScale * 100)}%</div>
              <button onClick={() => setViewportScale(prev => prev + 0.1)} className="text-white/40 hover:text-white transition"><Plus size={14} /></button>
              <div className="hidden xs:block w-px h-3 bg-white/10 mx-1" />
              <button onClick={() => setViewportScale(1)} className="hidden xs:block text-white/40 hover:text-white transition"><RefreshCw size={12} /></button>
              <button onClick={resetView} className="text-cyan-400 hover:text-cyan-300 transition ml-1"><Maximize2 size={14} /></button>
            </div>
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

          {/* Responsive Sidebar */}
          <aside className={`fixed z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] 
            ${sidebarOpen ? 'translate-x-0 translate-y-0 opacity-100' : 'max-md:translate-y-full md:-translate-x-full md:opacity-0 md:pointer-events-none'} 
            md:absolute md:left-6 md:top-6 md:w-80 md:rounded-[32px] md:border md:p-6 md:shadow-[0_32px_64px_rgba(0,0,0,0.5)]
            bottom-0 left-0 right-0 w-full h-[40vh] md:h-auto border-t md:border-t-0 rounded-t-[40px] md:rounded-t-none
            border-white/10 bg-[#09182b]/95 p-6 backdrop-blur-2xl`}>
            
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center pb-4 -mt-2">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
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

            <div className="px-4 mb-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${isModelLoaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                    <BrainCircuit size={18} className={status === 'loading' || status === 'processing' ? 'animate-pulse' : ''} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white truncate">RMBG-1.4 Engine</div>
                    <div className="text-[9px] text-white/50 font-medium truncate">
                      {isModelLoaded ? `Neural Active (${deviceType.toUpperCase()})` : (status === 'loading' ? progress || 'Loading AI...' : 'Ultra HD Ready')}
                    </div>
                  </div>
                </div>
                {isModelLoaded && <Check size={14} className="text-emerald-400 shrink-0" />}
                {(status === 'loading' || status === 'processing') && <Loader2 size={14} className="text-cyan-400 animate-spin shrink-0" />}
              </div>
            </div>

            <div className="space-y-5 overflow-y-auto historyScrollbar pr-2 h-[calc(40vh-120px)] md:h-auto md:max-h-[calc(100vh-320px)]">
              {/* Tab Selector */}
              <div className="grid grid-cols-5 gap-1.5 bg-white/5 p-1.5 rounded-2xl">
                {(['shapes', 'upload', 'url', 'paste', 'assets'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${activeTab === tab ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    {tab === 'shapes' && <Shapes size={13} />}
                    {tab === 'upload' && <Upload size={13} />}
                    {tab === 'url' && <LinkIcon size={13} />}
                    {tab === 'paste' && <Clipboard size={13} />}
                    {tab === 'assets' && <ImageIcon size={13} />}
                    <span className="text-[7.5px] font-black uppercase tracking-tighter">{tab}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3">
                {activeTab === 'shapes' && (
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-2">Preset Shape Masks</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Circle', icon: Circle, type: 'circle' as const },
                        { label: 'Squircle', icon: Square, type: 'rounded' as const },
                        { label: 'Square', icon: Square, type: 'square' as const },
                        { label: 'Star', icon: Star, type: 'star' as const },
                        { label: 'Heart', icon: Heart, type: 'heart' as const },
                        { label: 'Hexagon', icon: Hexagon, type: 'hexagon' as const },
                      ].map(shape => {
                        const Icon = shape.icon;
                        return (
                          <button
                            key={shape.type}
                            onClick={() => applyShapeMask(shape.type)}
                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-500/10 transition group"
                          >
                            <Icon size={18} className="text-white/60 group-hover:text-cyan-400 group-hover:scale-110 transition" />
                            <span className="text-[9px] font-bold text-white/50 group-hover:text-white transition">{shape.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'assets' && (
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto historyScrollbar pr-1">
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
                      <div className="col-span-2 py-8 text-center border border-dashed border-white/5 rounded-2xl">
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">No assets found</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 transition hover:border-cyan-500/40 hover:bg-cyan-500/5">
                    <div className="rounded-full bg-cyan-500/10 p-3 mb-1 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Upload size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Upload Mask Image</span>
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
                    <div className="relative">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400/40 focus:bg-white/10 transition-all pl-11"
                      />
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    </div>
                    <button onClick={() => loadMaskImage(url)} className="mt-1 w-full rounded-xl bg-white text-slate-950 py-3 text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-cyan-400 transition-all active:scale-95">Fetch Image</button>
                  </div>
                )}

                {activeTab === 'paste' && (
                  <div className="relative group">
                    <textarea
                      placeholder="Paste image here (Ctrl+V)..."
                      onPaste={async (e) => {
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf("image") !== -1) {
                            const blob = items[i].getAsFile();
                            if (blob) {
                              const reader = new FileReader();
                              reader.onload = (ev) => loadMaskImage(ev.target?.result as string);
                              reader.readAsDataURL(blob);
                              toast.success("Image pasted successfully!");
                              return;
                            }
                          }
                        }
                        toast.error("No image found in pasted content.");
                      }}
                      className="w-full h-28 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-cyan-500/40 focus:bg-cyan-500/5 transition-all text-center resize-none flex items-center justify-center"
                    />
                  </div>
                )}
              </div>

              {/* Neural AI Cutout Button */}
              <div className="px-1">
                <button
                  disabled={status === 'processing' || loading}
                  onClick={async () => {
                    let imageSrc = targetImageUrl;
                    const studioCanvas = studioCanvasRef.current;
                    const target = (studioCanvas as any)?.targetLayer;
                    if (target) {
                      try {
                        const dataUrl = target.toDataURL({ format: 'png', multiplier: 1 });
                        if (dataUrl && dataUrl.startsWith('data:')) {
                          imageSrc = dataUrl;
                        }
                      } catch (e) {
                        console.warn("Could not get dataUrl from target:", e);
                      }
                    }

                    if (!imageSrc) {
                      toast.error("No target layer found to remove background.");
                      return;
                    }

                    setLoading(true);
                    try {
                      const result = await removeBackground(imageSrc);
                      if (result) {
                        await loadMaskImage(result);
                        toast.success("Background removed with RMBG-1.4 AI!");
                      }
                    } catch (err: any) {
                      console.error("BG removal failed:", err);
                      toast.error("Background removal failed. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className={`group relative w-full overflow-hidden rounded-2xl p-4 transition-all ${status === 'processing' ? 'bg-cyan-600/30' : 'bg-gradient-to-br from-cyan-600 to-blue-700 hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/20'}`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/20 p-2 text-white">
                        {status === 'processing' || loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-wider text-white">Auto Remove Background</div>
                        <div className="text-[9px] font-medium text-white/80">Powered by RMBG-1.4 Ultra HD</div>
                      </div>
                    </div>
                    <Zap size={14} className="text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  {(status === 'processing' || loading) && (
                    <div className="absolute inset-0 bg-cyan-500/20 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Mask Settings */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60">Mask Settings</span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Opacity</span>
                      <span className="text-[10px] font-mono text-cyan-400">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Feather (Smoothness)</span>
                      <span className="text-[10px] font-mono text-cyan-400">{feather} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={feather}
                      onChange={(e) => setFeather(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                    />
                    <div className="mt-1.5 flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                      <span>Sharp (0px)</span>
                      <span>Blurred (100px)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={invertMask}
                      disabled={!maskLoaded || loading}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Contrast size={13} />
                      Invert Mask
                    </button>

                    <button
                      onClick={extractAlphaMask}
                      disabled={!maskLoaded || loading}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                      Alpha Extract
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section ref={containerRef} className="relative flex-1 bg-[#050c17] overflow-auto historyScrollbar">
            <div className="relative min-h-full min-w-full flex items-center justify-center p-8 pb-[45vh] md:pb-8">
              <canvas ref={canvasElementRef} />
            </div>

            {/* Rich AI Neural Progress Overlay */}
            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0c1829] p-6 shadow-2xl flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-pulse">
                      <BrainCircuit size={32} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-cyan-500 flex items-center justify-center text-black">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  </div>

                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    RMBG-1.4 Neural Engine
                  </h4>
                  <p className="mt-1 text-xs text-white/60">
                    {progress || (status === 'loading' ? 'Loading AI Model weights...' : 'Removing background with AI...')}
                  </p>

                  {progressPercent > 0 && (
                    <div className="mt-4 w-full">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] font-bold text-white/40">
                        <span>Progress</span>
                        <span className="text-cyan-400 font-mono">{progressPercent}%</span>
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-[10px] text-white/30 max-w-xs">
                    {status === 'loading' 
                      ? 'First-time setup may take a moment to cache model weights in your browser.' 
                      : 'Runs client-side via hardware-accelerated WebGPU/WASM.'}
                  </p>

                  <button
                    onClick={() => setLoading(false)}
                    className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition"
                  >
                    Dismiss / Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
