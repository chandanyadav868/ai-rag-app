"use client";

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Film,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useGifEditor } from '../_hooks/useGifEditor';

interface TransitionStudioDeckProps {
  editor: ReturnType<typeof useGifEditor>;
}

export function TransitionStudioDeck({ editor }: TransitionStudioDeckProps) {
  const {
    frames,
    transitionTarget,
    setTransitionTarget,
    transitionType,
    setTransitionType,
    transitionSteps,
    setTransitionSteps,
    isGeneratingTransition,
    applyTransition,
    setLayerMenu,
  } = editor;

  // If no pair is actively targeted, default to the active frame or the first pair
  const currentTarget = transitionTarget !== null
    ? transitionTarget
    : Math.min(Math.max(0, editor.activeFrameIndex ?? 0), Math.max(0, frames.length - 2));

  const frameA = frames[currentTarget];
  const frameB = frames[currentTarget + 1];

  // Helper to switch active pair
  const handleSelectPair = (idx: number) => {
    setTransitionTarget(idx);
    editor.setActiveFrameIndex(idx);
    editor.setStageMode('frame');
  };

  if (frames.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
        <Film size={28} className="text-white/20 mb-3" />
        <div className="text-sm font-bold text-white">Need At Least 2 Frames</div>
        <div className="mt-1 text-xs text-white/50 max-w-xs">
          Capture or generate at least 2 frames on the timeline to create smooth in-between transitions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
      {/* Title & Context Header */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-400/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-black shadow-md shadow-cyan-400/30">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Frame Transition Studio
              </div>
              <div className="text-xs font-bold text-white">
                Blend Frame #{currentTarget + 1} ➔ #{currentTarget + 2}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            Active Blend
          </span>
        </div>

        {/* Dual Frame Preview Visualizer */}
        <div className="flex items-center justify-between gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
          {/* Frame A */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="relative h-14 w-20 rounded-lg overflow-hidden border border-cyan-400/40 bg-black/60 shadow-sm">
              {frameA && <img src={frameA} alt={`Frame ${currentTarget + 1}`} className="h-full w-full object-contain" />}
              <span className="absolute bottom-0.5 left-1 text-[9px] font-black text-cyan-300 bg-black/80 px-1 rounded">
                #{currentTarget + 1}
              </span>
            </div>
            <span className="text-[9px] text-white/50 font-bold">Start Frame</span>
          </div>

          {/* Morph Arrow */}
          <div className="flex flex-col items-center gap-1 px-1 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
              <ArrowRight size={12} />
            </div>
            <span className="text-[8px] font-mono text-cyan-400/70 font-bold uppercase">Blend</span>
          </div>

          {/* Frame B */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="relative h-14 w-20 rounded-lg overflow-hidden border border-cyan-400/40 bg-black/60 shadow-sm">
              {frameB && <img src={frameB} alt={`Frame ${currentTarget + 2}`} className="h-full w-full object-contain" />}
              <span className="absolute bottom-0.5 left-1 text-[9px] font-black text-cyan-300 bg-black/80 px-1 rounded">
                #{currentTarget + 2}
              </span>
            </div>
            <span className="text-[9px] text-white/50 font-bold">Target Frame</span>
          </div>
        </div>
      </div>

      {/* Frame Pair Selector (if there are multiple frames, allow 1-click pair switching) */}
      {frames.length > 2 && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white/70">Select Frame Pair to Blend:</span>
            <span className="text-[10px] text-cyan-300 font-mono font-bold">
              Pair #{currentTarget + 1} & #{currentTarget + 2}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {frames.slice(0, frames.length - 1).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPair(idx)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition ${
                  currentTarget === idx
                    ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20 ring-1 ring-cyan-300'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                #{idx + 1} ➔ #{idx + 2}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Motion Style Selection */}
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-white/50">
          Transition Blending Style
        </div>
        <div className="grid grid-cols-1 gap-2">
          {/* Crossfade Card */}
          <div
            onClick={() => setTransitionType('crossfade')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              transitionType === 'crossfade'
                ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30'
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Crossfade Dissolve</span>
              {transitionType === 'crossfade' && (
                <span className="flex items-center gap-1 text-[9px] font-black text-cyan-300 bg-cyan-400/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} />
                  Selected
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
              Calculates linear alpha interpolation, seamlessly dissolving Frame #{currentTarget + 1} into Frame #{currentTarget + 2} without abrupt cuts.
            </p>
          </div>

          {/* Slide Wipe Card */}
          <div
            onClick={() => setTransitionType('slide-wipe')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              transitionType === 'slide-wipe'
                ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30'
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Slide Wipe</span>
              {transitionType === 'slide-wipe' && (
                <span className="flex items-center gap-1 text-[9px] font-black text-cyan-300 bg-cyan-400/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} />
                  Selected
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
              Sweeps Frame #{currentTarget + 2} into the canvas horizontally while smoothly translating Frame #{currentTarget + 1} off-screen.
            </p>
          </div>
        </div>
      </div>

      {/* Intermediate Steps Resolution */}
      <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white/80">Intermediate Frames:</span>
          <span className="font-mono font-bold text-cyan-300">+{transitionSteps} frames</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[2, 4, 6, 8].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setTransitionSteps(num)}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                transitionSteps === num
                  ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {num} frames
            </button>
          ))}
        </div>
        <div className="text-[10px] text-cyan-200/60 pt-0.5">
          Timeline will expand from {frames.length} to {frames.length + transitionSteps} total frames.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={applyTransition}
          disabled={isGeneratingTransition}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/20 transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGeneratingTransition ? (
            <>
              <Loader2 size={16} className="animate-spin text-black" />
              <span>Generating {transitionSteps} Frames...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate {transitionSteps} Transition Frames</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setTransitionTarget(null);
            setLayerMenu("Layer");
          }}
          className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/50 hover:bg-white/5 hover:text-white transition"
        >
          Back to Layers
        </button>
      </div>
    </div>
  );
}
