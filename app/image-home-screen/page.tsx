"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Clock, 
  ChevronRight, 
  Settings2, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  Square, 
  X, 
  Trash2, 
  MoreVertical,
  Sparkles,
  Layers,
  Wand2,
  UploadCloud,
  FileImage,
  Share2,
  FolderOpen,
  ArrowRight,
  Maximize,
  Sliders,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { deleteProjectData } from '@/lib/persistent-storage';

interface ProjectMetadata {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
  lastEdited: number | string;
}

interface PresetItem {
  id?: string;
  name: string;
  category: 'social' | 'display' | 'custom';
  width: number;
  height: number;
  iconType: 'square' | 'phone' | 'monitor' | 'banner';
  badge?: string;
}

const DEFAULT_PRESETS: PresetItem[] = [
  { name: 'Instagram Square', category: 'social', width: 1080, height: 1080, iconType: 'square', badge: '1:1' },
  { name: 'Instagram Story / Reel', category: 'social', width: 1080, height: 1920, iconType: 'phone', badge: '9:16' },
  { name: 'YouTube Thumbnail', category: 'social', width: 1280, height: 720, iconType: 'monitor', badge: '16:9' },
  { name: 'Twitter / X Banner', category: 'social', width: 1500, height: 500, iconType: 'banner', badge: '3:1' },
  { name: 'Full HD Display', category: 'display', width: 1920, height: 1080, iconType: 'monitor', badge: '1080p' },
  { name: '4K Ultra HD', category: 'display', width: 3840, height: 2160, iconType: 'monitor', badge: '4K' },
  { name: 'Portrait Social', category: 'social', width: 1080, height: 1350, iconType: 'phone', badge: '4:5' },
  { name: 'Facebook Banner', category: 'social', width: 1200, height: 630, iconType: 'banner', badge: '1.9:1' },
];

