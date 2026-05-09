"use client";

import React, { useEffect, useState } from 'react';
import { Plus, LayoutGrid, Clock, ChevronRight, Settings2, Image as ImageIcon, Smartphone, Monitor, Square, Home, X, Trash2, Film, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { v4 as uuidv4 } from 'uuid';

export default function GifHomeScreen() {
  const router = useRouter();
  const [customSize, setCustomSize] = useState({ width: 600, height: 400 });
  const [recents, setRecents] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', width: 600, height: 400 });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    const savedMetadata = localStorage.getItem('gif_projects_metadata');
    if (savedMetadata) {
      setRecents(JSON.parse(savedMetadata));
    }
    const savedPresets = localStorage.getItem('gif_custom_presets');
    if (savedPresets) {
      setCustomPresets(JSON.parse(savedPresets));
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
    router.push(`/gif-maker?width=${w}&height=${h}`);
  };

  const handleLoad = (id: string) => {
    router.push(`/gif-maker?projectId=${id}`);
  };

  const handleSavePreset = () => {
    if (!newPreset.name) return;
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
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('gif_custom_presets', JSON.stringify(updated));
  };

  const presets = [
    { name: 'Standard GIF', width: 600, height: 400, icon: <Square size={20} /> },
    { name: 'GIF Banner', width: 1200, height: 300, icon: <Monitor size={20} /> },
    { name: 'Social Post', width: 1080, height: 1080, icon: <Smartphone size={20} /> },
    { name: 'Ad Banner', width: 300, height: 250, icon: <LayoutGrid size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#07111f] text-white font-sans">
      <Header />
      
      <main className="max-w-7xl mx-auto p-6 sm:p-10 pt-24">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Film size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Animation Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              GIF Studio
            </h1>
            <p className="text-white/40 mt-3 text-lg">Create high-quality animated GIFs and micro-animations</p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium">
              <Settings2 size={18} className="text-cyan-400" />
              GIF Settings
            </button>
          </div>
        </header>

        {/* Create Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Plus size={28} />
            </div>
            <h2 className="text-2xl font-bold">New Animation</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Custom Size Card */}
            <div className="lg:col-span-2 p-10 rounded-[40px] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-20 -mt-10 -mr-10 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-1000" />
              
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                Custom Size
              </h3>
              
              <div className="flex flex-col sm:flex-row items-end gap-6 relative z-10">
                <div className="flex-1 w-full space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40 font-black ml-1">Width (PX)</label>
                  <input 
                    type="number" 
                    value={customSize.width}
                    onChange={(e) => setCustomSize({...customSize, width: parseInt(e.target.value) || 0})}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-2xl font-black text-cyan-50"
                  />
                </div>
                <div className="flex-1 w-full space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40 font-black ml-1">Height (PX)</label>
                  <input 
                    type="number" 
                    value={customSize.height}
                    onChange={(e) => setCustomSize({...customSize, height: parseInt(e.target.value) || 0})}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-2xl font-black text-cyan-50"
                  />
                </div>
                <button 
                  onClick={() => handleCreate(customSize.width, customSize.height)}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black p-5 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 group/btn"
                >
                  <Plus size={32} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {presets.map((preset) => (
                <button 
                  key={preset.name}
                  onClick={() => handleCreate(preset.width, preset.height)}
                  className="p-6 rounded-[32px] bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-4 text-center group"
                >
                  <div className="p-4 rounded-2xl bg-white/5 text-white/40 group-hover:text-cyan-400 group-hover:scale-110 transition-all">
                    {preset.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm group-hover:text-white transition-colors">{preset.name}</div>
                    <div className="text-[10px] text-white/20 mt-1 font-bold tracking-widest">{preset.width} × {preset.height}</div>
                  </div>
                </button>
              ))}

              {/* Custom Presets */}
              {customPresets.map((preset) => (
                <div 
                  key={preset.id}
                  onClick={() => handleCreate(preset.width, preset.height)}
                  className="p-6 rounded-[32px] bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex flex-col items-center justify-center gap-4 text-center group relative cursor-pointer"
                >
                  <button 
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-black/20 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-all">
                    <Square size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white transition-colors">{preset.name}</div>
                    <div className="text-[10px] text-cyan-400/50 mt-1 font-bold tracking-widest">{preset.width} × {preset.height}</div>
                  </div>
                </div>
              ))}

              {/* Add Preset Button */}
              <button 
                onClick={() => setIsPresetDialogOpen(true)}
                className="p-6 rounded-[32px] border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-4 text-center group"
              >
                <div className="p-4 rounded-full bg-white/5 text-white/20 group-hover:text-cyan-400 group-hover:scale-110 transition-all">
                  <Plus size={24} />
                </div>
                <div className="font-bold text-sm text-white/40 group-hover:text-white">New Preset</div>
              </button>
            </div>
          </div>
        </section>

        {/* Recent Projects */}
        {recents.length > 0 ? (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
                  <Clock size={28} />
                </div>
                <h2 className="text-2xl font-bold">Recent GIFs</h2>
              </div>
              <button className="text-cyan-400 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                See All Animations <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {recents.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => handleLoad(project.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden bg-white/5 border border-white/10 transition-all group-hover:-translate-y-3 group-hover:shadow-[0_40px_100px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/30">
                    <div className="absolute top-4 right-4 z-30 project-menu-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-all ${menuOpenId === project.id ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-black/60 text-white/40 hover:text-white'}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {menuOpenId === project.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#09182b] border border-white/10 shadow-2xl overflow-hidden py-1 z-40 animate-in fade-in zoom-in duration-200">
                          <button 
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete Project
                          </button>
                        </div>
                      )}
                    </div>
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/5">
                        <Film size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Edit Animation</span>
                        <div className="p-1.5 rounded-full bg-cyan-500 text-black">
                          <ChevronRight size={14} strokeWidth={4} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 px-3">
                    <h3 className="font-bold text-base truncate group-hover:text-cyan-400 transition-colors">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                        {new Date(project.lastEdited).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {project.width}x{project.height}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="py-32 rounded-[60px] border-2 border-dashed border-white/5 flex flex-col items-center text-center bg-white/[0.01]">
            <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
              <LayoutGrid size={40} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-bold text-white/40">No animations found</h3>
            <p className="text-white/20 mt-4 max-w-sm text-lg leading-relaxed">
              Every GIF you create will be automatically saved here for quick access.
            </p>
          </div>
        )}
      </main>

      <Footer />

      {isPresetDialogOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-[40px] border border-white/10 bg-[#09182b]/95 p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white">New GIF Preset</h2>
              <button onClick={() => setIsPresetDialogOpen(false)} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-white/40 font-black ml-1">Preset Name</label>
                <input 
                  type="text" 
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                  placeholder="e.g. My GIF Style"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-lg font-bold text-white"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40 font-black ml-1">Width</label>
                  <input 
                    type="number" 
                    value={newPreset.width}
                    onChange={(e) => setNewPreset({...newPreset, width: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-lg font-bold text-white"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40 font-black ml-1">Height</label>
                  <input 
                    type="number" 
                    value={newPreset.height}
                    onChange={(e) => setNewPreset({...newPreset, height: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-lg font-bold text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsPresetDialogOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePreset}
                  className="flex-1 px-6 py-4 rounded-2xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Create Preset
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
