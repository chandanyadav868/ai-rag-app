"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  Layers,
  Loader2,
  Maximize2,
  MenuSquare,
  Minus,
  Play,
  Plus,
  Redo2,
  Sliders,
  Square,
  Undo2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGifEditor } from '../_hooks/useGifEditor';

interface EditorTopBarProps {
  editor: ReturnType<typeof useGifEditor>;
  onOpenResize?: () => void;
}

export function EditorTopBar({ editor, onOpenResize }: EditorTopBarProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled GIF Animation");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor.currentProjectId) {
      const p = editor.recentProjects.find((item: any) => item.id === editor.currentProjectId);
      if (p?.name) setProjectTitle(p.name);
    }
  }, [editor.currentProjectId, editor.recentProjects]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = projectTitle.trim() || "Untitled GIF Animation";
    setProjectTitle(trimmed);
    editor.saveProject(trimmed);
  };

  return (
    <header className="relative z-40 flex h-14 w-full shrink-0 select-none items-center justify-between border-b border-white/10 bg-[#09182b]/95 px-3 md:px-5 backdrop-blur-xl">
      {/* Left: Back button, Title, Dimensions & Frame badge */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/gif-home-screen')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95 border border-white/5"
          title="Back to GIF Studio Hub"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 border-l border-white/10 pl-3 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="h-8 rounded-lg border border-cyan-400/50 bg-black/50 px-2.5 text-xs md:text-sm font-semibold text-white outline-none ring-2 ring-cyan-400/20 max-w-[150px] md:max-w-[220px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-white/5 max-w-[150px] md:max-w-[220px]"
              title="Click to rename project"
            >
              <span className="truncate text-xs md:text-sm font-bold text-white group-hover:text-cyan-300">
                {projectTitle}
              </span>
              <Edit3 size={12} className="opacity-0 transition group-hover:opacity-100 text-white/50" />
            </button>
          )}

          {/* Canvas Dimensions Pill */}
          <div
            onClick={onOpenResize}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/70 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition cursor-default"
            title="GIF Dimensions"
          >
            <Sliders size={11} className="text-cyan-400" />
            <span>{editor.canvasDimensions.width}×{editor.canvasDimensions.height}</span>
          </div>

          {/* Frames Count Badge */}
          <span className="hidden md:inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
            {editor.frames.length} {editor.frames.length === 1 ? 'Frame' : 'Frames'}
          </span>
        </div>
      </div>

      {/* Center: Zoom controls & Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={editor.undo}
            disabled={!editor.canUndo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={editor.redo}
            disabled={!editor.canRedo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-0.5 hidden xs:block" />

        {/* Viewport Zoom */}
        <div className="hidden xs:flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => editor.setViewportScale((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
            title="Zoom Out"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => editor.setViewportScale(1)}
            className="px-2 text-[11px] font-bold text-white/70 hover:text-cyan-400 transition"
            title="Reset Zoom to 100%"
          >
            {Math.round(editor.viewportScale * 100)}%
          </button>
          <button
            onClick={() => editor.setViewportScale((prev) => Math.min(5, Number((prev + 0.1).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
            title="Zoom In"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Right: Panel toggles, Play Preview, Export GIF */}
      <div className="flex items-center gap-2">
        {/* Tools and Layers Panel Toggles */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => editor.setLeftPanelOpen((prev) => !prev)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              editor.leftPanelOpen
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-white/40 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Tools Panel"
          >
            <MenuSquare size={14} />
          </button>
          <button
            onClick={() => editor.setRightPanelOpen((prev) => !prev)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              editor.rightPanelOpen
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-white/40 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Layers Panel"
          >
            <Layers size={14} />
          </button>
        </div>

        {/* Preview Play/Stop Modal Button */}
        <button
          onClick={() => editor.setIsPlaying(!editor.isPlaying)}
          disabled={editor.frames.length === 0}
          className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-md ${
            editor.isPlaying
              ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
              : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
          title={editor.isPlaying ? "Stop Loop" : "Preview Loop"}
        >
          {editor.isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          <span>{editor.isPlaying ? "Stop" : "Preview"}</span>
        </button>

        {/* Export GIF CTA Button */}
        <button
          onClick={editor.exportGif}
          disabled={editor.isExportingGif || editor.frames.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 px-3.5 py-1.5 text-xs font-black text-black shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export high-quality animated GIF"
        >
          {editor.isExportingGif ? (
            <>
              <Loader2 size={14} className="animate-spin text-black" />
              <span className="hidden xs:inline">Encoding...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Export GIF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
