"use client";

import React from 'react';
import { X, Play, Square } from 'lucide-react';

interface GifPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: string[];
  previewIdx: number;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

export function GifPreviewModal({
  isOpen,
  onClose,
  frames,
  previewIdx,
  isPlaying,
  setIsPlaying
}: GifPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8'>
      <div className='relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-white/10 bg-[#09182b] shadow-[0_32px_120px_rgba(0,0,0,0.8)]'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-8 py-6'>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70'>Preview Mode</div>
            <h2 className='mt-1 text-2xl font-black text-white'>Animation Preview</h2>
          </div>
          <button
            onClick={onClose}
            className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/50 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/10 hover:border-rose-500/30'
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className='flex flex-col items-center justify-center p-8 sm:p-12'>
          <div className='relative aspect-video w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl'>
            {frames.length > 0 ? (
              <img 
                src={frames[previewIdx]} 
                alt={`Preview Frame ${previewIdx}`} 
                className='h-full w-full object-contain'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-white/20 text-sm italic'>
                No frames captured to preview.
              </div>
            )}
            
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-bold text-white/80 backdrop-blur-md border border-white/10'>
              Frame {previewIdx + 1} of {frames.length}
            </div>
          </div>

          {/* Controls */}
          <div className='mt-10 flex items-center gap-6'>
             <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex h-16 w-16 items-center justify-center rounded-3xl transition-all shadow-xl ${
                isPlaying 
                  ? 'bg-rose-500 text-white shadow-rose-500/20' 
                  : 'bg-cyan-500 text-black shadow-cyan-500/20 hover:bg-cyan-400'
              }`}
            >
              {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className='text-left'>
              <div className='text-sm font-bold text-white'>{isPlaying ? 'Playing Animation' : 'Paused'}</div>
              <div className='text-xs text-white/40'>Playback Speed: 500ms / Frame</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
