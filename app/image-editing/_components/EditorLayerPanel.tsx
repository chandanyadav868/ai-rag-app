"use client";

import ToolBox from '@/components/ToolBox';
import Image from 'next/image';
import { CheckCircleIcon, ChevronLeft, ChevronRight, Copy, Edit2, EyeIcon, EyeOff, Layers, Loader2Icon, LockKeyhole, LockKeyholeOpen, Trash2Icon, UploadCloud } from 'lucide-react';
import React from 'react';
import { InfoActionButton } from './InfoActionButton';

interface EditorLayerPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorLayerPanel({ editor }: EditorLayerPanelProps) {
  const sortedLayers = editor.state.slice().sort((a, b) => b.order - a.order);

  return (
    <aside className={`fixed right-0 top-0 z-30 h-screen w-[min(92vw,460px)] border-l border-white/10 bg-[#0a1728]/95 backdrop-blur-xl transition-transform duration-300 ${editor.rightPanelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-20px)]'}`}>
      <button
        type='button'
        onClick={() => editor.setRightPanelOpen((prev) => !prev)}
        className='absolute left-0 top-1/2 flex h-16 w-5 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-white/10 bg-[#0a1728] text-white shadow-xl'
        aria-label='Toggle layer inspector panel'
      >
        {editor.rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <div className='flex h-full flex-col'>
        <div className='border-b border-white/10 px-5 py-5'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70'>Inspector</div>
              <h2 className='mt-2 text-xl font-black text-white xl:text-2xl'>Layers & Properties</h2>
            </div>
            <div className='rounded-full bg-cyan-400/15 p-3 text-cyan-100'>
              <Layers size={18} />
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/6 p-1'>
            {["Layer", "Property"].map((item) => (
              <button
                key={item}
                type='button'
                onClick={() => editor.setLayerMenu(item)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${editor.layerMenu === item ? 'bg-white text-slate-950' : 'text-white/70 hover:bg-white/10'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className='historyScrollbar flex-1 overflow-y-auto overflow-x-visible p-4 min-h-0 pb-24'>
          {editor.layerMenu === "Property" ? (
            <div className='rounded-3xl border border-white/10 bg-white/[0.04] p-3'>
              <ToolBox
                setState={editor.setState}
                state={editor.state}
                fabricJs={editor.fabricJs}
                selectedId={editor.activeId}
              />
            </div>
          ) : (
            <div className='space-y-3'>
              {sortedLayers.length === 0 && (
                <div className='rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center'>
                  <div className='text-base font-semibold text-white'>No layers yet</div>
                  <div className='mt-2 text-sm leading-6 text-white/65'>
                    Add text, upload an image, or draw a shape to start building your composition.
                  </div>
                </div>
              )}

              {sortedLayers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => editor.selectingItem(layer.id)}
                  className={`rounded-3xl border p-4 transition ${editor.activeId === layer.id ? 'border-cyan-300/60 bg-cyan-400/10' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'}`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-semibold text-white'>{layer.id}</div>
                      <div className='mt-1 text-xs uppercase tracking-[0.2em] text-white/45'>{layer.type}</div>
                    </div>

                    {/* ai Ref button comment out for future use */}
                    {/* <label className='mt-0.5 flex shrink-0 items-center gap-2 text-xs text-white/60'>
                      <input
                        type="checkbox"
                        checked={Boolean(layer.refrenceAiCheckBox)}
                        onChange={(e) => editor.checkingBox(layer.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      AI Ref
                    </label> */}
                  </div>

                  {layer.src && layer.type === "image" && (
                    <div className='mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2'>
                      <Image src={layer.src} alt='preview' width={240} height={160} className='h-24 w-full object-contain' />
                    </div>
                  )}

                  <div className='mt-4 grid grid-cols-3 gap-2'>
                    <InfoActionButton
                      icon={layer.hideLayer ? EyeOff : EyeIcon}
                      label={layer.hideLayer ? 'Show Layer' : 'Hide Layer'}
                      description='Toggle the selected layer visibility without deleting it.'
                      onClick={() => editor.showHideLayer(layer.id)}
                      compact
                    />
                    <InfoActionButton
                      icon={layer.layerlock ? LockKeyhole : LockKeyholeOpen}
                      label={layer.layerlock ? 'Unlock Layer' : 'Lock Layer'}
                      description='Prevent accidental movement, resize, and rotation while keeping the layer in place.'
                      onClick={() => editor.lockLayer(layer.id)}
                      compact
                    />
                    <InfoActionButton
                      icon={Edit2}
                      label='AI Edit'
                      description='Open the focused edit modal to crop or transform the selected layer before sending it back to the canvas.'
                      onClick={() => {
                        editor.setActiveId(layer.id);
                        editor.setAiEdit(true);
                      }}
                      compact
                    />
                    <InfoActionButton
                      icon={Copy}
                      label='Duplicate'
                      description='Clone the layer, offset it slightly, and keep it editable as a new layer.'
                      onClick={() => editor.copyLayer(layer.id)}
                      compact
                    />
                    <InfoActionButton
                      icon={Trash2Icon}
                      label='Delete'
                      description='Remove the selected layer from both the Fabric canvas and the layer stack.'
                      onClick={() => editor.deleteLayer(layer.id)}
                      compact
                    />

                    {/* uploading for ai reference button comment out for future use */}
                    {/* {layer.currentlyUploading ? (
                      <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white'>
                        <Loader2Icon size={18} className='animate-spin' />
                      </div>
                    ) : layer.geminaUploadData?.state === "ACTIVE" ? (
                      <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-100'>
                        <CheckCircleIcon size={18} />
                      </div>
                    ) : (
                      <InfoActionButton
                        icon={UploadCloud}
                        label='Upload Ref'
                        description='Upload this layer as a Gemini reference asset so it can be reused in AI image generation.'
                        onClick={() => editor.uploadImageGemina(layer.id)}
                        compact
                      />
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
