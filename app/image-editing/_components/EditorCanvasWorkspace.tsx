"use client";

import { Grid3X3, Layers3, Maximize2, MenuSquare, Minus, Move, Plus } from 'lucide-react';
import React from 'react';
import { InfoActionButton } from './InfoActionButton';

interface EditorCanvasWorkspaceProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorCanvasWorkspace({ editor }: EditorCanvasWorkspaceProps) {
  return (
    <section className='relative min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.9),_rgba(2,6,23,1))] lg:w-1/2 lg:mx-auto'>
      <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6'>
        <div>
          <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70'>Canvas Stage</div>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-sm text-white/75'>
            <span className='rounded-full bg-white/8 px-3 py-1'>{editor.canvasOrientation}</span>
            <span className='rounded-full bg-white/8 px-3 py-1'>{editor.state.length} layers</span>
            {editor.activeId && <span className='rounded-full bg-cyan-400/15 px-3 py-1 text-cyan-100'>Selected: {editor.activeId.slice(0, 14)}</span>}
          </div>
        </div>

        <div className='flex items-center gap-2 lg:hidden'>
          <InfoActionButton
            icon={MenuSquare}
            label='Toggle Tools'
            description='Show or hide the tools and AI panel. Helpful on smaller screens.'
            onClick={() => editor.setLeftPanelOpen((prev) => !prev)}
            compact
            className='xl:hidden'
          />
          <InfoActionButton
            icon={Layers3}
            label='Toggle Layers'
            description='Show or hide the layer and properties sidebar. Helpful on smaller screens.'
            onClick={() => editor.setRightPanelOpen((prev) => !prev)}
            compact
            className='xl:hidden'
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6'>
        <div className='flex flex-wrap items-center gap-2 text-xs text-white/65'>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2'>
            <Move size={14} />
            Hold `Alt` and drag to pan
          </span>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2'>
            <Maximize2 size={14} />
            Scroll or pinch to zoom
          </span>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2'>
            <Grid3X3 size={14} />
            `Delete` removes selected layers
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <InfoActionButton
            icon={Plus}
            label='Zoom In'
            description='Increase the canvas viewport scale without changing the export size.'
            onClick={() => editor.resizeCanvas("ZoomIn", 0.1)}
            compact
          />
          <InfoActionButton
            icon={Minus}
            label='Zoom Out'
            description='Decrease the canvas viewport scale to see more of the workspace.'
            onClick={() => editor.resizeCanvas("ZoomOut", 0.1)}
            compact
          />
        </div>
      </div>

      <div className='relative flex min-h-[calc(100vh-132px)] items-center justify-center overflow-auto p-4 sm:p-8'>
        <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]' />

        <div className='relative z-10 flex h-full w-full items-center justify-center'>
          <div
            ref={editor.canvasDivRef}
            className='relative flex min-h-[320px] w-full max-w-full items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-3 shadow-[0_30px_120px_rgba(8,15,32,0.65)] sm:p-6'
            style={{ scale: 1 }}
          >
            <canvas
              ref={editor.canvasRef}
              id='fabricJsCanvas'
              onClick={(e) => e.stopPropagation()}
              className='rounded-2xl border-2 border-dashed border-cyan-200/40 shadow-2xl'
            />
          </div>
        </div>

        {editor.somethingDrop && (
          <div className='absolute inset-4 z-20 flex items-center justify-center rounded-[32px] border-2 border-dashed border-cyan-300 bg-cyan-300/10 backdrop-blur-sm sm:inset-6'>
            <div className='rounded-2xl bg-[#081221] px-5 py-4 text-center shadow-2xl'>
              <div className='text-lg font-bold text-white'>Drop image to insert</div>
              <div className='mt-1 text-sm text-white/70'>Supported files will be added as editable canvas layers.</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
