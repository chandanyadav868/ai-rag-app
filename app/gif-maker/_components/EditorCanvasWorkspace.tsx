"use client";

import { Grid3X3, Layers3, Maximize2, MenuSquare, Minus, Move, Plus, Redo2, Undo2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { InfoActionButton } from './InfoActionButton';

import { GifTimeline } from './GifTimeline';

import { useGifEditor } from '../_hooks/useGifEditor';

interface EditorCanvasWorkspaceProps {
  editor: ReturnType<typeof useGifEditor>;
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
    <section className='relative flex h-screen w-full flex-col bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.9),_rgba(2,6,23,1))] lg:w-1/2 lg:mx-auto'>
      <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 shrink-0'>
        <div>
          <div className='text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>GIF Canvas</div>
          <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-white/70'>
            <span className='rounded-full border border-white/5 bg-white/5 px-2.5 py-1 uppercase tracking-tight'>{editor.canvasDimensions.width}×{editor.canvasDimensions.height}</span>
            <span className='rounded-full border border-white/5 bg-white/5 px-2.5 py-1 uppercase tracking-tight'>{editor.state.length} Layers</span>
            {editor.activeId && <span className='hidden sm:inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-400 uppercase tracking-tight'>Selected: {editor.activeId.slice(0, 8)}...</span>}
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

      <div className='flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 flex-wrap shrink-0'>
        <div className='hidden sm:flex flex-wrap items-center gap-2 text-xs text-white/65'>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2'>
            <Maximize2 size={14} />
            Scroll or pinch to zoom
          </span>
        </div>

        <div className='flex items-center gap-2 w-full justify-center sm:w-auto'>
          <button
            onClick={editor.undo}
            disabled={!editor.canUndo}
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed border border-white/10'
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={editor.redo}
            disabled={!editor.canRedo}
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed border border-white/10 mr-2'
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={18} />
          </button>

          <button
            onClick={() => editor.setViewportScale(prev => Math.min(prev + 0.1, 5))}
            className='h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70'
            title="Zoom In"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => editor.setViewportScale(prev => Math.max(prev - 0.1, 0.1))}
            className='h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70'
            title="Zoom Out"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      <div
        id='workspace-scroll-container'
        onClick={(e) => {
          if (e.target === e.currentTarget) editor.deselectAll();
        }}
        className='relative flex-1 w-full overflow-auto custom-scrollbar bg-black/20'
      >
        <div className='relative z-10 flex min-h-full min-w-full items-center justify-center p-[100vh_100vw]'>
          <div
            ref={editor.canvasDivRef}
            onClick={(e) => e.stopPropagation()}
            className='relative flex items-center justify-center shadow-2xl'
            style={{
              width: editor.canvasDimensions.width * editor.viewportScale,
              height: editor.canvasDimensions.height * editor.viewportScale,
              transition: 'all 0.1s ease-out',
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

      <GifTimeline
        frames={editor.frames}
        removeFrame={editor.removeFrame}
        addFrame={editor.addFrame}
        clearFrames={editor.clearFrames}
        exportGif={editor.exportGif}
        isPlaying={editor.isPlaying}
        setIsPlaying={editor.setIsPlaying}
        previewIdx={editor.previewIdx}
      />
    </section>
  );
}
