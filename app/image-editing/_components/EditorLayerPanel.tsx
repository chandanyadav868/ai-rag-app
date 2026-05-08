"use client";

import ToolBox from '@/components/ToolBox';
import Image from 'next/image';
import { CheckCircleIcon, ChevronLeft, ChevronRight, Copy, Edit2, EyeIcon, EyeOff, Layers, Library, Loader2Icon, LockKeyhole, LockKeyholeOpen, MoreVertical, PlusSquare, Scissors, Trash2Icon, UploadCloud, X } from 'lucide-react';
import React from 'react';
import { AssetLibrary } from './AssetLibrary';
import { InfoActionButton } from './InfoActionButton';
import { AIFeatures } from './AIFeatures';

interface EditorLayerPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorLayerPanel({ editor }: EditorLayerPanelProps) {
  const sortedLayers = editor.state.slice().sort((a, b) => b.order - a.order);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  // Close floating panel when layer selection changes or panel changes
  React.useEffect(() => {
    setActiveCategory(null);
  }, [editor.activeId, editor.layerMenu]);

  return (
    <aside className={`fixed z-30 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] 
      ${editor.rightPanelOpen ? 'translate-x-0 translate-y-0' : 'max-md:translate-y-full md:translate-x-full'} 
      md:right-0 md:left-auto md:top-0 md:h-screen md:w-[420px] md:border-l md:rounded-none
      bottom-0 left-0 right-0 h-[40vh] md:h-screen w-full border-t md:border-t-0 rounded-t-[40px] md:rounded-t-none
      border-white/10 bg-[#0a1728]/95 backdrop-blur-xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-none`}>
      
      {/* Mobile Drag Handle */}
      <div className="md:hidden flex justify-center pt-3 pb-1">
        <div className="w-12 h-1.5 rounded-full bg-white/20" />
      </div>

      <div className='flex h-full flex-col'>
        <div className='border-b border-white/10 px-4 py-4 md:px-5 md:py-5'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>Inspector</div>
              <h2 className='mt-1 text-base font-black text-white md:text-lg lg:text-xl'>Layers</h2>
            </div>
            <div className='flex items-center gap-2'>
              <div className='rounded-xl bg-cyan-400/10 p-2 text-cyan-400 shrink-0'>
                <Layers size={16} />
              </div>
              <button
                onClick={() => editor.setRightPanelOpen(false)}
                className='p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all'
                title="Close Panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className={`mt-4 grid gap-1.5 rounded-xl bg-white/5 p-1 transition-all duration-300 ${editor.selectedIds.length === 1 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {["Layer", "Property", "Assets", ...(editor.selectedIds.length === 1 ? ["AI Features"] : [])].map((item) => (
              <button
                key={item}
                type='button'
                onClick={() => editor.setLayerMenu(item as any)}
                className={`rounded-lg py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition ${editor.layerMenu === item ? 'bg-white text-slate-950 shadow-md' : 'text-white/40 hover:bg-white/5'}`}
              >
                {item === "AI Features" ? "AI" : item}
              </button>
            ))}
          </div>
        </div>

        <div className='historyScrollbar flex-1 overflow-y-auto overflow-x-visible p-4 min-h-0 pb-24'>
          {editor.layerMenu === "Property" ? (
            <div className='flex-1 flex flex-col min-h-0'>
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
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </div>
          ) : editor.layerMenu === "Assets" ? (
            <AssetLibrary editor={editor} />
          ) : editor.layerMenu === "AI Features" ? (
            <AIFeatures editor={editor} />
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
                  className={`relative rounded-2xl border p-3 transition-all duration-300 ${editor.selectedIds.includes(layer.id) ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-[13px] font-bold text-white'>{layer.id}</div>
                      <div className='mt-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white/30'>{layer.type}</div>
                    </div>

                    <div className='relative shrink-0'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === layer.id ? null : layer.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${openMenuId === layer.id ? 'bg-cyan-400 text-black' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === layer.id && (
                        <>
                          <div 
                            className='fixed inset-0 z-40' 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />
                          <div className='absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
                            <div className='grid grid-cols-1 p-1'>
                              <MenuAction
                                icon={layer.hideLayer ? EyeOff : EyeIcon}
                                label={layer.hideLayer ? 'Show' : 'Hide'}
                                onClick={() => {
                                  editor.showHideLayer(layer.id);
                                  setOpenMenuId(null);
                                }}
                              />
                              <MenuAction
                                icon={layer.layerlock ? LockKeyhole : LockKeyholeOpen}
                                label={layer.layerlock ? 'Unlock' : 'Lock'}
                                onClick={() => {
                                  editor.lockLayer(layer.id);
                                  setOpenMenuId(null);
                                }}
                              />
                              <MenuAction
                                icon={Edit2}
                                label='AI Edit'
                                onClick={() => {
                                  editor.setActiveId(layer.id);
                                  editor.setAiEdit(true);
                                  setOpenMenuId(null);
                                }}
                              />
                              <MenuAction
                                icon={Copy}
                                label='Duplicate'
                                onClick={() => {
                                  editor.copyLayer(layer.id);
                                  setOpenMenuId(null);
                                }}
                              />
                              <MenuAction
                                icon={Scissors}
                                label='Mask Studio'
                                onClick={() => {
                                  editor.setActiveId(layer.id);
                                  editor.setMaskStudioOpen(true);
                                  setOpenMenuId(null);
                                }}
                              />
                              <MenuAction
                                icon={PlusSquare}
                                label='Save to Assets'
                                onClick={() => {
                                  editor.saveLayerAsAsset(layer.id);
                                  setOpenMenuId(null);
                                }}
                              />
                              <div className='my-1 border-t border-white/5' />
                              <MenuAction
                                icon={Trash2Icon}
                                label='Delete Layer'
                                danger
                                onClick={() => {
                                  editor.deleteLayer(layer.id);
                                  setOpenMenuId(null);
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {layer.src && layer.type === "image" && (
                    <div className='mt-3 overflow-hidden rounded-xl border border-white/5 bg-black/20 p-1'>
                      <Image src={layer.src} alt='preview' width={240} height={160} className='h-16 w-full object-contain opacity-80' />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MenuAction({ icon: Icon, label, onClick, danger }: { icon: any, label: string, onClick: () => void, danger?: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
    >
      <Icon size={14} className={danger ? 'text-rose-500' : 'text-cyan-400'} />
      {label}
    </button>
  );
}
