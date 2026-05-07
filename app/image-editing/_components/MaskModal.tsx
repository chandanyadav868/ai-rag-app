"use client";

import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Clipboard, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (url: string) => void;
}

export function MaskModal({ isOpen, onClose, onApply }: MaskModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'paste'>('upload');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      onApply(event.target?.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!url) return;
    onApply(url);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              onApply(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      toast.error("No image found in clipboard.");
    } catch (err) {
      toast.error("Failed to read clipboard.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#0a182b] shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <div>
            <h3 className="text-xl font-bold text-white">Apply Mask</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Select an image to use as clip path</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-white/40 transition hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1 mb-6">
            {(['upload', 'url', 'paste'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase transition ${activeTab === tab ? 'bg-white text-slate-950' : 'text-white/60 hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'upload' && (
              <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 transition hover:border-cyan-500/50 hover:bg-cyan-500/5">
                {loading ? (
                  <Loader2 className="animate-spin text-cyan-400" size={32} />
                ) : (
                  <>
                    <div className="mb-4 rounded-full bg-cyan-400/10 p-4 text-cyan-400">
                      <Upload size={24} />
                    </div>
                    <span className="text-sm font-semibold text-white">Drop mask image here</span>
                    <span className="mt-1 text-xs text-white/40">PNG, JPG, or SVG supported</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={loading} />
              </label>
            )}

            {activeTab === 'url' && (
              <div className="space-y-4 py-8">
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-cyan-400">
                    <LinkIcon size={18} />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-400/50"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  className="w-full rounded-2xl bg-cyan-500 py-4 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Fetch Mask
                </button>
              </div>
            )}

            {activeTab === 'paste' && (
              <div className="flex h-48 flex-col items-center justify-center py-8">
                <div className="mb-6 rounded-full bg-emerald-400/10 p-6 text-emerald-400">
                  <Clipboard size={32} />
                </div>
                <button
                  onClick={handlePaste}
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-8 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  Paste from Clipboard
                </button>
                <p className="mt-4 text-xs text-white/30 italic">Click the button after copying an image</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 px-8 py-6">
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ImageIcon size={14} />
            <span>The mask will be scaled to match your selected layer's dimensions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
