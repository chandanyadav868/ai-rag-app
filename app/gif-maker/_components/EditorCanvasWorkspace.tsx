"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GifTimeline } from './GifTimeline';
import { useGifEditor } from '../_hooks/useGifEditor';
import { Eye, Edit3, Save, Sparkles, Play, Square, CloudUpload, Plus, Camera } from 'lucide-react';

interface EditorCanvasWorkspaceProps {
  editor: ReturnType<typeof useGifEditor>;
}

export function EditorCanvasWorkspace({ editor }: EditorCanvasWorkspaceProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Center canvas in viewport on mount and when dimensions change
  const centerCanvas = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
      container.scrollTop = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(centerCanvas, 60);
    return () => clearTimeout(timer);
  }, [editor.canvasDimensions.width, editor.canvasDimensions.height, centerCanvas]);

  // Track Space and Alt keys for 2D interactive canvas panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
      if (isInput) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.altKey) {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
      if (!e.altKey) {
        setIsAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle pointer panning events
  const handlePointerDown = (e: React.PointerEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Pan triggered by Alt key, Space key, or Middle Mouse Button (button 1)
    const canPan = e.altKey || isSpacePressed || e.button === 1;
    if (canPan) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    e.preventDefault();
    const container = scrollContainerRef.current;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    container.scrollLeft = panStartRef.current.scrollLeft - dx;
    container.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Ctrl + Wheel / Pinch Zoom support on workspace container
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      editor.resizeCanvas(delta > 0 ? "ZoomIn" : "ZoomOut", Math.abs(delta));
    }
  };

  const touchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialMidpoint: { x: number; y: number };
    initialScroll: { left: number; top: number };
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const container = scrollContainerRef.current;
      if (container) {
        touchStateRef.current = {
          initialDistance: dist,
          initialScale: editor.viewportScale,
          initialMidpoint: { x: midX, y: midY },
          initialScroll: { left: container.scrollLeft, top: container.scrollTop },
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const scaleFactor = dist / touchStateRef.current.initialDistance;
      const newScale = Math.max(0.2, Math.min(3, Number((touchStateRef.current.initialScale * scaleFactor).toFixed(2))));
      editor.setViewportScale(newScale);

      const deltaX = midX - touchStateRef.current.initialMidpoint.x;
      const deltaY = midY - touchStateRef.current.initialMidpoint.y;
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollLeft = touchStateRef.current.initialScroll.left - deltaX;
        container.scrollTop = touchStateRef.current.initialScroll.top - deltaY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStateRef.current = null;
    }
  };

  const canPanMode = isSpacePressed || isAltPressed;
  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : canPanMode
    ? 'cursor-grab'
    : 'cursor-default';

  const scaledWidth = Math.round(editor.canvasDimensions.width * editor.viewportScale);
  const scaledHeight = Math.round(editor.canvasDimensions.height * editor.viewportScale);

  // Sync canvas display with selected frame or live playback (Audio 3 Fix)
  const isDisplayingFrame = (editor.isPlaying || editor.stageMode === 'frame') && editor.frames.length > 0;
  const currentFrameIdx = editor.isPlaying ? editor.previewIdx : (editor.activeFrameIndex ?? 0);
  const currentFrameSrc = editor.frames[currentFrameIdx];

  return (
    <section className={`relative flex-1 h-full min-w-0 overflow-hidden bg-[#07111f] flex flex-col justify-between canvas-touch-guard transition-all duration-300 ${
      editor.leftPanelOpen ? 'md:ml-[min(90vw,340px)]' : ''
    } ${
      editor.rightPanelOpen ? 'md:mr-[420px]' : ''
    }`}>
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,240,255,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Floating Stage Mode Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-[#081221]/90 border border-white/10 px-3.5 py-1.5 backdrop-blur-xl shadow-2xl">
        {editor.isPlaying ? (
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-300">Playing Frame #{editor.previewIdx + 1} of {editor.frames.length}</span>
          </div>
        ) : isDisplayingFrame ? (
          <div className="flex items-center gap-2.5 text-xs font-bold text-white">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-cyan-300">Frame #{currentFrameIdx + 1} Preview</span>
            </div>
            <div className="w-px h-3.5 bg-white/20" />
            <button
              onClick={() => editor.setStageMode('canvas')}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider transition border border-cyan-400/30"
              title="Switch to interactive canvas layer editing"
            >
              <Edit3 size={11} />
              <span>Live Edit</span>
            </button>
            <button
              onClick={editor.updateActiveFrameFromCanvas}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider transition border border-amber-400/30"
              title="Save current canvas state to this frame"
            >
              <Save size={11} />
              <span>Update Frame</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-white/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Interactive Canvas Mode</span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            {/* Quick Add Frame buttons directly on Canvas */}
            <button
              onClick={editor.addFrame}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider transition border border-cyan-400/30 active:scale-95"
              title="Capture current canvas artwork as a frame"
            >
              <Camera size={11} />
              <span>Capture Frame</span>
            </button>

            <button
              onClick={() => editor.addEmptyFrame?.()}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold tracking-wider transition border border-white/10 active:scale-95"
              title="Add an empty/blank frame to timeline"
            >
              <Plus size={11} />
              <span>+ Empty Frame</span>
            </button>

            {editor.frames.length > 0 && (
              <button
                onClick={() => {
                  editor.setActiveFrameIndex(0);
                  editor.setStageMode('frame');
                }}
                className="ml-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition"
              >
                ({editor.frames.length} Frames)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Interactive Canvas Scrollable Viewport */}
      <div
        ref={scrollContainerRef}
        id="workspace-scroll-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isPanning) editor.deselectAll();
        }}
        className={`relative z-10 flex-1 w-full overflow-auto custom-scrollbar select-none ${cursorClass}`}
      >
        {/* Generous padding ensures full top/bottom/left/right scrolling without clipping */}
        <div className="min-w-max min-h-max p-[40vh_40vw] flex items-center justify-center">
          <div
            className="relative m-auto shrink-0"
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            <div
              ref={editor.canvasDivRef}
              onClick={(e) => {
                e.stopPropagation();
                if (isDisplayingFrame && !editor.isPlaying) {
                  editor.setStageMode('canvas');
                }
              }}
              className="relative rounded-sm bg-white shadow-[0_20px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden"
              style={{
                width: scaledWidth,
                height: scaledHeight,
                transition: 'width 0.08s ease-out, height 0.08s ease-out',
              }}
            >
              {/* Interactive Fabric Canvas */}
              <canvas
                ref={editor.canvasRef}
                id="fabricJsCanvas"
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent"
                style={{
                  display: isDisplayingFrame ? 'none' : 'block'
                }}
              />

              {/* Real-time Rendered Frame Snapshot Overlay (Audio 3 Fix) */}
              {isDisplayingFrame && currentFrameSrc && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-transparent pointer-events-none">
                  <img
                    src={currentFrameSrc}
                    alt={`Frame ${currentFrameIdx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-End Drag & Drop Studio Overlay - perfectly centered in viewport */}
      {editor.somethingDrop && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-400/80 bg-[#0d1322]/95 px-8 py-7 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/10 max-w-sm text-center">
            <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-400 animate-bounce">
              <CloudUpload size={28} />
            </div>
            <div className="text-base font-black tracking-wide text-white">Drop Image to Add to Canvas</div>
            <div className="mt-1 text-xs text-white/60">PNG, JPG, WebP supported for GIF compositing</div>
          </div>
        </div>
      )}

      {/* Bottom Timeline Dock */}
      <GifTimeline editor={editor} />
    </section>
  );
}
