"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Sparkles,
  Zap,
  Download,
  Trash2,
  Loader2,
  Check,
  ShieldCheck,
  RefreshCw,
  X,
  Layers,
  Wand2,
  Copy,
  SplitSquareVertical,
  Columns,
  Eye,
  Sliders,
  Palette,
  Crosshair,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Archive,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '../image-editing/_hooks/useBackgroundRemoval';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import AdSlot from '@/components/ads/AdSlot';
import ExportSuccessAdModal from '@/components/ads/ExportSuccessAdModal';
import { AD_CONFIG } from '@/constant/ads';

interface ProcessedImage {
  id: string;
  file?: File;
  name: string;
  originalUrl: string;
  processedUrl: string | null;
  mode: 'auto' | 'prompt';
  prompt?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  durationMs?: number;
}

const SAMPLE_IMAGES = [
  {
    name: 'Pet (Golden Retriever)',
    tag: 'Pet',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80',
    prompt: 'dog'
  },
  {
    name: 'Portrait (Curly Hair)',
    tag: 'Person',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    prompt: 'person'
  },
  {
    name: 'Product (Sneakers)',
    tag: 'Product',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
    prompt: 'shoe'
  },
  {
    name: 'Vehicle (Sports Car)',
    tag: 'Vehicle',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    prompt: 'car'
  }
];

const PRESET_BACKDROPS = [
  { id: 'transparent', label: 'Transparent', type: 'transparent', value: 'transparent' },
  { id: 'white', label: 'Studio White', type: 'color', value: '#FFFFFF' },
  { id: 'dark', label: 'Obsidian Dark', type: 'color', value: '#0B0F19' },
  { id: 'slate', label: 'Soft Slate', type: 'color', value: '#E2E8F0' },
  { id: 'blue', label: 'Electric Blue', type: 'color', value: '#2563EB' },
  { id: 'emerald', label: 'Emerald Mint', type: 'color', value: '#059669' },
  { id: 'coral', label: 'Sunset Coral', type: 'color', value: '#F43F5E' },
  { id: 'neon', label: 'Cyber Violet', type: 'gradient', value: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)' },
  { id: 'sunset', label: 'Sunset Warmth', type: 'gradient', value: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)' },
  { id: 'ocean', label: 'Deep Ocean', type: 'gradient', value: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)' },
  { id: 'blur', label: 'Blurred Scene', type: 'blur', value: 'blur' }
];

const QUICK_PROMPT_CHIPS = ['Dog', 'Cat', 'Person', 'Shoe', 'Watch', 'Car', 'Bottle', 'Chair'];