export default function ImageHomeScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customSize, setCustomSize] = useState({ width: 1080, height: 1080 });
  const [aspectLocked, setAspectLocked] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'display' | 'custom'>('all');

  const [recents, setRecents] = useState<ProjectMetadata[]>([]);
  const [customPresets, setCustomPresets] = useState<PresetItem[]>([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState<boolean>(false);
  const [newPreset, setNewPreset] = useState({ name: '', width: 1080, height: 1080 });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedMetadata = localStorage.getItem('polish_ai_projects_metadata');
      if (savedMetadata) setRecents(JSON.parse(savedMetadata));

      const savedPresets = localStorage.getItem('polish_ai_custom_presets');
      if (savedPresets) setCustomPresets(JSON.parse(savedPresets));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpenId && !(e.target as HTMLElement).closest('.project-menu-container')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  const handleCreate = (w: number, h: number) => {
    router.push(`/image-editing?width=${w}&height=${h}`);
  };

  const handleLoad = (id: string) => {
    router.push(`/image-editing?projectId=${id}`);
  };

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        sessionStorage.setItem('polish_ai_imported_cutout', imgDataUrl);
        router.push(`/image-editing?width=${img.width}&height=${img.height}`);
      };
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    const updated = recents.filter(p => p.id !== id);
    setRecents(updated);
    try {
      localStorage.setItem('polish_ai_projects_metadata', JSON.stringify(updated));
      localStorage.removeItem(`polish_ai_project_data_${id}`);
      deleteProjectData(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreset = () => {
    if (!newPreset.name.trim()) return;
    const preset: PresetItem = {
      id: uuidv4(),
      name: newPreset.name.trim(),
      category: 'custom',
      width: Number(newPreset.width) || 1080,
      height: Number(newPreset.height) || 1080,
      iconType: 'square',
      badge: 'Custom'
    };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('polish_ai_custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsPresetDialogOpen(false);
    setNewPreset({ name: '', width: 1080, height: 1080 });
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('polish_ai_custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const allPresets = [
    ...DEFAULT_PRESETS,
    ...customPresets
  ].filter(p => selectedCategory === 'all' || p.category === selectedCategory);

  const getPresetIcon = (iconType: string) => {
    switch (iconType) {
      case 'phone': return <Smartphone size={18} className="text-cyan-400" />;
      case 'monitor': return <Monitor size={18} className="text-purple-400" />;
      case 'banner': return <Maximize size={18} className="text-emerald-400" />;
      default: return <Square size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#040812] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header />

      {/* Main Container with generous top spacing to prevent header overlap */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20">
        
        {/* Top Hero Banner & Quick Actions */}
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-[#091528]/90 via-[#070e1c]/90 to-[#0d162d]/90 p-8 sm:p-10 mb-12 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Layers size={14} />
                <span>Multi-Layer Canvas Workspace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Creative Canvas Studio
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                Design custom graphics, composition layers, and apply AI inpainting directly in your browser with zero latency and complete privacy.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleOpenFile} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow"
              >
                <FolderOpen size={16} className="text-cyan-400" />
                <span>Open Image File</span>
              </button>
              
              <Link
                href="/image-bg-removal"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <Wand2 size={16} />
                <span>AI Background Remover</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section: Create New Canvas */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Plus size={18} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Create New Canvas
              </h2>
            </div>

            {/* Category Filter Chips */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-[#091528] border border-white/10 text-xs">
              {(['all', 'social', 'display', 'custom'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Presets' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Custom Canvas Setup Card */}
            <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#091528]/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/90">
                    Custom Dimensions
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Unit: Pixels (px)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Width (px)</label>
                    <input
                      type="number"
                      min={100}
                      max={8192}
                      value={customSize.width}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCustomSize(prev => ({
                          ...prev,
                          width: val,
                          height: aspectLocked ? val : prev.height
                        }));
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Height (px)</label>
                    <input
                      type="number"
                      min={100}
                      max={8192}
                      value={customSize.height}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCustomSize(prev => ({
                          ...prev,
                          height: val,
                          width: aspectLocked ? val : prev.width
                        }));
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Aspect Ratio Shortcuts */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs text-slate-400 mr-1">Ratios:</span>
                  {[
                    { label: '1:1', w: 1080, h: 1080 },
                    { label: '16:9', w: 1920, h: 1080 },
                    { label: '9:16', w: 1080, h: 1920 },
                    { label: '4:5', w: 1080, h: 1350 },
                  ].map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => setCustomSize({ width: ratio.w, height: ratio.h })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        customSize.width === ratio.w && customSize.height === ratio.h
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Canvas CTA */}
              <button
                onClick={() => handleCreate(customSize.width, customSize.height)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>Create Blank Canvas ({customSize.width} × {customSize.height})</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {allPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCreate(preset.width, preset.height)}
                  className="group relative rounded-2xl border border-white/10 bg-[#091528]/60 hover:bg-[#0c1c36] hover:border-cyan-500/40 p-4 flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-0.5 shadow-md"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getPresetIcon(preset.iconType)}
                    </div>
                    {preset.badge && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400 group-hover:text-cyan-300 transition-colors">
                        {preset.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {preset.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {preset.width} × {preset.height} px
                    </p>
                  </div>

                  {preset.id && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id!, e);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Preset"
                    >
                      <Trash2 size={12} />
                    </div>
                  )}
                </button>
              ))}

              {/* Add Custom Preset Card */}
              <button
                onClick={() => setIsPresetDialogOpen(true)}
                className="rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 p-4 flex flex-col items-center justify-center text-center gap-2 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                  Add Custom Preset
                </span>
              </button>
            </div>

          </div>
        </section>

        {/* Section: Recent Projects (Fixed spelling from "Resent Work") */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Clock size={18} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recent Projects
              </h2>
            </div>
            {recents.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                {recents.length} project{recents.length > 1 ? 's' : ''} saved locally
              </span>
            )}
          </div>

          {recents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recents.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleLoad(project.id)}
                  className="group relative rounded-3xl border border-white/10 bg-[#091528]/60 hover:bg-[#0c1c36] hover:border-cyan-500/40 p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center mb-3">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-slate-700 flex flex-col items-center gap-1">
                        <ImageIcon size={36} />
                        <span className="text-[10px] text-slate-500">No Preview</span>
                      </div>
                    )}

                    {/* Context Menu Button */}
                    <div className="absolute top-2 right-2 project-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-md border border-white/10 transition-all ${
                          menuOpenId === project.id
                            ? 'bg-cyan-500 text-black border-cyan-500'
                            : 'bg-black/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpenId === project.id && (
                        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0a1424] border border-white/10 shadow-2xl py-1 z-40 animate-in fade-in zoom-in duration-150">
                          <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="px-1">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{project.width} × {project.height}</span>
                      <span>{new Date(project.lastEdited).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl border border-white/10 bg-[#091528]/40 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                <LayoutGrid size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No saved projects yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
                Designs and artwork created in Canvas Studio will automatically save to your browser for instant resumption.
              </p>
              <button
                onClick={() => handleCreate(1080, 1080)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow hover:bg-cyan-400 transition-all"
              >
                <Plus size={14} />
                <span>Start First Design</span>
              </button>
            </div>
          )}
        </section>

      </main>

      <Footer />

      {/* New Preset Modal Dialog */}
      {isPresetDialogOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#091528] p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Custom Canvas Preset</h2>
              <button
                onClick={() => setIsPresetDialogOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Preset Name</label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  placeholder="e.g. LinkedIn Banner"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-400 transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Width (px)</label>
                  <input
                    type="number"
                    value={newPreset.width}
                    onChange={(e) => setNewPreset({ ...newPreset, width: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Height (px)</label>
                  <input
                    type="number"
                    value={newPreset.height}
                    onChange={(e) => setNewPreset({ ...newPreset, height: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setIsPresetDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition-all"
                >
                  Save Preset
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
