"use client";

import React, { useState } from 'react';
import { X, Link, Upload, ClipboardPaste, Loader2 } from 'lucide-react';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlInsert: (url: string) => Promise<void>;
  onFileUpload: () => void;
}

export function InsertImageModal({ isOpen, onClose, onUrlInsert, onFileUpload }: InsertImageModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  if (!isOpen) return null;

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      await onUrlInsert(url.trim());
      setUrl("");
      onClose();
    } catch (error) {
      showToast("Failed to load image from URL. Please check the link.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let found = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          onUrlInsert(imageUrl).then(() => {
            onClose();
          }).catch(() => {
            showToast("Failed to process pasted image.");
          });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      showToast("No image found in clipboard. Please copy an image first.");
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a1728] shadow-2xl animate-in fade-in zoom-in duration-200'>
        <div className='flex items-center justify-between border-b border-white/5 px-6 py-4'>
          <h2 className='text-lg font-bold text-white'>Insert Image</h2>
          <button
            onClick={onClose}
            className='rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition'
          >
            <X size={20} />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {/* URL Section */}
          <form onSubmit={handleUrlSubmit} className='space-y-3'>
            <label className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40'>
              <Link size={14} />
              Insert from URL
            </label>
            <div className='flex gap-2'>
              <input
                type="url"
                placeholder='https://example.com/image.png'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className='flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 transition'
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className='flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition'
              >
                {loading ? <Loader2 size={18} className='animate-spin' /> : "Add"}
              </button>
            </div>
          </form>

          <div className='relative py-2'>
            <div className='absolute inset-0 flex items-center' aria-hidden="true">
              <div className='w-full border-t border-white/5'></div>
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-[#0a1728] px-3 text-white/20 font-medium'>Or</span>
            </div>
          </div>

          {/* Paste Section */}
          <div className='space-y-3'>
            <label className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40'>
              <ClipboardPaste size={14} />
              Paste Image (Ctrl+V)
            </label>
            <div className='relative group'>
              <textarea
                placeholder="Paste image here (Ctrl+V)..."
                onPaste={handlePaste}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-cyan-500/50 focus:bg-white/10 transition-all text-center resize-none flex items-center justify-center"
              />
            </div>
          </div>

          <div className='relative py-2'>
            <div className='absolute inset-0 flex items-center' aria-hidden="true">
              <div className='w-full border-t border-white/5'></div>
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-[#0a1728] px-3 text-white/20 font-medium'>Or</span>
            </div>
          </div>

          {/* Upload Section */}
          <button
            onClick={() => {
              onFileUpload();
              onClose();
            }}
            className='flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition group'
          >
            <div className='rounded-full bg-cyan-400/10 p-2 text-cyan-400 group-hover:scale-110 transition'>
              <Upload size={18} />
            </div>
            <span className='text-sm font-semibold text-white/80'>Upload from Local Storage</span>
          </button>

          <p className='text-center text-[10px] text-white/30'>
            Tip: You can also drag and drop images directly onto the canvas.
          </p>
        </div>

        {/* Custom Toast */}
        {toast && (
          <div className='absolute bottom-6 left-6 right-6 z-[110] animate-in slide-in-from-bottom-2 fade-in duration-300'>
            <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-2xl ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'} backdrop-blur-md`}>
              <p className='text-sm font-medium'>{toast.message}</p>
              <button onClick={() => setToast(null)}><X size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