export default function ImageBgRemovalPage() {
  const router = useRouter();
  const {
    status: workerStatus,
    progress,
    progressPercent,
    isModelLoaded,
    deviceType,
    lastDurationMs,
    removeBackground,
    loadModel
  } = useBackgroundRemoval();

  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [removalMode, setRemovalMode] = useState<'auto' | 'prompt'>('auto');
  const [objectPrompt, setObjectPrompt] = useState<string>('');
  const [promptThreshold, setPromptThreshold] = useState<number>(0.35);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);

  // Studio Viewport State
  const [viewMode, setViewMode] = useState<'split' | 'cutout' | 'original' | 'side-by-side'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [activeBackdrop, setActiveBackdrop] = useState<string>('transparent');
  const [shadowMode, setShadowMode] = useState<'none' | 'contact' | 'floating' | 'sunlight'>('none');
  const [shadowIntensity, setShadowIntensity] = useState<number>(0.55);
  const [blurRadius, setBlurRadius] = useState<number>(18);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef<boolean>(false);
  const rafId = useRef<number | null>(null);
  const workspaceRef = useRef<HTMLElement>(null);

  const activeImage = images.find(img => img.id === activeImageId) || images[0] || null;

  // Preload RMBG model on mount for fast responsiveness
  useEffect(() => {
    loadModel('briaai/RMBG-1.4');
  }, [loadModel]);

  // Handle incoming files
  const addImages = useCallback((files: File[]) => {
    const newItems: ProcessedImage[] = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(2, 11),
        file,
        name: file.name,
        originalUrl: URL.createObjectURL(file),
        processedUrl: null,
        mode: removalMode,
        status: 'idle'
      }));

    if (newItems.length > 0) {
      setImages(prev => [...prev, ...newItems]);
      setActiveImageId(newItems[0].id);
      setSliderPosition(50);
      setViewMode('original');
      toast.success(`Loaded ${newItems.length} image${newItems.length > 1 ? 's' : ''}`);
      setTimeout(() => {
        workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [removalMode]);

  // Load sample image
  const loadSample = useCallback(async (sample: typeof SAMPLE_IMAGES[0]) => {
    const newId = Math.random().toString(36).substring(2, 11);
    const sampleItem: ProcessedImage = {
      id: newId,
      name: sample.name,
      originalUrl: sample.url,
      processedUrl: null,
      mode: removalMode,
      prompt: sample.prompt,
      status: 'idle'
    };

    setImages(prev => [sampleItem, ...prev]);
    setActiveImageId(newId);
    setSliderPosition(50);
    setViewMode('original');
    if (removalMode === 'prompt') {
      setObjectPrompt(sample.prompt);
    }
    toast.success(`Loaded ${sample.name}`);
    setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [removalMode]);

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  }, [addImages]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        addImages(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addImages]);

  // Process a single image
  const processImage = async (targetId: string, customMode?: 'auto' | 'prompt', customPrompt?: string) => {
    const item = images.find(img => img.id === targetId);
    if (!item) return;

    const modeToUse = customMode || removalMode;
    const promptToUse = customPrompt !== undefined ? customPrompt : objectPrompt;

    if (modeToUse === 'prompt' && !promptToUse.trim()) {
      toast.error('Please enter the object you want to isolate (e.g. "dog", "person")');
      return;
    }

    setIsProcessing(true);
    setImages(prev => prev.map(img => img.id === targetId ? { ...img, status: 'processing' } : img));

    try {
      const resultUrl = await removeBackground(item.originalUrl, {
        mode: modeToUse,
        prompt: modeToUse === 'prompt' ? promptToUse.trim() : undefined,
        threshold: promptThreshold
      });

      if (resultUrl) {
        setImages(prev => prev.map(img => img.id === targetId ? {
          ...img,
          processedUrl: resultUrl,
          mode: modeToUse,
          prompt: promptToUse,
          status: 'completed',
          durationMs: lastDurationMs || undefined
        } : img));
        setSliderPosition(50);
        setViewMode('split');
        toast.success(
          modeToUse === 'prompt'
            ? `Isolated "${promptToUse}" successfully!`
            : 'Background removed with crystal-clear edges!'
        );
      } else {
        setImages(prev => prev.map(img => img.id === targetId ? { ...img, status: 'error' } : img));
      }
    } catch (err: any) {
      console.error(err);
      setImages(prev => prev.map(img => img.id === targetId ? { ...img, status: 'error' } : img));
      toast.error(err?.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch process all idle images
  const processAll = async () => {
    const queue = images.filter(img => img.status === 'idle' || img.status === 'error');
    if (queue.length === 0) {
      toast.info('No pending images to process');
      return;
    }

    setIsProcessingAll(true);
    for (const item of queue) {
      setActiveImageId(item.id);
      await processImage(item.id);
    }
    setIsProcessingAll(false);
    toast.success('Batch processing completed!');
  };

  // Download single image (either transparent PNG or with current backdrop)
  const downloadImage = async (item: ProcessedImage, withBackdrop: boolean = false) => {
    if (!item.processedUrl) return;

    if (!withBackdrop && shadowMode === 'none') {
      const a = document.createElement('a');
      a.href = item.processedUrl;
      a.download = `polish-ai-${item.name.replace(/\.[^/.]+$/, '')}-cutout.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Downloaded transparent cutout!');
      setTimeout(() => setIsExportModalOpen(true), 400);
      return;
    }

    // Composite with background and/or shadow
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = item.processedUrl;
    await new Promise(r => img.onload = r);

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    if (withBackdrop && activeBackdrop !== 'transparent') {
      const backdropConfig = PRESET_BACKDROPS.find(b => b.id === activeBackdrop);
      if (backdropConfig) {
        if (backdropConfig.type === 'color') {
          ctx.fillStyle = backdropConfig.value;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backdropConfig.type === 'gradient') {
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          if (backdropConfig.id === 'neon') {
            grad.addColorStop(0, '#6366F1');
            grad.addColorStop(1, '#A855F7');
          } else if (backdropConfig.id === 'sunset') {
            grad.addColorStop(0, '#F97316');
            grad.addColorStop(1, '#EC4899');
          } else {
            grad.addColorStop(0, '#0EA5E9');
            grad.addColorStop(1, '#3B82F6');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backdropConfig.type === 'blur') {
          const origImg = new Image();
          origImg.crossOrigin = 'anonymous';
          origImg.src = item.originalUrl;
          await new Promise(r => origImg.onload = r);
          ctx.filter = `blur(${blurRadius}px)`;
          ctx.drawImage(origImg, -20, -20, canvas.width + 40, canvas.height + 40);
          ctx.filter = 'none';
        }
      }
    }

    // Draw shadow if enabled
    if (shadowMode === 'contact') {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.94;
      const rx = canvas.width * 0.35;
      const ry = canvas.height * 0.055;
      ctx.save();
      ctx.beginPath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      grad.addColorStop(0, `rgba(0,0,0,${shadowIntensity})`);
      grad.addColorStop(0.5, `rgba(0,0,0,${shadowIntensity * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.filter = `blur(${Math.max(6, Math.round(canvas.width * 0.015))}px)`;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (shadowMode === 'floating') {
      ctx.save();
      ctx.shadowColor = `rgba(0,0,0,${shadowIntensity})`;
      ctx.shadowBlur = Math.round(canvas.width * 0.035);
      ctx.shadowOffsetY = Math.round(canvas.height * 0.03);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else if (shadowMode === 'sunlight') {
      ctx.save();
      ctx.shadowColor = `rgba(0,0,0,${shadowIntensity})`;
      ctx.shadowBlur = Math.round(canvas.width * 0.025);
      ctx.shadowOffsetX = Math.round(canvas.width * 0.025);
      ctx.shadowOffsetY = Math.round(canvas.height * 0.035);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    if (shadowMode !== 'floating' && shadowMode !== 'sunlight') {
      ctx.drawImage(img, 0, 0);
    }

    const compositeUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = compositeUrl;
    a.download = withBackdrop 
      ? `polish-ai-${item.name.replace(/\.[^/.]+$/, '')}-backdrop.png`
      : `polish-ai-${item.name.replace(/\.[^/.]+$/, '')}-cutout-shadow.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(withBackdrop ? 'Downloaded with studio backdrop!' : 'Downloaded cutout with shadow!');
    setTimeout(() => setIsExportModalOpen(true), 400);
  };

  // Download all completed as ZIP
  const downloadAllZip = async () => {
    const completed = images.filter(img => img.processedUrl);
    if (completed.length === 0) {
      toast.error('No completed images to download');
      return;
    }

    const zip = new JSZip();
    for (let i = 0; i < completed.length; i++) {
      const item = completed[i];
      if (item.processedUrl) {
        const base64Data = item.processedUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
        zip.file(`${i + 1}-${item.name.replace(/\.[^/.]+$/, '')}-cutout.png`, base64Data, { base64: true });
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'polish-ai-cutouts.zip');
    toast.success(`Exported ${completed.length} cutouts into ZIP!`);
    setTimeout(() => setIsExportModalOpen(true), 400);
  };

  // Copy cutout to clipboard
  const copyToClipboard = async () => {
    if (!activeImage?.processedUrl) return;
    try {
      const res = await fetch(activeImage.processedUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Cutout copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Open in Canvas Studio (/image-editing)
  const openInEditor = () => {
    if (!activeImage?.processedUrl) return;
    try {
      sessionStorage.setItem('polish_ai_imported_cutout', activeImage.processedUrl);
      router.push('/image-editing');
    } catch (e) {
      router.push('/image-editing');
    }
  };

  // Interactive Split Slider Drag with RAF throttling (smooth 60-120fps)
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      if (!sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.round((x / rect.width) * 100);
      setSliderPosition(percent);
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSlider.current = true;
    handleSliderMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingSlider.current = false;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider.current) {
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider.current && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleSliderMove]);

  return (
    <div className="min-h-screen bg-[#060D1A] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col gap-8">
        
        {/* Top Header & Engine Status Bar */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles size={13} className="text-cyan-400 animate-pulse" />
                State of the Art AI Matting
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={13} />
                100% In-Browser & Private
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Zap size={13} />
                {deviceType === 'webgpu' ? '⚡ WebGPU Active' : '⚙️ WASM Engine'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AI Background & Object Isolation Studio
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-400 max-w-2xl">
              Extract clean transparent cutouts instantly with <strong className="text-cyan-300 font-semibold">RMBG-1.4</strong> or isolate any specific object with text prompts using <strong className="text-violet-300 font-semibold">CLIPSeg Zero-Shot AI</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <UploadCloud size={16} />
              Upload Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && addImages(Array.from(e.target.files))}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>
        </section>

        {/* Empty State / Dropzone with Demo Showcase */}
        {images.length === 0 && (
          <section className="flex flex-col gap-8">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 sm:p-16 text-center transition-all duration-300 backdrop-blur-xl ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/10 scale-[1.01]'
                  : 'border-white/10 bg-[#091528]/60 hover:border-cyan-500/50 hover:bg-[#0c1c36]/70 shadow-xl'
              }`}
            >
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                <UploadCloud size={32} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Drop your photos here or click to browse
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Supports JPG, PNG, WEBP. You can also paste directly with <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono text-cyan-300">Ctrl + V</kbd>
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Never leaves your browser
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Zap size={14} className="text-yellow-400" /> RAM-protected under 250MB
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Sparkles size={14} className="text-cyan-400" /> Crisp fur, hair & product edges
                </span>
              </div>
            </div>

            {/* Inspiration Demos */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Try with Instant Sample Photos
                </span>
                <span className="text-xs text-slate-500">Click any image to test live</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(sample)}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/50 bg-[#091528] transition-all hover:scale-[1.02] text-left active:scale-95 shadow-md"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-cyan-300 mb-1">
                        {sample.tag}
                      </span>
                      <p className="text-xs font-semibold text-white truncate">{sample.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Active Studio Workspace */}
        {images.length > 0 && activeImage && (
          <section ref={workspaceRef} className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Control Column: AI Mode & Settings (order-2 on mobile, order-1 on desktop) */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4 order-2 lg:order-1">
              
              {/* Mode Selection Card */}
              <div className="rounded-2xl border border-white/10 bg-[#091528]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/80">AI Extraction Mode</span>
                  {activeImage.status === 'completed' && (
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check size={12} /> Ready
                    </span>
                  )}
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/5">
                  <button
                    onClick={() => {
                      setRemovalMode('auto');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      removalMode === 'auto'
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wand2 size={14} />
                    Full Auto Cutout
                  </button>
                  <button
                    onClick={() => {
                      setRemovalMode('prompt');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      removalMode === 'prompt'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crosshair size={14} />
                    Selective Object
                  </button>
                </div>

                {/* Mode 1: Auto Mode description */}
                {removalMode === 'auto' && (
                  <div className="text-xs text-slate-300 bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-cyan-400" />
                      RMBG-1.4 Neural Matting
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Removes background automatically while preserving intricate hair, fur, transparent surfaces, and sharp product silhouettes.
                    </p>
                  </div>
                )}

                {/* Mode 2: Prompt-Guided Selective Isolation */}
                {removalMode === 'prompt' && (
                  <div className="flex flex-col gap-3 bg-violet-950/20 border border-violet-500/20 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                        <Crosshair size={13} />
                        Keep Only This Object
                      </label>
                      <span className="text-[10px] text-slate-400">e.g. &quot;dog&quot;, &quot;person&quot;</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={objectPrompt}
                        onChange={(e) => setObjectPrompt(e.target.value)}
                        placeholder="Type object to keep (e.g. dog, cat, car)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            processImage(activeImage.id, 'prompt', objectPrompt);
                          }
                        }}
                      />
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPT_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => {
                            setObjectPrompt(chip.toLowerCase());
                            processImage(activeImage.id, 'prompt', chip.toLowerCase());
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            objectPrompt.toLowerCase() === chip.toLowerCase()
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Sensitivity / Threshold Slider */}
                    <div className="mt-1 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Detection Sensitivity</span>
                        <span className="text-violet-300 font-mono">{Math.round((1 - promptThreshold) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="0.65"
                        step="0.05"
                        value={promptThreshold}
                        onChange={(e) => setPromptThreshold(parseFloat(e.target.value))}
                        className="accent-violet-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={() => processImage(activeImage.id)}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 ${
                    removalMode === 'prompt'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {progress || 'Processing Image...'}
                    </>
                  ) : activeImage.processedUrl ? (
                    <>
                      <RefreshCw size={15} />
                      Re-run AI Extraction
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {removalMode === 'prompt' ? 'Isolate Selected Object' : 'Remove Background Now'}
                    </>
                  )}
                </button>

                {/* Progress bar during model load/processing */}
                {isProcessing && progressPercent > 0 && (
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Backdrop Testing Studio */}
              <div className="rounded-2xl border border-white/10 bg-[#091528]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Palette size={13} className="text-cyan-400" />
                    Backdrop Studio
                  </span>
                  <span className="text-[11px] text-slate-400">Live Preview</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKDROPS.map((backdrop) => (
                    <button
                      key={backdrop.id}
                      onClick={() => setActiveBackdrop(backdrop.id)}
                      className={`h-11 rounded-xl relative border transition-all flex items-center justify-center overflow-hidden ${
                        activeBackdrop === backdrop.id
                          ? 'border-cyan-400 shadow-md shadow-cyan-500/30 scale-105'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{
                        background:
                          backdrop.type === 'transparent'
                            ? 'repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 10px 10px'
                            : backdrop.value
                      }}
                      title={backdrop.label}
                    >
                      {backdrop.type === 'blur' && (
                        <span className="text-[10px] font-bold text-white backdrop-blur-md px-1 py-0.5 rounded bg-black/40">
                          Blur
                        </span>
                      )}
                      {activeBackdrop === backdrop.id && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Check size={14} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Blur Strength Slider if Blur mode is active */}
                {activeBackdrop === 'blur' && (
                  <div className="pt-2 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Blur Radius</span>
                      <span className="font-mono text-cyan-400">{blurRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="40"
                      value={blurRadius}
                      onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                      className="accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* E-Commerce Product Studio & Shadow Generator */}
              <div className="rounded-2xl border border-white/10 bg-[#091528]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Product Contact Shadows
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    E-Commerce
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Crisp Cutout', desc: 'Pure Alpha' },
                    { id: 'contact', label: 'Floor Contact', desc: 'Amazon / Shopify' },
                    { id: 'floating', label: 'Soft Floating', desc: 'Apple Glow' },
                    { id: 'sunlight', label: 'Sunlight Cast', desc: '45° Directional' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setShadowMode(s.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        shadowMode === s.id
                          ? 'border-amber-400 bg-amber-500/10 text-white shadow-md shadow-amber-500/10'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {shadowMode !== 'none' && (
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Shadow Density</span>
                      <span className="font-mono text-amber-400">{Math.round(shadowIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={shadowIntensity}
                      onChange={(e) => setShadowIntensity(parseFloat(e.target.value))}
                      className="accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Quick Actions Panel - Visible ONLY on Desktop Sidebar to avoid duplication on mobile */}
              <div className="hidden lg:flex rounded-2xl border border-white/10 bg-[#091528]/80 backdrop-blur-xl p-5 shadow-xl flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  Export & Actions
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadImage(activeImage, false)}
                    disabled={!activeImage.processedUrl}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Download size={14} className="text-cyan-400" />
                    Cutout PNG
                  </button>
                  <button
                    onClick={() => downloadImage(activeImage, true)}
                    disabled={!activeImage.processedUrl || activeBackdrop === 'transparent'}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Download size={14} className="text-emerald-400" />
                    With Backdrop
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!activeImage.processedUrl}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button
                    onClick={openInEditor}
                    disabled={!activeImage.processedUrl}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <ExternalLink size={14} />
                    Open in Canvas
                  </button>
                </div>
              </div>

              {/* Placement 3: Desktop Sidebar Sponsored Unit */}
              <div className="hidden lg:block">
                <AdSlot slotId={AD_CONFIG.SLOTS.SIDEBAR_RECTANGLE} label="Recommended Partner" />
              </div>
            </div>

            {/* Right Main Stage: Visual Split-Screen Workspace (order-1 on mobile so image is at the top!) */}
            <div className="flex-1 w-full flex flex-col gap-4 order-1 lg:order-2">
              
              {/* Studio Stage Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#091528]/80 border border-white/10 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-xl">
                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 bg-black/40 p-0.5 sm:p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                      viewMode === 'split' ? 'bg-white/10 text-cyan-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical size={13} />
                    <span>Split</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cutout')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                      viewMode === 'cutout' ? 'bg-white/10 text-cyan-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Cutout</span>
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                      viewMode === 'original' ? 'bg-white/10 text-cyan-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Original</span>
                  </button>
                </div>

                {/* Zoom & Reset Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-0.5">
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                      className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="px-1.5 sm:px-2 text-[11px] sm:text-xs font-mono text-slate-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Fit to Screen"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>

              {/* Main Interactive Canvas Stage */}
              <div
                ref={sliderContainerRef}
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[640px] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none"
                style={{
                  background:
                    activeBackdrop === 'transparent'
                      ? 'repeating-conic-gradient(#151f30 0% 25%, #0b1220 0% 50%) 50% / 20px 20px'
                      : activeBackdrop === 'blur'
                      ? '#060D1A'
                      : PRESET_BACKDROPS.find(b => b.id === activeBackdrop)?.value || 'transparent'
                }}
              >
                {/* Background Blur layer if active */}
                {activeBackdrop === 'blur' && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-300 scale-105"
                    style={{
                      backgroundImage: `url(${activeImage.originalUrl})`,
                      filter: `blur(${blurRadius}px) brightness(0.8)`
                    }}
                  />
                )}

                {/* Content Container scaled by Zoom Level */}
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {/* Mode: Cutout Only */}
                  {viewMode === 'cutout' && (
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                      {shadowMode === 'contact' && (
                        <div
                          className="absolute bottom-[3%] w-[68%] h-[12%] rounded-[100%] pointer-events-none transition-all"
                          style={{
                            background: `radial-gradient(ellipse at center, rgba(0,0,0,${shadowIntensity}) 0%, rgba(0,0,0,${shadowIntensity * 0.4}) 45%, transparent 75%)`,
                            filter: 'blur(10px)',
                          }}
                        />
                      )}
                      <img
                        src={activeImage.processedUrl || activeImage.originalUrl}
                        alt="Processed Cutout"
                        className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl"
                        style={{
                          filter:
                            shadowMode === 'floating'
                              ? `drop-shadow(0 25px 25px rgba(0,0,0,${shadowIntensity}))`
                              : shadowMode === 'sunlight'
                              ? `drop-shadow(20px 25px 20px rgba(0,0,0,${shadowIntensity}))`
                              : undefined
                        }}
                      />
                    </div>
                  )}

                  {/* Mode: Original Only */}
                  {viewMode === 'original' && (
                    <img
                      src={activeImage.originalUrl}
                      alt="Original Image"
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  )}

                  {/* Mode: Interactive Split Slider */}
                  {viewMode === 'split' && (
                    !activeImage.processedUrl ? (
                      /* When not yet processed: show full clean original image without any split or grayscale */
                      <img
                        src={activeImage.originalUrl}
                        alt="Original Image"
                        className="max-w-full max-h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div
                        className="relative w-full h-full flex items-center justify-center overflow-hidden select-none cursor-ew-resize touch-none"
                        onMouseDown={handleMouseDown}
                        onTouchStart={(e) => {
                          isDraggingSlider.current = true;
                          if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
                        }}
                      >
                        {/* Sizing placeholder maintaining container aspect ratio */}
                        <img
                          src={activeImage.originalUrl}
                          alt=""
                          className="max-w-full max-h-full object-contain opacity-0 pointer-events-none"
                        />

                        {/* Left Side: Original Image clipped to sliderPosition */}
                        <div
                          className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                          style={{
                            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                            willChange: 'clip-path',
                            transform: 'translateZ(0)'
                          }}
                        >
                          <img
                            src={activeImage.originalUrl}
                            alt="Original"
                            className="max-w-full max-h-full object-contain pointer-events-none"
                          />
                        </div>

                        {/* Right Side: Cutout Image clipped from sliderPosition to 100% */}
                        <div
                          className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                          style={{
                            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                            willChange: 'clip-path',
                            transform: 'translateZ(0)'
                          }}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            {shadowMode === 'contact' && (
                              <div
                                className="absolute bottom-[3%] w-[68%] h-[12%] rounded-[100%] pointer-events-none transition-all"
                                style={{
                                  background: `radial-gradient(ellipse at center, rgba(0,0,0,${shadowIntensity}) 0%, rgba(0,0,0,${shadowIntensity * 0.4}) 45%, transparent 75%)`,
                                  filter: 'blur(10px)',
                                }}
                              />
                            )}
                            <img
                              src={activeImage.processedUrl}
                              alt="Processed Cutout"
                              className="max-w-full max-h-full object-contain pointer-events-none"
                              style={{
                                filter:
                                  shadowMode === 'floating'
                                    ? `drop-shadow(0 25px 25px rgba(0,0,0,${shadowIntensity}))`
                                    : shadowMode === 'sunlight'
                                    ? `drop-shadow(20px 25px 20px rgba(0,0,0,${shadowIntensity}))`
                                    : undefined
                              }}
                            />
                          </div>
                        </div>

                        {/* Draggable Divider Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center pointer-events-none"
                          style={{ left: `${sliderPosition}%`, willChange: 'left', transform: 'translateZ(0)' }}
                        >
                          <div className="w-10 h-10 -ml-4.5 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-slate-900/20 active:scale-110 transition-transform cursor-ew-resize">
                            <SplitSquareVertical size={18} />
                          </div>
                        </div>

                        {/* Before / After Badges */}
                        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 pointer-events-none shadow-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Before
                        </div>
                        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold bg-cyan-500/90 backdrop-blur-md text-white border border-cyan-400/30 pointer-events-none shadow-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          After
                        </div>
                      </div>
                    )
                  )}

                  {/* In-Progress Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {progress || 'Neural Network Processing...'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Zero server upload • Executing locally on your device
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Action Bar: Direct 1-click downloads & actions right under preview image */}
              <div className="flex flex-col gap-2.5 bg-[#091528]/90 border border-white/10 rounded-2xl p-2.5 sm:p-3.5 backdrop-blur-xl shadow-xl">
                {activeImage.processedUrl ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Primary Dual Download Buttons: 1-click single download vs 1-click whole batch download */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => downloadImage(activeImage, false)}
                        disabled={!activeImage.processedUrl}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 transition-all"
                      >
                        <Download size={14} />
                        <span>Download Cutout (PNG)</span>
                      </button>

                      <button
                        onClick={downloadAllZip}
                        disabled={images.filter(i => i.status === 'completed').length === 0}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 transition-all"
                      >
                        <Archive size={14} className="text-emerald-400" />
                        <span>Download All ({images.filter(i => i.status === 'completed').length} Ready)</span>
                      </button>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => processImage(activeImage.id)}
                        disabled={isProcessing}
                        className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin text-cyan-400" />
                        ) : (
                          <RefreshCw size={13} className="text-cyan-400" />
                        )}
                        <span>Re-run AI</span>
                      </button>

                      <button
                        onClick={() => downloadImage(activeImage, true)}
                        disabled={!activeImage.processedUrl || activeBackdrop === 'transparent'}
                        className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        <Download size={13} className="text-emerald-400" />
                        <span>With Backdrop</span>
                      </button>

                      <button
                        onClick={copyToClipboard}
                        disabled={!activeImage.processedUrl}
                        className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={openInEditor}
                        disabled={!activeImage.processedUrl}
                        className="py-2 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        <ExternalLink size={13} />
                        <span>Open Canvas</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => processImage(activeImage.id)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 ${
                      removalMode === 'prompt'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/25'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>{progress || 'Processing Image...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>{removalMode === 'prompt' ? 'Isolate Selected Object' : 'Remove Background Now'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Progress bar during processing on mobile */}
                {isProcessing && progressPercent > 0 && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Thumbnail Queue Bar */}
              <div className="bg-[#091528]/80 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-xl flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                      Queue ({images.length})
                    </span>
                    {images.filter(i => i.status === 'completed').length > 0 && (
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                        {images.filter(i => i.status === 'completed').length} Ready
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {images.length > 1 && (
                      <button
                        onClick={processAll}
                        disabled={isProcessingAll}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap active:scale-95"
                      >
                        {isProcessingAll ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Process All
                      </button>
                    )}
                    {images.some(i => i.processedUrl) && (
                      <button
                        onClick={downloadAllZip}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap active:scale-95"
                        title="Download all completed images in ZIP"
                      >
                        <Archive size={12} className="text-emerald-400" />
                        Download All (ZIP)
                      </button>
                    )}
                    {activeImage && images.length > 1 && (
                      <button
                        onClick={() => {
                          setImages(prev => prev.filter(i => i.id !== activeImage.id));
                          const remaining = images.filter(i => i.id !== activeImage.id);
                          setActiveImageId(remaining[0]?.id || null);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap active:scale-95"
                        title="Remove active image from queue"
                      >
                        <Trash2 size={11} />
                        <span>Remove</span>
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap active:scale-95"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Queue Cards */}
                <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {images.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveImageId(item.id);
                        setSliderPosition(50);
                        if (item.processedUrl) {
                          setViewMode('split');
                        } else {
                          setViewMode('original');
                        }
                      }}
                      className={`group relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border overflow-hidden cursor-pointer transition-all ${
                        activeImageId === item.id
                          ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-102 shadow-lg'
                          : 'border-white/10 hover:border-white/30 bg-black/40'
                      }`}
                    >
                      <img
                        src={item.processedUrl || item.originalUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.status === 'completed' && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                          <Check size={10} />
                        </div>
                      )}
                      {item.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-cyan-400">
                          <Loader2 size={14} className="animate-spin" />
                        </div>
                      )}
                      {/* Desktop-only delete button on hover, pointer-events disabled when invisible so mobile taps NEVER delete the image */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages(prev => prev.filter(i => i.id !== item.id));
                          if (activeImageId === item.id) {
                            const remaining = images.filter(i => i.id !== item.id);
                            setActiveImageId(remaining[0]?.id || null);
                          }
                        }}
                        className="hidden sm:group-hover:flex absolute bottom-1 right-1 p-1 rounded-md bg-black/80 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                        title="Remove image"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Placement 2: High-Intent Post-Download Export Success Ad Modal */}
      <ExportSuccessAdModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        imageUrl={activeImage?.processedUrl}
        onCopy={copyToClipboard}
        onOpenCanvas={openInEditor}
      />

      {/* Fullscreen Neural Processing Lock Screen: Locks scrolling & screen jitter during intensive model calculation */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#060D1A]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-[#091528] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-cyan-950/50 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
              </div>
              <Sparkles size={16} className="absolute -top-1 -right-1 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Neural Engine Working
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {progress || 'Calculating high-precision matting edges...'}
              </p>
            </div>
            {progressPercent > 0 && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              100% In-Browser &bull; Zero Server Upload
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
