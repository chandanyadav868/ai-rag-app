"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Maximize2,
  RotateCw,
  Activity,
  Zap,
  Loader2,
  Film,
  Layers,
  Repeat,
  Trash2,
  Clock,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useGifEditor } from '../_hooks/useGifEditor';

interface ElementAnimationDeckProps {
  editor: ReturnType<typeof useGifEditor>;
}

interface AnimationPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}

const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In / Reveal',
    category: 'Entrance',
    description: 'Smoothly dissolves from transparent to opaque (0% → 100%)',
    icon: Eye,
    badge: 'Popular',
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    category: 'Exit',
    description: 'Gently dissolves away into the background',
    icon: EyeOff,
    badge: 'Exit',
  },
  {
    id: 'slide-left',
    name: 'Slide In Left',
    category: 'Motion',
    description: 'Sweeps in dynamically from the right border',
    icon: ArrowLeft,
    badge: 'Dynamic',
  },
  {
    id: 'slide-right',
    name: 'Slide In Right',
    category: 'Motion',
    description: 'Sweeps in smoothly from the left border',
    icon: ArrowRight,
    badge: 'Motion',
  },
  {
    id: 'slide-top',
    name: 'Drop from Top',
    category: 'Motion',
    description: 'Drops down from above the viewport with impact',
    icon: ArrowDown,
    badge: 'Drop',
  },
  {
    id: 'slide-bottom',
    name: 'Rise from Bottom',
    category: 'Motion',
    description: 'Elevates smoothly from the lower canvas edge',
    icon: ArrowUp,
    badge: 'Rise',
  },
  {
    id: 'scale-pulse',
    name: 'Scale Pulse / Pop',
    category: 'Attention',
    description: 'Pops out +35% size and eases back into scale',
    icon: Maximize2,
    badge: 'High CTR',
  },
  {
    id: 'spin-360',
    name: 'Spin 360°',
    category: 'Rotation',
    description: 'Full 360-degree rotational spin loop',
    icon: RotateCw,
    badge: 'Loop',
  },
  {
    id: 'bounce',
    name: 'Bounce / Bob',
    category: 'Physics',
    description: 'Playful bobbing with spring sine wave oscillation',
    icon: Activity,
    badge: 'Organic',
  },
  {
    id: 'blink',
    name: 'Blink / Strobe',
    category: 'Attention',
    description: 'Alternating flash visibility for urgent hooks',
    icon: Zap,
    badge: 'Alert',
  },
];

