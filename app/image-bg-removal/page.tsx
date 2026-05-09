"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Zap, Download, Trash2, Loader2, BrainCircuit, Check, ShieldCheck, Settings2, RefreshCw, X, ArrowRight, Layers, Wand2, Plus, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '../image-editing/_hooks/useBackgroundRemoval';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProcessedImage {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export default function ImageBgRemovalPage() {
  const { status, progress, isModelLoaded, loadModel, removeBackground } = useBackgroundRemoval();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        originalUrl: URL.createObjectURL(file),
        processedUrl: null,
        status: 'idle'
      }));
    
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} images to queue`);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

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

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const processSingleImage = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img || !isModelLoaded) return;

    setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i));
    
    try {
        const result = await removeBackground(img.originalUrl);
        if (result) {
            setImages(prev => prev.map(i => i.id === id ? { ...i, processedUrl: result, status: 'completed' } : i));
        } else {
            setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'error' } : i));
        }
    } catch (err) {
        setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'error' } : i));
    }
  };

  const processAll = async () => {
    if (!isModelLoaded || isProcessingAll) return;
    setIsProcessingAll(true);
    
    for (const img of images) {
      if (img.status !== 'completed') {
        await processSingleImage(img.id);
      }
    }
    
    setIsProcessingAll(false);
    toast.success("Batch processing complete!");
  };

  const removeImage = (id: string) => {
    setImages(prev => {
        const img = prev.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.originalUrl);
        return prev.filter(i => i.id !== id);
    });
  };

  const downloadAll = () => {
    images.forEach(img => {
      if (img.processedUrl) {
        const a = document.createElement('a');
        a.href = img.processedUrl;
        a.download = `removed-bg-${img.file.name.split('.')[0]}.png`;
        a.click();
      }
    });
  };

  return (
    <div 
      className="min-h-screen bg-[#050c17] text-white selection:bg-cyan-500/30 transition-all duration-300"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cyan-500/10 backdrop-blur-md pointer-events-none border-4 border-dashed border-cyan-500 m-6 rounded-[64px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 text-cyan-400">
            <div className="p-8 rounded-[40px] bg-cyan-500 text-black shadow-[0_0_50px_rgba(6,182,212,0.5)]">
              <Upload size={64} className="animate-bounce" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Drop to Remove Background</h2>
          </div>
        </div>
      )}
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Wand2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Next-Gen Neural Magic</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Remove Background <br /> <span className="text-cyan-400">Instantly.</span>
            </h1>
            <p className="text-xl text-white/40 font-medium max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Professional-grade background removal powered by the same MODNet engine used in our Pro Editor. 
              Everything happens in your browser. 100% Private. 100% Fast.
            </p>
          </div>

          {/* Model Load Section */}
          {!isModelLoaded && (
            <div className="max-w-xl mx-auto p-12 rounded-[48px] border border-white/10 bg-[#09182b]/80 backdrop-blur-3xl text-center space-y-8 shadow-2xl animate-in zoom-in duration-700 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-24 h-24 rounded-[32px] bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto relative z-10">
                    <BrainCircuit size={48} className={status === 'loading' ? 'animate-pulse' : ''} />
                </div>
                <div className="space-y-3 relative z-10">
                    <h3 className="text-3xl font-black text-white">Neural Engine Offline</h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                        To maintain 100% privacy, we process images on your device. 
                        Load the neural weights to begin.
                    </p>
                </div>
                <button
                    onClick={() => loadModel()}
                    disabled={status === 'loading'}
                    className="group relative inline-flex items-center gap-4 rounded-3xl bg-white px-12 py-6 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 shadow-2xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 relative z-10"
                >
                    {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
                    {status === 'loading' ? 'Waking Up AI...' : 'Initialize AI Magic'}
                </button>
                {status === 'loading' && (
                    <div className="space-y-2 relative z-10">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">
                            Synchronizing Neural Synapses: {progress}
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: '40%' }} />
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* Editor Container */}
          {isModelLoaded && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                {/* Batch Action Bar */}
                {images.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[40px] bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl sticky top-24 z-40">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
                                <Layers size={24} />
                            </div>
                            <div>
                                <div className="text-sm font-black uppercase tracking-wider text-white">{images.length} Images in Queue</div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                                    {images.filter(i => i.status === 'completed').length} Completed • {images.filter(i => i.status === 'processing').length} Processing
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition hover:bg-white/10 active:scale-95"
                            >
                                <Plus size={16} />
                                Add More
                            </button>
                            <button
                                onClick={processAll}
                                disabled={isProcessingAll || images.every(i => i.status === 'completed')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 rounded-2xl bg-white text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest transition hover:bg-cyan-400 active:scale-95 disabled:opacity-30 shadow-xl shadow-cyan-500/10"
                            >
                                {isProcessingAll ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                Process All
                            </button>
                            {images.some(i => i.status === 'completed') && (
                                <button
                                    onClick={downloadAll}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest transition hover:bg-cyan-400 active:scale-95 shadow-xl shadow-cyan-500/20"
                                >
                                    <Download size={16} />
                                    Export All
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Viewport */}
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-12 space-y-8">
                        {images.length === 0 ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`group relative aspect-[4/3] md:aspect-video rounded-[64px] border-2 border-dashed transition-all duration-700 cursor-pointer flex flex-col items-center justify-center gap-8 overflow-hidden ${
                                    isDragging 
                                    ? 'border-cyan-500 bg-cyan-500/10 scale-[0.98] shadow-[0_0_80px_rgba(6,182,212,0.2)]' 
                                    : 'border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/[0.02]'
                                }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="p-8 rounded-[40px] bg-white/5 text-white/20 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-700 group-hover:rotate-12">
                                    <Upload size={56} />
                                </div>
                                <div className="text-center space-y-3 relative z-10">
                                    <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">Drop Images Here</h3>
                                    <p className="text-base text-white/30 font-medium">PNG, JPG or WEBP. Max resolution: 4096px.</p>
                                </div>
                                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-all">
                                    Select Multiple Files
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*" 
                                    multiple
                                    className="hidden" 
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {images.map((img) => (
                                    <div key={img.id} className="group relative flex flex-col rounded-[48px] overflow-hidden bg-white/[0.02] border border-white/10 shadow-xl transition-all hover:border-cyan-500/20">
                                        {/* Image Preview Container */}
                                        <div className="relative aspect-square overflow-hidden bg-[#050c17] flex items-center justify-center group/card" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                            <img 
                                                src={img.processedUrl || img.originalUrl} 
                                                className={`max-w-full max-h-full object-contain transition-all duration-500 ${img.status === 'processing' ? 'opacity-40 scale-95 blur-md' : 'opacity-100'}`} 
                                                alt="Preview"
                                            />
                                            
                                            {/* Top-Right Remove Button */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(img.id);
                                                }}
                                                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 border border-white/10 text-white/40 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all z-30 opacity-0 group-hover/card:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                            
                                            {/* Status Overlay */}
                                            {img.status === 'processing' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                                    <Loader2 size={32} className="text-cyan-500 animate-spin" />
                                                </div>
                                            )}

                                            {img.status === 'completed' && (
                                                <div className="absolute top-4 right-4 p-2 rounded-full bg-emerald-500 text-black shadow-lg">
                                                    <Check size={14} />
                                                </div>
                                            )}

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => removeImage(img.id)}
                                                    className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                {img.status === 'idle' && (
                                                    <button 
                                                        onClick={() => processSingleImage(img.id)}
                                                        className="p-3 rounded-2xl bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
                                                    >
                                                        <Zap size={20} />
                                                    </button>
                                                )}
                                                {img.status === 'completed' && (
                                                    <button 
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = img.processedUrl!;
                                                            a.download = `removed-bg-${img.file.name.split('.')[0]}.png`;
                                                            a.click();
                                                        }}
                                                        className="p-3 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
                                                    >
                                                        <Download size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Meta Footer */}
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="truncate pr-4">
                                                <div className="text-xs font-black text-white truncate">{img.file.name}</div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-black">{(img.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg ${
                                                img.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' :
                                                img.status === 'processing' ? 'text-cyan-400 bg-cyan-400/10' :
                                                'text-white/20 bg-white/5'
                                            }`}>
                                                {img.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-16">
            {[
              { icon: Zap, title: "Pure Speed", desc: "Process high-resolution images in seconds with local WebGPU acceleration." },
              { icon: ShieldCheck, title: "Total Privacy", desc: "Your images never leave your computer. Processing is 100% client-side." },
              { icon: Check, title: "Pro Quality", desc: "Handle complex silhouettes like hair and semi-transparent objects with ease." }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 group">
                <div className="w-16 h-16 rounded-[24px] bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <feature.icon size={32} />
                </div>
                <h4 className="text-2xl font-black text-white mb-3">{feature.title}</h4>
                <p className="text-base text-white/40 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
