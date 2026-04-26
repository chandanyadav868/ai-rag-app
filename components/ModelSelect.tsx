"use client";

import React, { useState, useRef, useEffect } from 'react'

export default function ModelSelect({ models = [], value, onChange }: { models: any[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const selected = models.find((m) => m.value === value) || null;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((s) => !s)} className="w-full flex items-center justify-between p-2 rounded-md bg-transparent border border-white/6">
        <span className="text-sm">{selected ? selected.name : 'Select model'}</span>
        <span className="ml-2 text-xs text-white/60">▼</span>
      </button>

      {open && (
        <ul className="absolute z-50 bottom-full mb-1 w-full max-h-60 overflow-auto rounded-md bg-[#06121a] border border-white/6 py-1">
          {models.map((m) => (
            <li key={m.value}>
              <button
                type="button"
                onClick={() => { onChange(m.value); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-white/3 flex items-center justify-between"
              >
                <span className="text-sm">{m.name}</span>
                {m.new && <span className="text-xs text-emerald-300/80 ml-2">new</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
