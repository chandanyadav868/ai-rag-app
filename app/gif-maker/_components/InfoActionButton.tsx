"use client";

import { LucideIcon } from 'lucide-react';
import React from 'react';

interface InfoActionButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function InfoActionButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  compact = false,
  className = "",
}: InfoActionButtonProps) {
  return (
    <div className={`relative ${compact ? 'inline-flex' : 'flex'}`}>
      <button
        type='button'
        disabled={disabled}
        onClick={onClick}
        className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${compact ? 'justify-center px-3 py-3' : 'w-full'} ${active ? 'border-cyan-300/60 bg-cyan-400/15 text-white' : 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10'} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <Icon size={18} className='shrink-0' />
        {!compact && (
          <span className='text-sm font-medium'>{label}</span>
        )}
      </button>
    </div>
  );
}
