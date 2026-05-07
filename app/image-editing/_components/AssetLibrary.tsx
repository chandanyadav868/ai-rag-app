"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Link as LinkIcon, Upload, ClipboardPaste, PlusCircle } from 'lucide-react';
import { InfoActionButton } from './InfoActionButton';
import { toast } from 'sonner';

interface AssetLibraryProps {
  editor: any;
}

export function AssetLibrary({ editor }: AssetLibraryProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    editor.addAsset(urlInput, `URL Asset ${editor.assets.length + 1}`);
    setUrlInput('');
    setIsAdding(false);
    toast.success("Asset added from URL");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        editor.addAsset(src, file.name);
        toast.success("Local asset added");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
          const blob = await item.getType(item.types.find(t => t.startsWith("image/"))!);
          const reader = new FileReader();
          reader.onload = (event) => {
            const src = event.target?.result as string;
            editor.addAsset(src, `Pasted Asset ${editor.assets.length + 1}`);
            toast.success("Clipboard asset added");
          };
          reader.readAsDataURL(blob);
        }
      }
    } catch (err) {
      toast.error("Could not paste from clipboard. Make sure you have an image copied.");
    }
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
        <h3 className='text-sm font-bold uppercase tracking-widest text-cyan-400'>Add New Assets</h3>
        <p className='mt-1 text-xs text-white/50'>Build your persistent library of images and graphics.</p>
        
        <div className='mt-4 grid grid-cols-3 gap-2'>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10'
          >
            <LinkIcon size={18} className='text-cyan-400' />
            <span className='text-[10px] font-bold uppercase text-white/70'>URL</span>
          </button>
          
          <label className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10'>
            <Upload size={18} className='text-emerald-400' />
            <span className='text-[10px] font-bold uppercase text-white/70'>Upload</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>

          <button 
            onClick={handlePaste}
            className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10'
          >
            <ClipboardPaste size={18} className='text-fuchsia-400' />
            <span className='text-[10px] font-bold uppercase text-white/70'>Paste</span>
          </button>
        </div>

        {isAdding && (
          <div className='mt-4 flex gap-2'>
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL here..."
              className='flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50'
            />
            <button 
              onClick={handleUrlAdd}
              className='rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-600'
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-bold uppercase tracking-widest text-white/70 px-1'>Your Library ({editor.assets.length})</h3>
        
        {editor.assets.length === 0 ? (
          <div className='rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center'>
            <p className='text-sm text-white/40'>Your asset library is empty.</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-3'>
            {editor.assets.map((asset: any) => (
              <div 
                key={asset.id} 
                className='group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 transition hover:border-cyan-500/50'
              >
                <Image 
                  src={asset.src} 
                  alt={asset.name} 
                  fill 
                  className='object-contain p-2' 
                />
                
                <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100'>
                  <button 
                    onClick={() => editor.addImageToCanvas(asset.src)}
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition hover:scale-110'
                    title="Insert to Canvas"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => editor.removeAsset(asset.id)}
                    className='flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 text-white shadow-lg transition hover:scale-110'
                    title="Remove from Library"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className='absolute bottom-0 left-0 right-0 truncate bg-black/80 px-2 py-1 text-[9px] text-white/70 opacity-0 transition group-hover:opacity-100'>
                  {asset.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