export function ElementAnimationDeck({ editor }: ElementAnimationDeckProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>('scale-pulse');
  const [startFrame, setStartFrame] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(8);
  const [loopStyle, setLoopStyle] = useState<'seamless' | 'oneway'>('seamless');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync startFrame with activeFrameIndex whenever user selects a frame on timeline
  useEffect(() => {
    if (editor.activeFrameIndex !== null && editor.activeFrameIndex !== undefined) {
      setStartFrame(editor.activeFrameIndex);
    }
  }, [editor.activeFrameIndex]);

  const selectedLayer = editor.state.find((item) => item.id === editor.activeId);
  const activeTrack = selectedLayer
    ? editor.layerTracks.find((t) => t.layerId === selectedLayer.id)
    : undefined;

  const handleApply = async () => {
    if (!editor.activeId) return;
    setIsGenerating(true);
    try {
      await editor.applyLayerAnimation(
        editor.activeId,
        selectedAnimation,
        startFrame,
        frameCount,
        loopStyle
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveActiveMotion = async () => {
    if (!selectedLayer) return;
    await editor.removeLayerAnimation(selectedLayer.id);
  };

  if (!selectedLayer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
        <Layers size={28} className="text-white/20 mb-3" />
        <div className="text-sm font-bold text-white">No Layer Selected</div>
        <div className="mt-1 text-xs text-white/50 max-w-xs">
          Select any text, image, or shape layer on the canvas to animate it automatically.
        </div>
      </div>
    );
  }

  // Generate selectable start frame choices based on current frame length
  const maxStartFrames = Math.max(editor.frames.length, 12);
  const startFrameChoices = Array.from({ length: Math.min(maxStartFrames, 12) }, (_, i) => i);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
      {/* Target Layer Info Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-400 text-black">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Target Element</div>
            <div className="text-xs font-bold text-white truncate max-w-[190px]">
              {selectedLayer.id} ({selectedLayer.type})
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
          Ready
        </span>
      </div>

      {/* Active Motion Card (if this element already has an animation assigned) */}
      {activeTrack && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-amber-400" />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Active Motion on Element
              </span>
            </div>
            <button
              onClick={handleRemoveActiveMotion}
              className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-2 py-0.5 transition"
              title="Remove animation from this element"
            >
              <Trash2 size={11} />
              <span>Remove</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-white/80 bg-black/30 p-2 rounded-xl border border-white/5">
            <span className="font-semibold capitalize text-white">
              {ANIMATION_PRESETS.find((p) => p.id === activeTrack.type)?.name || activeTrack.type}
            </span>
            <span className="font-mono text-[11px] text-amber-300 font-bold">
              Frames #{activeTrack.startFrame + 1} → #{activeTrack.startFrame + activeTrack.durationFrames}
            </span>
          </div>
        </div>
      )}

      {/* Start From Frame Selector (Audio 3 Requirement) */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-cyan-400" />
            <span className="font-bold text-white/80">Start Motion From Frame:</span>
          </div>
          <span className="font-mono font-bold text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-lg text-xs">
            Frame #{startFrame + 1}
          </span>
        </div>
        <p className="text-[10px] text-white/50 leading-relaxed">
          Element stays in pre-entrance state until this frame, then animates smoothly.
        </p>

        {/* Quick Frame Picker Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {startFrameChoices.map((fIdx) => (
            <button
              key={fIdx}
              type="button"
              onClick={() => setStartFrame(fIdx)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                startFrame === fIdx
                  ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20 ring-1 ring-cyan-300'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              #{fIdx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Duration / Steps Selector */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white/80">Motion Duration:</span>
          <span className="font-mono text-cyan-300 font-bold">{frameCount} frames</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[4, 6, 8, 12].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setFrameCount(num)}
              className={`py-1.5 rounded-xl text-xs font-bold transition ${
                frameCount === num
                  ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {num} frames
            </button>
          ))}
        </div>
        <div className="text-[10px] text-cyan-200/60 pt-0.5">
          Span: Frame #{startFrame + 1} to #{startFrame + frameCount} (Total scene frames: {Math.max(editor.frames.length, startFrame + frameCount)})
        </div>
      </div>

      {/* Motion Curve Style (Seamless vs One-Way) */}
      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
        <span className="font-bold text-white/70">Motion Curve:</span>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setLoopStyle('seamless')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
              loopStyle === 'seamless'
                ? 'bg-cyan-400 text-black shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
            title="Smooth harmonic loop without abrupt snap"
          >
            Seamless Loop
          </button>
          <button
            type="button"
            onClick={() => setLoopStyle('oneway')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
              loopStyle === 'oneway'
                ? 'bg-cyan-400 text-black shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
            title="One-way motion entrance"
          >
            One-Way
          </button>
        </div>
      </div>

      {/* Animation Presets Grid */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
          Select Motion Style
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
          {ANIMATION_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedAnimation === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedAnimation(preset.id)}
                className={`relative group flex items-start gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition ${
                    isSelected
                      ? 'bg-cyan-400 text-black'
                      : 'bg-white/5 text-white/60 group-hover:text-white group-hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/50 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply Animation CTA Button */}
      <button
        onClick={handleApply}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/20 transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin text-black" />
            <span>Rendering Multi-Track Composition...</span>
          </>
        ) : (
          <>
            <Film size={16} />
            <span>
              Apply Motion (Frames #{startFrame + 1} → #{startFrame + frameCount})
            </span>
          </>
        )}
      </button>

      {/* Multi-Element Scene Track Summary (Audio 2 Guarantee) */}
      {editor.layerTracks.length > 0 && (
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              Scene Composition ({editor.layerTracks.length} active {editor.layerTracks.length === 1 ? 'element' : 'elements'})
            </span>
            <span className="text-[9px] text-white/40">Concurrent Tracks</span>
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
            {editor.layerTracks.map((track) => {
              const layer = editor.state.find((s) => s.id === track.layerId);
              const preset = ANIMATION_PRESETS.find((p) => p.id === track.type);
              const isCurrent = track.layerId === editor.activeId;

              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200'
                      : 'bg-black/30 border-white/5 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[10px] font-bold text-white">
                      {layer ? `${layer.id.slice(0, 10)} (${layer.type})` : track.layerId.slice(0, 10)}:
                    </span>
                    <span className="text-[11px] text-cyan-300">
                      {preset?.name || track.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-white/50">
                      #{track.startFrame + 1}-#{track.startFrame + track.durationFrames}
                    </span>
                    <button
                      onClick={() => editor.removeLayerAnimation(track.layerId)}
                      className="p-1 text-white/40 hover:text-rose-400 transition"
                      title="Remove motion"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-white/40 italic">
            Adding motion to any element preserves all other elements' animations without overwriting.
          </div>
        </div>
      )}
    </div>
  );
}
