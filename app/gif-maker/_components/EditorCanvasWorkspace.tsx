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
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 shrink-0 bg-[#0a182b]/50 backdrop-blur-md'>
        <div className="flex flex-col gap-1">
          <div className='text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400'>GIF Canvas</div>
          <div className='flex items-center gap-1.5 text-[9px] font-bold text-white/50'>
            <span className='rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 whitespace-nowrap'>{editor.canvasDimensions.width}×{editor.canvasDimensions.height}</span>
            <span className='rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 whitespace-nowrap'>{editor.state.length} Layers</span>
            {editor.activeId && (
              <span className='hidden xs:inline-flex rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-400 truncate max-w-[100px]'>
                ID: {editor.activeId.slice(0, 6)}
              </span>
            )}
          </div>
        </div>

        <div className='flex items-center gap-1.5 ml-auto sm:ml-0'>
          {/* Main Controls Group */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => editor.setLeftPanelOpen((prev) => !prev)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${editor.leftPanelOpen ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:bg-white/10'}`}
              title="Toggle Tools"
            >
              <MenuSquare size={16} />
            </button>
            <button
              onClick={() => editor.setRightPanelOpen((prev) => !prev)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${editor.rightPanelOpen ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:bg-white/10'}`}
              title="Toggle Layers"
            >
              <Layers3 size={16} />
            </button>
          </div>

          <div className='w-px h-5 bg-white/10 mx-0.5' />

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={editor.undo}
              disabled={!editor.canUndo}
              className='flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed'
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={editor.redo}
              disabled={!editor.canRedo}
              className='flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition-all hover:bg-white/10 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed'
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className='w-px h-5 bg-white/10 mx-0.5' />

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => editor.setViewportScale(prev => Math.min(prev + 0.1, 5))}
              className='h-8 w-8 flex items-center justify-center rounded-xl text-white/40 hover:bg-white/10'
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => editor.setViewportScale(prev => Math.max(prev - 0.1, 0.1))}
              className='h-8 w-8 flex items-center justify-center rounded-xl text-white/40 hover:bg-white/10'
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
          </div>
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
