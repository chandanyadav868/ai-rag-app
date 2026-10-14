"use client";

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Scissors,
  Clock,
  Sparkles,
  GripVertical,
  Trash2,
  Move,
  RotateCw,
} from 'lucide-react';
import { useVideoToGif } from '../_hooks/useVideoToGif';

interface VideoTrimmerProps {
  engine: ReturnType<typeof useVideoToGif>;
}

export function VideoTrimmer({ engine }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Timeline dragging state & safeguards
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'window' | null>(null);
  const dragStartRef = useRef<{ clientX: number; startTime: number; endTime: number }>({ clientX: 0, startTime: 0, endTime: 0 });
  const didDragRef = useRef(false);
  const lastPointerUpTimeRef = useRef(0);

  // Overlay pointer dragging & rotation state
  const [activeOverlayDrag, setActiveOverlayDrag] = useState<string | null>(null);
  const overlayDragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({ clientX: 0, clientY: 0, startX: 50, startY: 50 });
  const [activeRotateId, setActiveRotateId] = useState<string | null>(null);
  const rotateStartRef = useRef<{ centerX: number; centerY: number }>({ centerX: 0, centerY: 0 });

  const {
    videoUrl,
    videoMeta,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedDuration,
    fps,
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    updateOverlay,
    removeOverlay,
  } = engine;

  // Sync internal video ref with engine
  useEffect(() => {
    if (videoRef.current) {
      engine.videoElementRef.current = videoRef.current;
    }
  }, [engine]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If at or past end of trimmed range, restart from startTime
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Video time update listener with loop-within-trim enforcement
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Loop back to start of trim if playback passes endTime
    if (isPlaying && cur >= endTime) {
      videoRef.current.currentTime = startTime;
    }
  };

  // Precision step frames (+/- 0.1s)
  const stepTime = (delta: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(videoMeta?.duration || 0, Math.max(0, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Jump to exact start or end
  const jumpToStart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    setCurrentTime(startTime);
  };

  const jumpToEnd = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = endTime;
    setCurrentTime(endTime);
  };

  // Handle trimming adjustments
  const handleStartChange = (val: number) => {
    const newStart = Math.max(0, Math.min(val, endTime - 0.2));
    setStartTime(Number(newStart.toFixed(2)));
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
      setCurrentTime(newStart);
    }
  };

  const handleEndChange = (val: number) => {
    const maxDur = videoMeta?.duration || 10;
    const newEnd = Math.min(maxDur, Math.max(val, startTime + 0.2));
    setEndTime(Number(newEnd.toFixed(2)));
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
      setCurrentTime(newEnd);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  const duration = videoMeta?.duration || 1;
  const startPercent = Math.min(100, Math.max(0, (startTime / duration) * 100));
  const endPercent = Math.min(100, Math.max(0, (endTime / duration) * 100));
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const estimatedFrames = Math.max(1, Math.round(selectedDuration * fps));

  // Pointer-based dual handle dragging
  const getTimeFromPointer = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Number((ratio * duration).toFixed(2));
  };

  const handlePointerDown = (type: 'start' | 'end' | 'window', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag(type);
    didDragRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      startTime: startTime,
      endTime: endTime,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !trackRef.current) return;
    if (Math.abs(e.clientX - dragStartRef.current.clientX) > 2) {
      didDragRef.current = true;
    }

    const currentT = getTimeFromPointer(e.clientX);

    if (activeDrag === 'start') {
      const newStart = Math.max(0, Math.min(currentT, endTime - 0.2));
      setStartTime(Number(newStart.toFixed(2)));
      if (videoRef.current) {
        videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      }
    } else if (activeDrag === 'end') {
      const newEnd = Math.min(duration, Math.max(currentT, startTime + 0.2));
      setEndTime(Number(newEnd.toFixed(2)));
      if (videoRef.current) {
        videoRef.current.currentTime = newEnd;
        setCurrentTime(newEnd);
      }
    } else if (activeDrag === 'window') {
      const deltaX = e.clientX - dragStartRef.current.clientX;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaTime = (deltaX / rect.width) * duration;
      const clipLen = dragStartRef.current.endTime - dragStartRef.current.startTime;

      let newStart = dragStartRef.current.startTime + deltaTime;
      let newEnd = dragStartRef.current.endTime + deltaTime;

      if (newStart < 0) {
        newStart = 0;
        newEnd = clipLen;
      } else if (newEnd > duration) {
        newEnd = duration;
        newStart = duration - clipLen;
      }

      setStartTime(Number(newStart.toFixed(2)));
      setEndTime(Number(newEnd.toFixed(2)));
      if (videoRef.current) {
        videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      lastPointerUpTimeRef.current = Date.now();
      setActiveDrag(null);
      setTimeout(() => {
        didDragRef.current = false;
      }, 250);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user just dragged the handle or window, prevent accidental snap/shrink
    if (activeDrag || didDragRef.current || (Date.now() - lastPointerUpTimeRef.current < 350)) {
      return;
    }

    const clickedTime = getTimeFromPointer(e.clientX);
    const distToStart = Math.abs(clickedTime - startTime);
    const distToEnd = Math.abs(clickedTime - endTime);

    if (clickedTime < startTime) {
      handleStartChange(clickedTime);
    } else if (clickedTime > endTime) {
      handleEndChange(clickedTime);
    } else {
      if (distToStart < distToEnd) {
        handleStartChange(clickedTime);
      } else {
        handleEndChange(clickedTime);
      }
    }
  };

  // Interactive Overlay dragging logic
  const handleOverlayPointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlayId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveOverlayDrag(id);

    const targetOverlay = overlays.find((o) => o.id === id);
    if (targetOverlay) {
      overlayDragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startX: targetOverlay.x,
        startY: targetOverlay.y,
      };
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!activeOverlayDrag || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = ((e.clientX - overlayDragStartRef.current.clientX) / rect.width) * 100;
    const deltaY = ((e.clientY - overlayDragStartRef.current.clientY) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, overlayDragStartRef.current.startX + deltaX));
    const newY = Math.max(5, Math.min(95, overlayDragStartRef.current.startY + deltaY));

    updateOverlay(activeOverlayDrag, {
      x: Number(newX.toFixed(1)),
      y: Number(newY.toFixed(1)),
    });
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (activeOverlayDrag) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveOverlayDrag(null);
    }
  };

  // Interactive Rotation Handle Logic
  const handleRotatePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlayId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveRotateId(id);

    const targetOverlay = overlays.find((o) => o.id === id);
    if (targetOverlay && videoContainerRef.current) {
      const containerRect = videoContainerRef.current.getBoundingClientRect();
      const centerX = containerRect.left + (targetOverlay.x / 100) * containerRect.width;
      const centerY = containerRect.top + (targetOverlay.y / 100) * containerRect.height;
      rotateStartRef.current = {
        centerX,
        centerY,
      };
    }
  };

  const handleRotatePointerMove = (e: React.PointerEvent) => {
    if (!activeRotateId) return;
    const { centerX, centerY } = rotateStartRef.current;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const radians = Math.atan2(dy, dx);
    let degrees = Math.round((radians * 180) / Math.PI) + 90; // offset so straight-up pointer is 0 deg
    if (degrees > 180) degrees -= 360;
    if (degrees < -180) degrees += 360;

    // Snap to cardinal angles if close (0, 45, 90, -45, -90)
    if (Math.abs(degrees) < 4) degrees = 0;
    else if (Math.abs(degrees - 90) < 4) degrees = 90;
    else if (Math.abs(degrees + 90) < 4) degrees = -90;
    else if (Math.abs(degrees - 45) < 4) degrees = 45;
    else if (Math.abs(degrees + 45) < 4) degrees = -45;

    updateOverlay(activeRotateId, { rotation: degrees });
  };

  const handleRotatePointerUp = (e: React.PointerEvent) => {
    if (activeRotateId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveRotateId(null);
    }
  };

  if (!videoUrl) return null;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#09182b]/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
      {/* Video Viewport Container with Interactive Overlays Layer */}
      <div
        ref={videoContainerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'VIDEO') {
            setSelectedOverlayId(null);
          }
        }}
        className="relative mx-auto flex w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-white/5 shadow-inner select-none touch-none min-h-[220px]"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
          className="max-h-[380px] w-auto max-w-full rounded-xl cursor-pointer object-contain"
        />

        {/* Big Center Play Overlay Button when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/90 text-black shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Play trimmed video preview"
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
        )}

        {/* Selected Duration floating badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-xl bg-black/80 px-2.5 py-1 text-[11px] font-bold text-cyan-300 border border-cyan-400/30 backdrop-blur-md shadow-lg pointer-events-none">
          <Clock size={12} className="text-cyan-400" />
          <span>Clip: {selectedDuration.toFixed(1)}s</span>
        </div>

        {/* Direct Draggable Overlays Layer on top of video */}
        {overlays.map((ov) => {
          const isSelected = selectedOverlayId === ov.id;
          return (
            <div
              key={ov.id}
              onPointerDown={(e) => handleOverlayPointerDown(ov.id, e)}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerUp}
              className={`absolute select-none cursor-grab active:cursor-grabbing transition-all z-30 touch-none ${
                isSelected
                  ? 'border-2 border-dashed border-cyan-400 bg-cyan-400/10 rounded-xl shadow-2xl'
                  : 'hover:border hover:border-dashed hover:border-white/40 rounded-xl'
              }`}
              style={{
                left: `${ov.x}%`,
                top: `${ov.y}%`,
                transform: `translate(-50%, -50%) scale(${ov.scale}) rotate(${ov.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
              title="Click and drag to position anywhere on video"
            >
              {ov.type === 'text' ? (
                <div
                  className="px-3 py-1.5 text-center font-black whitespace-nowrap leading-tight select-none pointer-events-none drop-shadow-md"
                  style={{
                    fontFamily: `${ov.fontFamily || 'Anton'}, sans-serif`,
                    fontSize: `${ov.fontSize || 28}px`,
                    color: ov.fill || '#ffffff',
                    paintOrder: 'stroke fill',
                    WebkitPaintOrder: 'stroke fill',
                    WebkitTextStroke: ov.strokeWidth && ov.stroke && ov.stroke !== 'transparent' ? `${ov.strokeWidth}px ${ov.stroke}` : undefined,
                    textShadow: ov.stroke && ov.stroke !== 'transparent' ? `0 2px 8px rgba(0,0,0,0.8)` : undefined,
                    backgroundColor: ov.backgroundColor !== 'transparent' ? ov.backgroundColor : undefined,
                    borderRadius: ov.backgroundColor !== 'transparent' ? '6px' : undefined,
                  }}
                >
                  {ov.text}
                </div>
              ) : (
                <div className="relative flex items-center justify-center p-1.5 min-w-[64px] min-h-[64px]">
                  <img
                    src={ov.src}
                    alt={ov.name || 'Sticker'}
                    draggable={false}
                    className="w-20 h-20 min-w-[56px] min-h-[56px] max-w-[140px] max-h-[140px] object-contain pointer-events-none drop-shadow-xl"
                  />
                </div>
              )}

              {/* Quick Actions Bounding Box controls when selected (counteracting parent scale so button stays crisp 22px) */}
              {isSelected && (
                <>
                  {/* Interactive Rotation Pin on top of element */}
                  <div
                    onPointerDown={(e) => handleRotatePointerDown(ov.id, e)}
                    onPointerMove={handleRotatePointerMove}
                    onPointerUp={handleRotatePointerUp}
                    style={{ transform: `scale(${1 / Math.max(0.5, ov.scale)})` }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-40 touch-none group/rot"
                    title="Drag to rotate element freely"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-black shadow-xl hover:scale-125 transition">
                      <RotateCw size={12} className="stroke-[2.5]" />
                    </div>
                    <div className="w-0.5 h-2 bg-cyan-400/80" />
                  </div>

                  {/* Corner Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOverlay(ov.id);
                    }}
                    style={{ transform: `scale(${1 / Math.max(0.5, ov.scale)})` }}
                    className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl hover:bg-rose-500 hover:scale-125 active:scale-95 transition z-40"
                    title="Delete overlay"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Dual Trimming Timeline Track */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-white/70 mb-3">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Scissors size={14} />
            <span>Trim Clip Range</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/50">
            <Sparkles size={11} className="text-amber-400" />
            <span>~{estimatedFrames} frames at {fps} FPS</span>
          </span>
        </div>

        {/* Visual Timeline Bar with Range and Scrubber */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-12 w-full select-none rounded-xl bg-white/5 border border-white/10 p-1 flex items-center cursor-pointer mt-4"
        >
          {/* Active Trimmed Region Highlight (Draggable Window) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => handlePointerDown('window', e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-cyan-500/25 via-cyan-400/35 to-blue-500/25 border-y-2 border-cyan-400/60 shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center group/window"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(1, endPercent - startPercent)}%`,
            }}
            title="Drag middle window to slide entire clip range"
          >
            <span className="opacity-0 group-hover/window:opacity-100 transition text-[8px] font-black text-cyan-200 uppercase tracking-wider select-none pointer-events-none">
              ↔ Move Range
            </span>
          </div>

          {/* Current Playhead Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-25 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>

          {/* Left / Start Trim Handle (Interactive Draggable Pin) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => handlePointerDown('start', e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute top-0 bottom-0 z-30 flex items-center justify-center -translate-x-full cursor-ew-resize group/handleLeft touch-none"
            style={{ left: `${startPercent}%` }}
            title="Drag to adjust Start Time"
          >
            <div className={`flex flex-col items-center justify-center h-full w-5 sm:w-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black rounded-l-xl shadow-xl border-y border-l border-cyan-300 transition-all ${
              activeDrag === 'start' ? 'ring-2 ring-cyan-300 brightness-125' : 'group-hover/handleLeft:brightness-110'
            }`}>
              <GripVertical size={13} className="opacity-80" />
              <span className="text-[7px] font-black uppercase tracking-tighter leading-none mt-0.5">IN</span>
            </div>
            {/* Floating Timestamp Tag */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-400/40 pointer-events-none whitespace-nowrap shadow-md">
              {formatTime(startTime)}
            </div>
          </div>

          {/* Right / End Trim Handle (Interactive Draggable Pin) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => handlePointerDown('end', e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute top-0 bottom-0 z-30 flex items-center justify-center cursor-ew-resize group/handleRight touch-none"
            style={{ left: `${endPercent}%` }}
            title="Drag to adjust End Time"
          >
            <div className={`flex flex-col items-center justify-center h-full w-5 sm:w-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-r-xl shadow-xl border-y border-r border-cyan-300 transition-all ${
              activeDrag === 'end' ? 'ring-2 ring-cyan-300 brightness-125' : 'group-hover/handleRight:brightness-110'
            }`}>
              <GripVertical size={13} className="opacity-80" />
              <span className="text-[7px] font-black uppercase tracking-tighter leading-none mt-0.5">OUT</span>
            </div>
            {/* Floating Timestamp Tag */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-400/40 pointer-events-none whitespace-nowrap shadow-md">
              {formatTime(endTime)}
            </div>
          </div>
        </div>

        {/* Start / End Timestamp Quick Inputs (Responsive 2-column grid that never collides) */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center justify-between gap-1 rounded-xl bg-white/[0.04] p-1.5 sm:p-2 border border-white/10">
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">Start:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min={0}
                max={endTime - 0.2}
                value={Number(startTime.toFixed(2))}
                onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
                className="w-13 sm:w-16 rounded-lg border border-white/15 bg-black/50 px-1.5 py-1 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] sm:text-[11px] text-white/50 font-mono hidden xs:inline">({formatTime(startTime)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 rounded-xl bg-white/[0.04] p-1.5 sm:p-2 border border-white/10">
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">End:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min={startTime + 0.2}
                max={duration}
                value={Number(endTime.toFixed(2))}
                onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
                className="w-13 sm:w-16 rounded-lg border border-white/15 bg-black/50 px-1.5 py-1 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] sm:text-[11px] text-white/50 font-mono hidden xs:inline">({formatTime(endTime)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jump to start of trim */}
          <button
            onClick={jumpToStart}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95"
            title="Jump to Start of Trim"
          >
            <SkipBack size={14} />
          </button>

          {/* Step Back 0.1s */}
          <button
            onClick={() => stepTime(-0.1)}
            className="flex h-8 px-2 items-center justify-center rounded-xl bg-white/5 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95"
            title="Step Back 1 frame (-0.1s)"
          >
            -0.1s
          </button>

          {/* Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 font-bold"
            title={isPlaying ? "Pause Preview" : "Play Preview"}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Step Forward 0.1s */}
          <button
            onClick={() => stepTime(0.1)}
            className="flex h-8 px-2 items-center justify-center rounded-xl bg-white/5 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95"
            title="Step Forward 1 frame (+0.1s)"
          >
            +0.1s
          </button>

          {/* Jump to end of trim */}
          <button
            onClick={jumpToEnd}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95"
            title="Jump to End of Trim"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Current Time Display & Reset Trimming */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1 font-mono text-xs font-bold text-white/90 border border-white/10">
            <span className="text-cyan-400">{formatTime(currentTime)}</span>
            <span className="text-white/30">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <button
            onClick={() => {
              setStartTime(0);
              setEndTime(Math.min(duration, 5));
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="flex items-center gap-1 rounded-xl bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/50 hover:bg-white/10 hover:text-white transition"
            title="Reset Trim Range to first 5s"
          >
            <RotateCcw size={12} />
            <span className="hidden xs:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
