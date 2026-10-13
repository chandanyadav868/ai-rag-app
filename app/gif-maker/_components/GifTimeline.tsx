"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  Play,
  Square,
  Plus,
  Loader2,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Repeat,
  Gauge,
  Film,
  Check,
  Save,
  Camera,
} from 'lucide-react';
import { useGifEditor } from '../_hooks/useGifEditor';

interface GifTimelineProps {
  editor: ReturnType<typeof useGifEditor>;
}

export function GifTimeline({ editor }: GifTimelineProps) {
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const speedOptions = [
    { label: "24 FPS (41ms) - Silky", delay: 41 },
    { label: "20 FPS (50ms) - Smooth", delay: 50 },
    { label: "15 FPS (66ms) - Fast", delay: 66 },
    { label: "12 FPS (83ms) - Standard", delay: 83 },
    { label: "10 FPS (100ms)", delay: 100 },
    { label: "5 FPS (200ms)", delay: 200 },
    { label: "4 FPS (250ms)", delay: 250 },
    { label: "2 FPS (500ms)", delay: 500 },
    { label: "1 FPS (1000ms)", delay: 1000 },
  ];

  const handleSelectFrame = (idx: number) => {
    editor.setActiveFrameIndex(idx);
    editor.setPreviewIdx(idx);
    editor.setStageMode('frame');

    if (filmstripRef.current) {
      if (idx === 0) {
        filmstripRef.current.scrollTo({ left: 0, behavior: 'instant' });
      } else {
        const el = document.getElementById(`timeline-frame-${idx}`);
        if (el) {
          const cRect = filmstripRef.current.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          if (elRect.left < cRect.left) {
            filmstripRef.current.scrollTo({
              left: Math.max(0, filmstripRef.current.scrollLeft - (cRect.left - elRect.left + 24)),
              behavior: 'smooth',
            });
          } else if (elRect.right > cRect.right) {
            filmstripRef.current.scrollTo({
              left: filmstripRef.current.scrollLeft + (elRect.right - cRect.right + 24),
              behavior: 'smooth',
            });
          }
        }
      }
    }
  };

  const jumpToStart = () => {
    if (filmstripRef.current) {
      filmstripRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
    if (editor.frames.length > 0) {
      handleSelectFrame(0);
    }
  };

  const jumpToEnd = () => {
    if (filmstripRef.current) {
      filmstripRef.current.scrollTo({ left: filmstripRef.current.scrollWidth, behavior: 'instant' });
    }
    if (editor.frames.length > 0) {
      handleSelectFrame(editor.frames.length - 1);
    }
  };

  const scrollFilmstrip = (direction: 'left' | 'right') => {
    if (filmstripRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      filmstripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Enable mouse wheel horizontal scrolling over the filmstrip
  const handleFilmstripWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!filmstripRef.current) return;
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    filmstripRef.current.scrollLeft += delta;
  };

  // Safe auto-scroll ONLY during active playback if preview frame moves out of visible bounds
  useEffect(() => {
    if (!editor.isPlaying || !filmstripRef.current) return;
    const container = filmstripRef.current;

    // When looping back to frame #1 (index 0), immediately snap scroll to 0
    if (editor.previewIdx === 0) {
      container.scrollTo({ left: 0, behavior: 'instant' });
      return;
    }

    const el = document.getElementById(`timeline-frame-${editor.previewIdx}`);
    if (el) {
      const cRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      if (elRect.right > cRect.right - 20) {
        container.scrollTo({ left: container.scrollLeft + (elRect.right - cRect.right + 30), behavior: 'smooth' });
      } else if (elRect.left < cRect.left + 20) {
        container.scrollTo({ left: Math.max(0, container.scrollLeft - (cRect.left - elRect.left + 30)), behavior: 'smooth' });
      }
    }
  }, [editor.isPlaying, editor.previewIdx]);

  // Ensure scroll position resets to start when frames are cleared or frame #1 is active
  useEffect(() => {
    if (filmstripRef.current && (editor.frames.length <= 1 || editor.activeFrameIndex === 0)) {
      filmstripRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [editor.frames.length, editor.activeFrameIndex]);


  return (
    <div className="relative z-20 mt-auto border-t border-white/10 bg-[#081221]/95 backdrop-blur-2xl px-2 py-2 sm:px-6 sm:py-3.5 shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] select-none w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Header: Timeline Transport Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5 lg:gap-3 pb-2 border-b border-white/5 w-full min-w-0">
        {/* Controls Row on Mobile/Tablet / Left+Center on Desktop */}
        <div className="flex items-center justify-between lg:justify-start gap-1.5 sm:gap-3 w-full lg:w-auto min-w-0">
          {/* Play / Stop Toggle Button & Desktop Label */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (!editor.isPlaying) {
                  editor.setStageMode('frame');
                }
                editor.setIsPlaying(!editor.isPlaying);
              }}
              disabled={editor.frames.length === 0}
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl transition-all shadow-md shrink-0 ${
                editor.isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/25 animate-pulse'
                  : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black shadow-cyan-500/20 hover:brightness-110 active:scale-95'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={editor.isPlaying ? "Stop Loop" : "Play Loop"}
            >
              {editor.isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              <Film size={15} className="text-cyan-400" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-200/50">Timeline</div>
                <div className="text-[11px] font-bold text-white/80 whitespace-nowrap">
                  {editor.frames.length === 0
                    ? "0 Frames"
                    : editor.isPlaying
                    ? `Playing Frame #${editor.previewIdx + 1} of ${editor.frames.length}`
                    : editor.activeFrameIndex !== null
                    ? `Active Frame #${editor.activeFrameIndex + 1} of ${editor.frames.length}`
                    : `${editor.frames.length} Frames`}
                </div>
              </div>
            </div>
          </div>

          {/* Steppers */}
          {editor.frames.length > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-white/10 shrink-0">
              <button
                onClick={jumpToStart}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black text-cyan-300 hover:bg-cyan-400/20 transition flex items-center gap-0.5"
                title="Jump directly to Frame #1"
              >
                <ChevronsLeft size={12} />
                <span className="hidden xs:inline">#1</span>
              </button>
              <button
                onClick={() => {
                  const current = editor.activeFrameIndex ?? 0;
                  if (current > 0) handleSelectFrame(current - 1);
                }}
                disabled={(editor.activeFrameIndex ?? 0) <= 0}
                className="p-0.5 sm:p-1 rounded-md sm:rounded-lg text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition"
                title="Previous Frame"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white px-0.5 sm:px-1">
                {(editor.activeFrameIndex ?? 0) + 1}/{editor.frames.length}
              </span>
              <button
                onClick={() => {
                  const current = editor.activeFrameIndex ?? 0;
                  if (current < editor.frames.length - 1) handleSelectFrame(current + 1);
                }}
                disabled={(editor.activeFrameIndex ?? 0) >= editor.frames.length - 1}
                className="p-0.5 sm:p-1 rounded-md sm:rounded-lg text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition"
                title="Next Frame"
              >
                <ChevronRight size={12} />
              </button>
              <button
                onClick={jumpToEnd}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black text-cyan-300 hover:bg-cyan-400/20 transition flex items-center gap-0.5"
                title="Jump directly to Last Frame"
              >
                <span className="hidden xs:inline">#{editor.frames.length}</span>
                <ChevronsRight size={12} />
              </button>
            </div>
          )}

          {/* Speed & Loop Group */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Frame Rate / Delay Dropdown */}
            <div className="flex items-center gap-1 rounded-lg sm:rounded-xl border border-white/10 bg-white/5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white/70 shrink-0">
              <Gauge size={11} className="text-cyan-400 shrink-0" />
              <select
                value={editor.frameDelay}
                onChange={(e) => editor.setFrameDelay(Number(e.target.value))}
                className="bg-transparent text-[10px] sm:text-[11px] font-bold text-white outline-none cursor-pointer"
                title="Animation Frame Speed"
              >
                {speedOptions.map((opt) => (
                  <option key={opt.delay} value={opt.delay} className="bg-[#09182b] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loop Setting Button */}
            <button
              onClick={() => editor.setLoopCount(editor.loopCount === 0 ? 1 : 0)}
              className={`flex items-center gap-1 rounded-lg sm:rounded-xl border px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold transition whitespace-nowrap shrink-0 ${
                editor.loopCount === 0
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
              }`}
              title="Loop Count Toggle"
            >
              <Repeat size={11} className="shrink-0" />
              <span>{editor.loopCount === 0 ? 'Loop: ∞' : '1x'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row on Mobile/Tablet / Right Group on Desktop */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto shrink-0 min-w-0 pt-0.5 lg:pt-0">
          {/* If inspecting an active frame, allow 1-click update from canvas */}
          {editor.activeFrameIndex !== null && !editor.isPlaying && editor.frames.length > 0 && (
            <button
              onClick={editor.updateActiveFrameFromCanvas}
              className="flex items-center gap-1 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-400/30 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/25 active:scale-95 shadow-sm shadow-amber-500/10 whitespace-nowrap shrink-0"
              title={`Save current canvas changes to Frame #${editor.activeFrameIndex + 1}`}
            >
              <Save size={12} className="shrink-0" />
              <span>Save #{editor.activeFrameIndex + 1}</span>
            </button>
          )}

          {/* Capture Canvas Frame */}
          <button
            onClick={editor.addFrame}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black text-black transition-all hover:brightness-110 active:scale-95 shadow-md shadow-cyan-500/20 whitespace-nowrap"
            title="Capture current canvas as a new frame"
          >
            <Camera size={13} className="shrink-0" />
            <span>Capture Frame</span>
          </button>

          {/* New Add Empty Frame */}
          <button
            onClick={() => editor.addEmptyFrame?.()}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-white/10 border border-white/15 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95 shadow-sm whitespace-nowrap"
            title="Add a new blank/empty canvas frame"
          >
            <Plus size={13} className="shrink-0" />
            <span>Empty Frame</span>
          </button>

          {editor.frames.length > 0 && (
            <button
              onClick={editor.clearFrames}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-white/5 bg-white/5 text-white/40 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 transition shrink-0"
              title="Clear all frames"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Frame Filmstrip Track with High-Visibility Scrollbar and Navigation Arrows */}
      <div className="relative mt-1 sm:mt-2 w-full min-w-0 overflow-hidden group/filmstrip">
        {/* Left Quick Jump Arrow */}
        {editor.frames.length > 3 && (
          <button
            onClick={jumpToStart}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#081221]/95 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-400 hover:text-black shadow-xl transition active:scale-95"
            title="Jump to Frame #1"
          >
            <ChevronsLeft size={13} />
          </button>
        )}

        {/* Right Quick Jump Arrow */}
        {editor.frames.length > 3 && (
          <button
            onClick={jumpToEnd}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#081221]/95 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-400 hover:text-black shadow-xl transition active:scale-95"
            title="Jump to Last Frame"
          >
            <ChevronsRight size={13} />
          </button>
        )}

        {/* The Filmstrip Horizontal Scroll Container */}
        <div
          ref={filmstripRef}
          onWheel={handleFilmstripWheel}
          tabIndex={0}
          className="flex items-center gap-2 overflow-x-scroll pb-2 pt-1 px-6 sm:px-8 custom-filmstrip-scrollbar min-h-[72px] sm:min-h-[88px] w-full min-w-0 outline-none"
        >
          {editor.frames.length === 0 ? (
            <div className="flex flex-col sm:flex-row h-auto py-3 px-5 w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-500/[0.04]">
              <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
                <Sparkles size={14} className="text-cyan-400" />
                No frames captured yet. Start animating:
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={editor.addFrame}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs hover:brightness-110 active:scale-95 shadow-md shadow-cyan-500/20 transition"
                  title="Capture current canvas artwork as Frame #1"
                >
                  <Camera size={13} />
                  <span>Capture Frame</span>
                </button>
                <button
                  onClick={() => editor.addEmptyFrame?.()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 active:scale-95 transition"
                  title="Add a new blank/empty canvas frame"
                >
                  <Plus size={13} />
                  <span>+ Empty Frame</span>
                </button>
              </div>
            </div>
          ) : (
            editor.frames.map((frame, idx) => {
              const isActive = editor.isPlaying
                ? editor.previewIdx === idx
                : editor.activeFrameIndex === idx;

              return (
                <React.Fragment key={idx}>
                  {/* Frame Thumbnail Card - Compact & Fully Clickable */}
                  <div
                    id={`timeline-frame-${idx}`}
                    onClick={() => handleSelectFrame(idx)}
                    className={`group relative h-14 w-18 sm:h-18 sm:w-24 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-400 scale-[1.03] z-10 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-400/50'
                        : 'border-white/10 hover:border-white/40 bg-black/40'
                    }`}
                  >
                    <img src={frame} alt={`Frame ${idx + 1}`} className="h-full w-full object-contain pointer-events-none" />
                    
                    {/* Frame Index Pill */}
                    <div
                      className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-black backdrop-blur-sm border ${
                        isActive
                          ? 'bg-cyan-400 text-black border-cyan-400 shadow-sm'
                          : 'bg-black/75 text-cyan-300 border-white/10'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    {/* Active State Pill */}
                    {isActive && (
                      <div className="absolute top-1 left-1 rounded bg-cyan-400/90 text-black px-1 text-[8px] font-black uppercase tracking-wider">
                        Active
                      </div>
                    )}

                    {/* Top-Right Quick Frame Actions (Duplicate, Delete, Move) */}
                    <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {/* Move Left */}
                      {idx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editor.reorderFrames(idx, idx - 1);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white/70 hover:text-white hover:bg-white/20 transition"
                          title="Move Frame Earlier"
                        >
                          <ChevronLeft size={11} />
                        </button>
                      )}

                      {/* Move Right */}
                      {idx < editor.frames.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editor.reorderFrames(idx, idx + 1);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white/70 hover:text-white hover:bg-white/20 transition"
                          title="Move Frame Later"
                        >
                          <ChevronRight size={11} />
                        </button>
                      )}

                      {/* Duplicate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editor.duplicateFrame(idx);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white/70 hover:text-cyan-300 hover:bg-cyan-500/20 transition"
                        title="Duplicate Frame"
                      >
                        <Copy size={10} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDelete(idx);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white/70 hover:text-rose-400 hover:bg-rose-500/20 transition"
                        title="Delete Frame"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    {confirmingDelete === idx && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#09182b]/95 p-1 backdrop-blur-sm animate-in fade-in duration-150">
                        <div className="text-[9px] font-black uppercase tracking-tight text-white mb-1.5">Delete?</div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.removeFrame(idx);
                              setConfirmingDelete(null);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500 text-white hover:bg-rose-600 transition"
                            title="Confirm Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmingDelete(null);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition"
                            title="Cancel"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transition Trigger Button between adjacent frames */}
                  {idx < editor.frames.length - 1 && (
                    <button
                      onClick={() => {
                        editor.setTransitionTarget(idx);
                        editor.setLayerMenu("Transition");
                        editor.setRightPanelOpen(true);
                      }}
                      className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-full border transition-all ${
                        editor.transitionTarget === idx && editor.layerMenu === "Transition"
                          ? 'bg-cyan-400 text-black border-cyan-400 shadow-md shadow-cyan-400/40 ring-2 ring-cyan-400'
                          : 'border-white/10 bg-white/5 text-white/40 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-white/10'
                      }`}
                      title={`Blend Frame #${idx + 1} and Frame #${idx + 2} (Configure in Inspector)`}
                    >
                      <Sparkles size={11} />
                    </button>
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Quick Add Frame Cards at the end of filmstrip */}
          {editor.frames.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <button
                onClick={editor.addFrame}
                className="group flex flex-col items-center justify-center h-16 w-16 sm:h-18 sm:w-18 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15 hover:border-cyan-400 transition text-cyan-300 active:scale-95"
                title="Capture current canvas as next frame"
              >
                <Camera size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold mt-0.5">Capture</span>
              </button>
              <button
                onClick={() => editor.addEmptyFrame?.()}
                className="group flex flex-col items-center justify-center h-16 w-16 sm:h-18 sm:w-18 rounded-xl border border-dashed border-white/20 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/40 transition text-white/70 hover:text-white active:scale-95"
                title="Add a new blank/empty frame"
              >
                <Square size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold mt-0.5">+ Empty</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
