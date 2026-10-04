"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Copy, 
  Download, 
  Edit3, 
  Layers, 
  Maximize2, 
  Minus, 
  MoreHorizontal, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  Plus, 
  Redo2, 
  Save, 
  Sliders, 
  Sparkles, 
  Trash2, 
  Undo2,
  Loader2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EditorTopBarProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
  onOpenExport: () => void;
  onOpenResize: () => void;
}

export function EditorTopBar({ editor, onOpenExport, onOpenResize }: EditorTopBarProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Design");
  const [pageMenuIndex, setPageMenuIndex] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync title from recent projects or current project
  useEffect(() => {
    if (editor.currentProjectId) {
      const p = editor.recentProjects.find((item) => item.id === editor.currentProjectId);
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
    const trimmed = projectTitle.trim() || "Untitled Design";
    setProjectTitle(trimmed);
    editor.saveProject(trimmed);
  };

  return (
    <header className="relative z-40 flex h-14 w-full shrink-0 select-none items-center justify-between border-b border-white/[0.08] bg-[#0c1017]/95 px-3 md:px-5 backdrop-blur-md">
      {/* Left: Brand, Back, Title, Save Status */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/image-home-screen')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/70 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
          title="Back to Studio Launchpad"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3 min-w-0">
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
              className="h-8 rounded-lg border border-violet-500/50 bg-black/40 px-2.5 text-xs md:text-sm font-semibold text-white outline-none ring-2 ring-violet-500/20 max-w-[160px] md:max-w-[240px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-white/[0.04] max-w-[160px] md:max-w-[220px]"
              title="Click to rename project"
            >
              <span className="truncate text-xs md:text-sm font-semibold text-white group-hover:text-violet-300">
                {projectTitle}
              </span>
              <Edit3 size={12} className="opacity-0 transition group-hover:opacity-100 text-white/50" />
            </button>
          )}

          {editor.saveStatus === 'saving' ? (
            <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
              <Loader2 size={10} className="animate-spin" />
              <span>Saving...</span>
            </div>
          ) : editor.saveStatus === 'unsaved' ? (
            <div className="hidden lg:flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40 border border-white/10">
              <span>Unsaved</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              <Check size={10} />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Dimensions pill, Page Switcher, Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Canvas Dimensions Shortcut */}
        <button
          onClick={onOpenResize}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-violet-500/40 hover:bg-white/[0.06] hover:text-white"
          title="Change canvas dimensions"
        >
          <Sliders size={12} className="text-violet-400" />
          <span>{editor.canvasDimensions.width} × {editor.canvasDimensions.height}</span>
        </button>

        {/* Multi-Page Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <div className="flex items-center gap-1 max-w-[180px] sm:max-w-[280px] overflow-x-auto custom-scrollbar">
            {editor.pages.map((p, idx) => {
              const isActive = editor.activePageIndex === idx;
              return (
                <div key={p.id} className="relative group">
                  <button
                    onClick={() => editor.switchPage(idx)}
                    className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition ${
                      isActive 
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30' 
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="hidden md:inline max-w-[60px] truncate">{p.name || `P${idx+1}`}</span>
                  </button>

                  {/* Page context menu toggle */}
                  {editor.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPageMenuIndex(pageMenuIndex === idx ? null : idx);
                      }}
                      className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-white/70 hover:text-white border border-white/20"
                    >
                      <MoreHorizontal size={10} />
                    </button>
                  )}

                  {/* Dropdown for page options */}
                  {pageMenuIndex === idx && (
                    <div 
                      onMouseLeave={() => setPageMenuIndex(null)}
                      className="absolute top-full left-0 mt-1 z-50 w-32 rounded-xl border border-white/10 bg-[#121824] p-1 shadow-2xl backdrop-blur-xl"
                    >
                      <button
                        onClick={() => {
                          editor.duplicatePage(idx);
                          setPageMenuIndex(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] text-white/80 hover:bg-white/10"
                      >
                        <Copy size={12} />
                        <span>Duplicate</span>
                      </button>
                      {editor.pages.length > 1 && (
                        <button
                          onClick={() => {
                            editor.deletePage(idx);
                            setPageMenuIndex(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => editor.addPage(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition hover:bg-violet-600/20 hover:text-violet-300"
            title="Add blank page"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-white/[0.08] pl-2">
          <button
            onClick={editor.undo}
            disabled={!editor.canUndo}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={editor.redo}
            disabled={!editor.canRedo}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-20"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* Right: Zoom controls, Panel toggles, Save & Export */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="hidden xl:flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-1 py-0.5">
          <button
            onClick={() => editor.resizeCanvas("ZoomOut", 0.1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06] hover:text-white"
            title="Zoom Out"
          >
            <Minus size={13} />
          </button>
          <span className="w-12 text-center text-[11px] font-bold text-white/70">
            {Math.round(editor.viewportScale * 100)}%
          </span>
          <button
            onClick={() => editor.resizeCanvas("ZoomIn", 0.1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06] hover:text-white"
            title="Zoom In"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => editor.fitCanvasToViewport(editor.canvasDimensions)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06] hover:text-white"
            title="Fit to Screen"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Panel Toggles */}
        <button
          onClick={() => editor.setLeftPanelOpen(!editor.leftPanelOpen)}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
            editor.leftPanelOpen 
              ? 'border-violet-500/40 bg-violet-600/20 text-violet-300' 
              : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:text-white'
          }`}
          title="Toggle Tools Dock"
        >
          {editor.leftPanelOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <button
          onClick={() => editor.setRightPanelOpen(!editor.rightPanelOpen)}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
            editor.rightPanelOpen 
              ? 'border-violet-500/40 bg-violet-600/20 text-violet-300' 
              : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:text-white'
          }`}
          title="Toggle Layers & Inspector"
        >
          {editor.rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>

        {/* Save Button */}
        <button
          onClick={() => editor.saveProject(projectTitle)}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-semibold text-white/90 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
          title="Save to local persistent storage"
        >
          <Save size={13} />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Export / Download CTA */}
        <button
          onClick={onOpenExport}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110 active:scale-95"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
