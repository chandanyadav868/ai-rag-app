"use client";

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  X,
  Crop as CropIcon,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Square,
  Smartphone,
  Tv,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    id: string;
    name: string;
    originalUrl: string;
    processedUrl: string | null;
  } | null;
  onApplyCrop: (croppedOriginalUrl: string, croppedProcessedUrl: string | null, shouldReprocess: boolean) => void;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined, icon: CropIcon },
  { label: '1:1 Square', value: 1, icon: Square },
  { label: '4:5 Portrait', value: 4 / 5, icon: Smartphone },
  { label: '16:9 Landscape', value: 16 / 9, icon: Tv },
  { label: '9:16 Story', value: 9 / 16, icon: Smartphone },
  { label: '4:3 Standard', value: 4 / 3, icon: Monitor },
  { label: '3:2 Photo', value: 3 / 2, icon: ImageIcon }
];

export default function ImageCropModal({
  isOpen,
  onClose,
  image,
  onApplyCrop
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [activePreview, setActivePreview] = useState<'original' | 'cutout'>('original');
  const [shouldReprocess, setShouldReprocess] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize crop centered on image load
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      aspect
        ? makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height)
        : { unit: '%', x: 5, y: 5, width: 90, height: 90 },
      width,
      height
    );
    setCrop(initialCrop);
  }, [aspect]);

  // Change aspect ratio
  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        newAspect
          ? makeAspectCrop({ unit: '%', width: 90 }, newAspect, width, height)
          : { unit: '%', x: 5, y: 5, width: 90, height: 90 },
        width,
        height
      );
      setCrop(newCrop);
    }
  };

  // Reset to full image
  const handleReset = () => {
    if (imgRef.current) {
      setAspect(undefined);
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    }
  };

  // Extract high-res crop using HTML5 Canvas
  const getCroppedUrl = async (sourceUrl: string, pixelCrop: PixelCrop): Promise<string> => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = sourceUrl;
    });

    if (!imgRef.current) throw new Error('Preview element missing');

    const scaleX = img.naturalWidth / imgRef.current.width;
    const scaleY = img.naturalHeight / imgRef.current.height;

    const canvas = document.createElement('canvas');
    const targetW = Math.max(1, Math.round(pixelCrop.width * scaleX));
    const targetH = Math.max(1, Math.round(pixelCrop.height * scaleY));
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D canvas context');

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      Math.round(pixelCrop.x * scaleX),
      Math.round(pixelCrop.y * scaleY),
      targetW,
      targetH,
      0,
      0,
      targetW,
      targetH
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate crop blob'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    });
  };

  // Apply crop
  const handleApply = async () => {
    if (!image || !completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0) {
      toast.error('Please select an area to crop');
      return;
    }

    setIsApplying(true);
    try {
      // 1. Always crop original image
      const croppedOrigUrl = await getCroppedUrl(image.originalUrl, completedCrop);

      // 2. If cutout exists and user wants to keep it without re-running AI, crop cutout too
      let croppedProcUrl: string | null = null;
      if (image.processedUrl && !shouldReprocess) {
        croppedProcUrl = await getCroppedUrl(image.processedUrl, completedCrop);
      }

      onApplyCrop(croppedOrigUrl, croppedProcUrl, shouldReprocess);
      toast.success(
        shouldReprocess
          ? 'Image cropped! Starting fresh background removal...'
          : 'Image cropped successfully!'
      );
      onClose();
    } catch (err: any) {
      console.error('Cropping error:', err);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen || !image) return null;

  // Calculate resolution
  const cropDimensions = completedCrop && imgRef.current ? {
    width: Math.round(completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width)),
    height: Math.round(completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height))
  } : null;

  const currentDisplayUrl = activePreview === 'cutout' && image.processedUrl
    ? image.processedUrl
    : image.originalUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#091528] border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#060D1A]/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 shadow-sm">
              <CropIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Crop & Adjust Image Size
                {cropDimensions && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                    {cropDimensions.width} × {cropDimensions.height} px
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Drag corner handles to adjust the frame or select a quick aspect ratio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aspect Ratio Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-white/10 bg-[#0a1830]/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Aspect:
            </span>
            {ASPECT_RATIOS.map((item) => {
              const Icon = item.icon;
              const isSelected = aspect === item.value;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAspectChange(item.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Icon size={12} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Reset & Preview Switcher */}
          <div className="flex items-center gap-2">
            {image.processedUrl && (
              <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/5">
                <button
                  type="button"
                  onClick={() => setActivePreview('original')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    activePreview === 'original'
                      ? 'bg-white/10 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreview('cutout')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    activePreview === 'cutout'
                      ? 'bg-white/10 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cutout
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition"
              title="Reset Crop to Full Area"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Crop Viewport Area */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-black/50 select-none min-h-[300px] max-h-[55vh]">
          <div
            className="rounded-2xl p-2 border border-white/10 flex items-center justify-center"
            style={{
              background: 'repeating-conic-gradient(#151f30 0% 25%, #0b1220 0% 50%) 50% / 16px 16px'
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[50vh] max-w-full rounded-xl overflow-hidden shadow-2xl"
            >
              <img
                ref={imgRef}
                src={currentDisplayUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[50vh] max-w-full object-contain"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-[#060D1A]/80">
          {/* Option: Re-run AI after cropping if image was already processed */}
          {image.processedUrl ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={shouldReprocess}
                onChange={(e) => setShouldReprocess(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-500 accent-cyan-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Re-run AI Background Removal on Cropped Area</span>
              </span>
            </label>
          ) : (
            <div className="text-xs text-slate-400">
              Cropping reduces processing time and sharpens object focus
            </div>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition border border-white/10 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isApplying ? 'Applying Crop...' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
