"use client";

import React from 'react';
import { Trash2, Play, Square, Plus, Download, Loader2, X } from 'lucide-react';

interface GifTimelineProps {
  frames: string[];
  removeFrame: (index: number) => void;
  addFrame: () => void;
  clearFrames: () => void;
  exportGif: () => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  previewIdx: number;
  isExporting?: boolean;
}

export function GifTimeline({
  frames,
  removeFrame,
  addFrame,
  clearFrames,
  exportGif,
  isPlaying,
  setIsPlaying,
  previewIdx,
  isExporting = false
}: GifTimelineProps) {
  const [confirmingDelete, setConfirmingDelete] = React.useState<number | null>(null);

  return (
    <div className='mt-auto border-t border-white/10 bg-[#09182b]/95 p-4 sm:p-6 backdrop-blur-xl shrink-0'>
      <div className='flex flex-col gap-4'>
        {/* Top Section: Frame Preview (Always above controls on mobile) */}
        <div className='flex flex-1 items-center gap-3 overflow-x-auto pb-1 scrollbar-hide bg-white/5 rounded-2xl p-3 min-h-[80px]'>
          {frames.length === 0 ? (
            <div className='flex h-14 w-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white/20 italic'>
              No frames captured
            </div>
          ) : (
            frames.map((frame, idx) => (
              <div 
                key={idx} 
                className={`group relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-28 ${
                  isPlaying && previewIdx === idx ? 'border-cyan-400 scale-105 z-10 shadow-lg shadow-cyan-500/20' : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
              >
                <img src={frame} alt={`Frame ${idx}`} className='h-full w-full object-cover' />
                <div className='absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white sm:text-[10px]'>
                  #{idx + 1}
                </div>
                
                {/* Delete Button (Icon) - Subtle but visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDelete(idx);
                  }}
                  className='absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-md transition-all hover:bg-rose-500 hover:scale-110'
                  title="Delete Frame"
                >
                  <Trash2 size={12} />
                </button>

                {/* Confirmation Box Overlay */}
                {confirmingDelete === idx && (
                  <div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#09182b]/95 p-1 backdrop-blur-sm animate-in fade-in duration-200'>
                    <div className='text-[8px] font-black uppercase tracking-tighter text-white mb-1'>Delete?</div>
                    <div className='flex gap-1.5'>
                      <button
                        onClick={() => {
                          removeFrame(idx);
                          setConfirmingDelete(null);
                        }}
                        className='flex h-6 w-6 items-center justify-center rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors'
                        title="Yes, Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        className='flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors'
                        title="Cancel"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Controls */}
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={frames.length === 0}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl ${
                isPlaying 
                  ? 'bg-rose-500 text-white shadow-rose-500/20' 
                  : 'bg-cyan-500 text-black shadow-cyan-500/20 hover:bg-cyan-400'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            
            <div className='hidden xs:block'>
              <div className='text-[10px] font-black uppercase tracking-widest text-cyan-200/50 sm:text-xs'>Animation</div>
              <div className='text-[10px] font-bold text-white/40 sm:text-xs'>{frames.length} Captured</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={addFrame}
              className='flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 active:scale-95 sm:px-5 sm:py-3.5 sm:text-sm'
            >
              <Plus size={16} />
              <span className='hidden sm:inline'>Capture</span>
              <span className='sm:hidden'>Cap</span>
            </button>
            
            <div className='flex items-center gap-2 ml-2 pl-2 border-l border-white/10'>
              <button
                onClick={exportGif}
                disabled={isExporting || frames.length === 0}
                className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-400 disabled:opacity-30 disabled:cursor-not-allowed sm:px-6 sm:py-3.5 sm:text-sm'
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span className='hidden sm:inline'>{isExporting ? 'Processing...' : 'Export GIF'}</span>
                <span className='sm:hidden'>Export</span>
              </button>

              {frames.length > 0 && (
                 <button
                  onClick={clearFrames}
                  className='p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all border border-white/5 hover:border-rose-500/30 sm:p-3.5'
                  title="Clear All Frames"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
