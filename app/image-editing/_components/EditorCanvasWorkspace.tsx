"use client";

import { Hand, Maximize2, Minus, Move, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface EditorCanvasWorkspaceProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
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
    // Delay slightly to ensure dimensions are measured correctly
    const timer = setTimeout(centerCanvas, 50);
    return () => clearTimeout(timer);
  }, [editor.canvasDimensions.width, editor.canvasDimensions.height, centerCanvas]);

  // Track Space and Alt keys for panning
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

  // Determine active cursor style
  const canPanMode = isSpacePressed || isAltPressed;
  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : canPanMode
    ? 'cursor-grab'
    : 'cursor-default';

  const scaledWidth = Math.round(editor.canvasDimensions.width * editor.viewportScale);
  const scaledHeight = Math.round(editor.canvasDimensions.height * editor.viewportScale);

  return (
    <section className="relative flex-1 h-full min-w-0 overflow-hidden bg-[#090d16] flex flex-col justify-between">
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Interactive Canvas Scrollable Viewport without flex scroll clipping */}
      <div
        ref={scrollContainerRef}
        id="workspace-scroll-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isPanning) editor.deselectAll();
        }}
        className={`relative z-10 h-full w-full overflow-auto custom-scrollbar select-none ${cursorClass}`}
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
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-sm bg-white shadow-[0_20px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
              style={{
                transform: `scale(${editor.viewportScale})`,
                transformOrigin: 'top left',
                width: editor.canvasDimensions.width,
                height: editor.canvasDimensions.height,
                transition: 'transform 0.08s ease-out',
              }}
            >
              <canvas
                ref={editor.canvasRef}
                id="fabricJsCanvas"
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Drag & Drop Overlay */}
        {editor.somethingDrop && (
          <div className="absolute inset-6 z-40 flex items-center justify-center rounded-3xl border-2 border-dashed border-violet-400 bg-violet-950/60 backdrop-blur-md">
            <div className="rounded-2xl border border-white/10 bg-[#0d121d] px-6 py-5 text-center shadow-2xl">
              <div className="text-base font-bold text-white">Drop image to add to canvas</div>
              <div className="mt-1 text-xs text-white/60">Will be saved permanently as an editable layer.</div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Studio HUD */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
        <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-white/40 border-r border-white/[0.08] pr-2.5">
          <Move size={11} />
          <span>Alt / Space + Drag to Pan</span>
        </span>

        <button
          onClick={() => editor.resizeCanvas("ZoomOut", 0.1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.08] hover:text-white transition"
          title="Zoom Out"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={() => editor.fitCanvasToViewport(editor.canvasDimensions)}
          className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-white/80 hover:bg-white/[0.08] hover:text-white transition"
          title="Reset to Fit Viewport"
        >
          {Math.round(editor.viewportScale * 100)}%
        </button>

        <button
          onClick={() => editor.resizeCanvas("ZoomIn", 0.1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.08] hover:text-white transition"
          title="Zoom In"
        >
          <Plus size={13} />
        </button>

        <button
          onClick={() => {
            editor.fitCanvasToViewport(editor.canvasDimensions);
            setTimeout(centerCanvas, 50);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.08] hover:text-white transition border-l border-white/[0.08] pl-2"
          title="Fit Canvas to Screen"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </section>
  );
}

