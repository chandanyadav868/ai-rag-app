"use client";

import { Grid3X3, Layers3, Maximize2, MenuSquare, Minus, Move, Plus, Redo2, Undo2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { InfoActionButton } from './InfoActionButton';

interface EditorCanvasWorkspaceProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorCanvasWorkspace({ editor }: EditorCanvasWorkspaceProps) {
  useEffect(() => {
    const container = document.getElementById('workspace-scroll-container');
    if (container) {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, []);

  return (
    <section className='relative min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.9),_rgba(2,6,23,1))] lg:w-1/2 lg:mx-auto'>
      <div className='flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-6'>
        <div className="min-w-0">
          <div className='hidden xs:block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>Canvas</div>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-white/60'>
            <span className='rounded-lg bg-white/5 px-2 py-1 border border-white/5'>{editor.canvasDimensions.width}×{editor.canvasDimensions.height}</span>
            <span className='rounded-lg bg-white/5 px-2 py-1 border border-white/5'>{editor.state.length} L</span>
            {editor.activeId && <span className='rounded-lg bg-cyan-400/10 px-2 py-1 text-cyan-400 border border-cyan-400/20 truncate max-w-[120px]'>ID: {editor.activeId.slice(0, 8)}</span>}
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

      <div className='flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-6'>
        <div className='hidden sm:flex flex-wrap items-center gap-2 text-[11px] text-white/40'>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5'>
            <Move size={12} />
            Alt + Drag to pan
          </span>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5'>
            <Maximize2 size={12} />
            Pinch to zoom
          </span>
        </div>

        <div className='flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end'>
          <button
            onClick={editor.undo}
            disabled={!editor.canUndo}
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 border border-white/5'
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={editor.redo}
            disabled={!editor.canRedo}
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 border border-white/5 mr-1'
            title="Redo"
          >
            <Redo2 size={16} />
          </button>

          <InfoActionButton
            icon={MenuSquare}
            label='Tools'
            description='Open the tools and AI panel.'
            onClick={() => editor.setLeftPanelOpen(true)}
            active={editor.leftPanelOpen}
            compact
          />
          <InfoActionButton
            icon={Layers3}
            label='Layers'
            description='Open the layer and properties sidebar.'
            onClick={() => editor.setRightPanelOpen(true)}
            active={editor.rightPanelOpen}
            compact
          />

          <div className="w-px h-6 bg-white/10 mx-1" />

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

      <div className="relative w-full h-[calc(100vh-140px)]">
        {/* Floating Page Navigation - As requested in Red Rectangle position */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 py-2 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar max-w-[30vw] py-1">
            {editor.pages.map((page: any, idx: number) => (
              <button
                key={page.id}
                onClick={() => editor.switchPage(idx)}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${editor.activePageIndex === idx ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/40'}`}
              >
                <span className="text-[11px] font-black">{idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={editor.addPage}
            className="group flex h-9 items-center gap-2.5 px-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 transition-all hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Add Page</span>
          </button>
        </div>

        <div
          id='workspace-scroll-container'
          onClick={(e) => {
            if (e.target === e.currentTarget) editor.deselectAll();
          }}
          className='h-full w-full overflow-auto custom-scrollbar bg-black/10'
        >
        <div className='relative z-10 flex min-h-full min-w-full items-center justify-center p-[40vh_40vw]'>
          <div
            ref={editor.canvasDivRef}
            onClick={(e) => e.stopPropagation()}
            className='relative flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.2)]'
            style={{
              transform: `scale(${editor.viewportScale})`,
              transformOrigin: 'center center',
              width: editor.canvasDimensions.width,
              height: editor.canvasDimensions.height,
              transition: 'transform 0.1s ease-out',
            }}
          >
            <canvas
              ref={editor.canvasRef}
              id='fabricJsCanvas'
              onClick={(e) => e.stopPropagation()}
              className='bg-transparent'
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
    </div>
  </section>
);
}
