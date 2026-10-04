"use client";

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  Square, 
  X, 
  Trash2, 
  Film, 
  MoreVertical, 
  Copy, 
  Lock, 
  Unlock, 
  Play, 
  Layers, 
  Zap, 
  Flame, 
  SlidersHorizontal,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { v4 as uuidv4 } from 'uuid';

interface GifPreset {
  name: string;
  category: string;
  width: number;
  height: number;
  aspect: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
}

export default function GifHomeScreen() {
  const router = useRouter();
  const [customSize, setCustomSize] = useState({ width: 600, height: 400 });
  const [aspectLocked, setAspectLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(600 / 400);
  const [recents, setRecents] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', width: 600, height: 400 });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    const savedMetadata = localStorage.getItem('gif_projects_metadata');
    if (savedMetadata) {
      try {
        setRecents(JSON.parse(savedMetadata));
      } catch (e) {
        console.error("Failed to parse saved gif projects:", e);
      }
    }
    const savedPresets = localStorage.getItem('gif_custom_presets');
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to parse saved presets:", e);
      }
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

  const handleWidthChange = (val: number) => {
    const w = Math.max(1, val);
    if (aspectLocked) {
      setCustomSize({ width: w, height: Math.max(1, Math.round(w / aspectRatio)) });
    } else {
      setCustomSize(prev => ({ ...prev, width: w }));
      setAspectRatio(w / Math.max(1, customSize.height));
    }
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(1, val);
    if (aspectLocked) {
      setCustomSize({ width: Math.max(1, Math.round(h * aspectRatio)), height: h });
    } else {
      setCustomSize(prev => ({ ...prev, height: h }));
      setAspectRatio(Math.max(1, customSize.width) / h);
    }
  };

  const setRatioPreset = (w: number, h: number) => {
    setCustomSize({ width: w, height: h });
    setAspectRatio(w / h);
  };

  const handleCreate = (w: number, h: number) => {
    router.push(`/gif-maker?width=${w}&height=${h}`);
  };

  const handleLoad = (id: string) => {
    router.push(`/gif-maker?projectId=${id}`);
  };

  const handleSavePreset = () => {
    if (!newPreset.name.trim()) return;
    const preset = { ...newPreset, id: uuidv4() };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    localStorage.setItem('gif_custom_presets', JSON.stringify(updated));
    setIsPresetDialogOpen(false);
    setNewPreset({ name: '', width: 600, height: 400 });
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    const updated = recents.filter(p => p.id !== id);
    setRecents(updated);
    localStorage.setItem('gif_projects_metadata', JSON.stringify(updated));
    localStorage.removeItem(`gif_project_data_${id}`);
    setMenuOpenId(null);
  };

  const handleDuplicateProject = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = uuidv4();
    const duplicatedMetadata = {
      ...project,
      id: newId,
      name: `${project.name || 'Animation'} (Copy)`,
      lastEdited: Date.now()
    };
    const originalData = localStorage.getItem(`gif_project_data_${project.id}`);
    if (originalData) {
      localStorage.setItem(`gif_project_data_${newId}`, originalData);
    }
    const updated = [duplicatedMetadata, ...recents];
    setRecents(updated);
    localStorage.setItem('gif_projects_metadata', JSON.stringify(updated));
    setMenuOpenId(null);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('gif_custom_presets', JSON.stringify(updated));
  };

  const presets: GifPreset[] = [
    { 
      name: 'Standard GIF', 
      category: 'Web & Memes',
      width: 600, 
      height: 400, 
      aspect: '3:2',
      badge: 'POPULAR',
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      icon: <Square size={22} /> 
    },
    { 
      name: 'GIF Banner', 
      category: 'Discord & Headers',
      width: 1200, 
      height: 300, 
      aspect: '4:1',
      badge: 'WIDE',
      color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
      icon: <Monitor size={22} /> 
    },
    { 
      name: 'Social Post', 
      category: 'Instagram / Meme',
      width: 1080, 
      height: 1080, 
      aspect: '1:1',
      badge: 'HD',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      icon: <Square size={22} /> 
    },
    { 
      name: 'Story / Reel', 
      category: 'TikTok & Shorts',
      width: 1080, 
      height: 1920, 
      aspect: '9:16',
      badge: 'VERTICAL',
      color: 'from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/30',
      icon: <Smartphone size={22} /> 
    },
    { 
      name: 'Reaction Loop', 
      category: 'Reaction Clip',
      width: 480, 
      height: 480, 
      aspect: '1:1',
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      icon: <Zap size={22} /> 
    },
    { 
      name: 'Animated Sticker', 
      category: 'WhatsApp / Telegram',
      width: 512, 
      height: 512, 
      aspect: '1:1',
      badge: 'STICKER',
      color: 'from-indigo-500/20 to-cyan-500/10 text-indigo-400 border-indigo-500/30',
      icon: <Sparkles size={22} /> 
    },
  ];

  return (
    <div className="min-h-screen bg-[#070c14] text-white selection:bg-cyan-500/30">
      <Header />
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-36 pb-24">
        {/* Hero Header Section with ample clearance */}
        <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
              <Film size={14} className="animate-pulse" />
              <span>GIF Animation Studio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              Create Stunning <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">GIF Loops</span>
            </h1>
            <p className="text-white/50 mt-3 text-base sm:text-lg max-w-2xl leading-relaxed">
              Design high-fps animated GIFs, meme stickers, kinetic typography, and seamless micro-animations with multi-layer keyframe precision.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleCreate(customSize.width, customSize.height)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span>New Animation</span>
            </button>
          </div>
        </header>

        {/* Quick Launch & Presets Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Presets & Canvas Dimensions</h2>
                <p className="text-xs text-white/40">Select a standard format or configure custom frame dimensions</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Custom Size Card */}
            <div className="lg:col-span-5 p-8 rounded-[36px] bg-[#0c1424]/90 border border-white/[0.08] shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-cyan-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">Custom Canvas</h3>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 rounded-full font-bold">
                    {customSize.width} × {customSize.height} px
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 relative">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Width (px)</label>
                    <input 
                      type="number" 
                      value={customSize.width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-xl font-bold text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Height (px)</label>
                    <input 
                      type="number" 
                      value={customSize.height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-xl font-bold text-white font-mono"
                    />
                  </div>

                  {/* Aspect Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setAspectLocked(!aspectLocked);
                      setAspectRatio(customSize.width / Math.max(1, customSize.height));
                    }}
                    className={`absolute left-1/2 top-10 -translate-x-1/2 p-2 rounded-xl border transition-all ${
                      aspectLocked 
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20' 
                        : 'bg-[#0f1a2e] text-white/40 border-white/10 hover:text-white'
                    }`}
                    title={aspectLocked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                  >
                    {aspectLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>

                {/* Quick Aspect Ratio Chips */}
                <div className="mt-5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 mr-1">Ratios:</span>
                  {[
                    { label: '1:1', w: 600, h: 600 },
                    { label: '16:9', w: 960, h: 540 },
                    { label: '9:16', w: 540, h: 960 },
                    { label: '3:2', w: 600, h: 400 },
                    { label: '4:1', w: 1200, h: 300 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => setRatioPreset(chip.w, chip.h)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/40 text-[11px] font-bold text-white/60 hover:text-cyan-300 transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleCreate(customSize.width, customSize.height)}
                className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group active:scale-98"
              >
                <span>Launch GIF Studio</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <button 
                  key={preset.name}
                  onClick={() => handleCreate(preset.width, preset.height)}
                  className="p-5 rounded-[28px] bg-[#0c1424]/70 border border-white/[0.08] hover:border-cyan-500/40 hover:bg-[#111c33] transition-all flex flex-col justify-between text-left group relative overflow-hidden backdrop-blur-md"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br border ${preset.color} group-hover:scale-110 transition-transform`}>
                      {preset.icon}
                    </div>
                    {preset.badge && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                        {preset.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{preset.category}</div>
                    <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors mt-0.5">{preset.name}</div>
                    <div className="text-[11px] font-mono text-cyan-300/80 mt-1.5 font-bold">
                      {preset.width} × {preset.height}
                    </div>
                  </div>
                </button>
              ))}

              {/* Custom Presets Added by User */}
              {customPresets.map((preset) => (
                <div 
                  key={preset.id}
                  onClick={() => handleCreate(preset.width, preset.height)}
                  className="p-5 rounded-[28px] bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/40 transition-all flex flex-col justify-between text-left group relative cursor-pointer backdrop-blur-md"
                >
                  <button 
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/40 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete custom preset"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Square size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-400/50 font-bold uppercase tracking-wider">Custom</div>
                    <div className="font-bold text-sm text-white transition-colors truncate">{preset.name}</div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-1.5 font-bold">
                      {preset.width} × {preset.height}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Custom Preset Button */}
              <button 
                onClick={() => setIsPresetDialogOpen(true)}
                className="p-5 rounded-[28px] border border-dashed border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-3 text-center group min-h-[160px]"
              >
                <div className="p-3.5 rounded-2xl bg-white/5 text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                  <Plus size={22} />
                </div>
                <div>
                  <div className="font-bold text-xs text-white/60 group-hover:text-white transition-colors">Add Custom Preset</div>
                  <div className="text-[10px] text-white/30 mt-0.5">Save size template</div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        {recents.length > 0 ? (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Recent Animations</h2>
                  <p className="text-xs text-white/40">Resume editing saved GIF projects and drafts</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recents.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => handleLoad(project.id)}
                  className="group cursor-pointer rounded-[28px] bg-[#0c1424]/80 border border-white/[0.08] hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-black/40 overflow-hidden flex items-center justify-center">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Film size={48} className="text-white/10" />
                    )}

                    {/* Frame count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300">
                      <Layers size={11} />
                      <span>{project.frameCount || 1} frames</span>
                    </div>

                    {/* Menu button */}
                    <div className="absolute top-3 right-3 project-menu-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className={`p-2 rounded-xl backdrop-blur-md border border-white/10 transition-all ${
                          menuOpenId === project.id 
                            ? 'bg-cyan-500 text-black border-cyan-500' 
                            : 'bg-black/60 text-white/60 hover:text-white'
                        }`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuOpenId === project.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0a1426] border border-white/15 shadow-2xl overflow-hidden py-1 z-40 animate-in fade-in zoom-in duration-150">
                          <button 
                            onClick={(e) => handleDuplicateProject(project, e)}
                            className="w-full px-4 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
                          >
                            <Copy size={14} />
                            <span>Duplicate Project</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-full px-4 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/5"
                          >
                            <Trash2 size={14} />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hover launch overlay */}
                    <div className="absolute inset-0 bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 rounded-full bg-cyan-500 text-black shadow-xl shadow-cyan-500/30 scale-90 group-hover:scale-100 transition-transform">
                        <Play size={18} fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                      {project.name || "Untitled Animation"}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-white/40 mt-3 pt-3 border-t border-white/5 font-mono">
                      <span>{project.width} × {project.height}</span>
                      <span>{new Date(project.lastEdited || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="py-24 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center text-center bg-[#0c1424]/40 mb-20 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
              <Film size={36} />
            </div>
            <h3 className="text-xl font-bold text-white">No saved animations yet</h3>
            <p className="text-white/40 mt-2 max-w-sm text-sm">
              Create your first animated GIF above. Every frame sequence is automatically backed up here.
            </p>
          </div>
        )}
      </main>

      <Footer />

      {/* New Preset Dialog */}
      {isPresetDialogOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-[#091426] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">New GIF Preset</h2>
              <button 
                onClick={() => setIsPresetDialogOpen(false)} 
                className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-bold ml-1">Preset Name</label>
                <input 
                  type="text" 
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                  placeholder="e.g. Discord Avatar Loop"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cyan-400 transition-all text-sm font-semibold text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-white/40 font-bold ml-1">Width (px)</label>
                  <input 
                    type="number" 
                    value={newPreset.width}
                    onChange={(e) => setNewPreset({...newPreset, width: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cyan-400 transition-all text-sm font-semibold text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-white/40 font-bold ml-1">Height (px)</label>
                  <input 
                    type="number" 
                    value={newPreset.height}
                    onChange={(e) => setNewPreset({...newPreset, height: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cyan-400 transition-all text-sm font-semibold text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  onClick={() => setIsPresetDialogOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePreset}
                  className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
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
