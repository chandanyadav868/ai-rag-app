"use client";

import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Scissors,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useVideoToGif } from '../_hooks/useVideoToGif';

interface VideoTrimmerProps {
  engine: ReturnType<typeof useVideoToGif>;
}

export function VideoTrimmer({ engine }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  if (!videoUrl) return null;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#09182b]/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
      {/* Video Viewport Container */}
      <div className="relative mx-auto flex w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-white/5 shadow-inner">
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
            className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/90 text-black shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Play trimmed video preview"
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
        )}

        {/* Selected Duration floating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/80 px-2.5 py-1 text-[11px] font-bold text-cyan-300 border border-cyan-400/30 backdrop-blur-md shadow-lg">
          <Clock size={12} className="text-cyan-400" />
          <span>Clip: {selectedDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Dual Trimming Timeline Track */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-white/70">
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
        <div className="relative h-10 w-full select-none rounded-xl bg-white/5 border border-white/10 p-1 flex items-center overflow-hidden group">
          {/* Active Trimmed Region Highlight */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-cyan-500/30 via-cyan-400/40 to-blue-500/30 border-y-2 border-cyan-400/60 shadow-lg pointer-events-none"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(2, endPercent - startPercent)}%`,
            }}
          />

          {/* Current Playhead Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>

          {/* Left / Start Trim Handle */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={startTime}
            onChange={(e) => handleStartChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-20 pointer-events-auto"
            title="Drag to adjust Start Time"
          />

          {/* Right / End Trim Handle */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={endTime}
            onChange={(e) => handleEndChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-20 pointer-events-auto"
            title="Drag to adjust End Time"
          />

          {/* Start Marker Pin */}
          <div
            className="absolute top-0 bottom-0 w-3 rounded-l-md bg-cyan-400 text-black flex items-center justify-center font-black text-[9px] pointer-events-none z-10 shadow-md"
            style={{ left: `${startPercent}%` }}
          >
            |
          </div>

          {/* End Marker Pin */}
          <div
            className="absolute top-0 bottom-0 w-3 rounded-r-md bg-cyan-400 text-black flex items-center justify-center font-black text-[9px] pointer-events-none z-10 shadow-md -translate-x-full"
            style={{ left: `${endPercent}%` }}
          >
            |
          </div>
        </div>

        {/* Start / End Timestamp Quick Inputs */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Start:</span>
            <input
              type="number"
              step="0.1"
              min={0}
              max={endTime - 0.2}
              value={Number(startTime.toFixed(2))}
              onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
              className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400"
            />
            <span className="text-[11px] text-white/40">({formatTime(startTime)})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">End:</span>
            <input
              type="number"
              step="0.1"
              min={startTime + 0.2}
              max={duration}
              value={Number(endTime.toFixed(2))}
              onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
              className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400"
            />
            <span className="text-[11px] text-white/40">({formatTime(endTime)})</span>
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
