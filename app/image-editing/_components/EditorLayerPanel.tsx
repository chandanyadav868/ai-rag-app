"use client";

import ToolBox from '@/components/ToolBox';
import Image from 'next/image';
import { CheckCircleIcon, ChevronLeft, ChevronRight, Copy, Edit2, EyeIcon, EyeOff, Layers, Library, Loader2Icon, LockKeyhole, LockKeyholeOpen, PlusSquare, Scissors, Trash2Icon, UploadCloud } from 'lucide-react';
import React from 'react';
import { AssetLibrary } from './AssetLibrary';
import { InfoActionButton } from './InfoActionButton';

interface EditorLayerPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorLayerPanel({ editor }: EditorLayerPanelProps) {
  const sortedLayers = editor.state.slice().sort((a, b) => b.order - a.order);

  return (
    <aside className={`fixed right-0 top-0 z-30 h-screen w-[min(95vw,420px)] border-l border-white/10 bg-[#0a1728]/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${editor.rightPanelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-0px)]'}`}>
      <button
        type='button'
        onClick={() => editor.setRightPanelOpen((prev) => !prev)}
        className='absolute left-0 top-1/2 flex h-14 w-4 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-[#0a1728] text-white shadow-xl transition-all hover:bg-cyan-500 group'
        aria-label='Toggle layer inspector panel'
      >
        {editor.rightPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      <div className='flex h-full flex-col'>
        <div className='border-b border-white/10 px-4 py-4 md:px-5 md:py-5'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>Inspector</div>
              <h2 className='mt-1 text-base font-black text-white md:text-lg lg:text-xl'>Layers</h2>
            </div>
            <div className='rounded-xl bg-cyan-400/10 p-2 text-cyan-400 shrink-0'>
              <Layers size={16} />
            </div>
          </div>

          <div className='mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-white/5 p-1'>
            {["Layer", "Property", "Assets"].map((item) => (
              <button
                key={item}
                type='button'
                onClick={() => editor.setLayerMenu(item as any)}
                className={`rounded-lg py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition ${editor.layerMenu === item ? 'bg-white text-slate-950 shadow-md' : 'text-white/40 hover:bg-white/5'}`}
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
                activeTool={editor.activeTool}
                brushType={editor.brushType}
                setBrushType={editor.setBrushType}
                eraserSize={editor.eraserSize}
                setEraserSize={editor.setEraserSize}
                customFonts={editor.customFonts}
                addCustomFont={editor.addCustomFont}
                fontLoading={editor.fontLoading}
                attachTransformListeners={editor.attachTransformListeners}
              />
            </div>
          ) : editor.layerMenu === "Assets" ? (
            <AssetLibrary editor={editor} />
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
                  className={`rounded-2xl border p-3 transition-all duration-300 ${editor.selectedIds.includes(layer.id) ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='truncate text-[13px] font-bold text-white'>{layer.id}</div>
                      <div className='mt-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/30'>{layer.type}</div>
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
                    <div className='mt-3 overflow-hidden rounded-xl border border-white/5 bg-black/20 p-1.5'>
                      <Image src={layer.src} alt='preview' width={240} height={160} className='h-20 w-full object-contain opacity-80' />
                    </div>
                  )}

                  <div className='mt-3 grid grid-cols-4 sm:grid-cols-3 gap-1.5'>
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
                      icon={Scissors}
                      label='Mask'
                      description='Apply an image mask to this layer using a custom shape or texture.'
                      onClick={() => {
                        editor.setActiveId(layer.id);
                        editor.setMaskStudioOpen(true);
                      }}
                      compact
                    />
                    <InfoActionButton
                      icon={Trash2Icon}
                      label='Delete'
                      description='Remove the selected layer from both the Fabric canvas and the layer stack.'
                      onClick={() => editor.deleteLayer(layer.id)}
                      compact
                    />
                    <InfoActionButton
                      icon={PlusSquare}
                      label='To Assets'
                      description='Capture this layer and save it to your persistent Asset Library for future use.'
                      onClick={() => editor.saveLayerAsAsset(layer.id)}
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
