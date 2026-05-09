"use client";

import ToolBox from '@/components/ToolBox';
import Image from 'next/image';
import { CheckCircleIcon, ChevronLeft, ChevronRight, Copy, Crop, Edit2, EyeIcon, EyeOff, Layers, Library, Loader2Icon, LockKeyhole, LockKeyholeOpen, MoreVertical, PlusSquare, Scissors, Trash2Icon, UploadCloud, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
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
  const [copyToPageLayerId, setCopyToPageLayerId] = React.useState<string | null>(null);

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
            <div className='space-y-6'>
              {editor.pages.map((page: any, pIdx: number) => {
                const isPageActive = editor.activePageIndex === pIdx;
                const pageLayers = isPageActive ? sortedLayers : (page.layers || []);

                return (
                  <div key={page.id} className="space-y-3">
                    <div className="flex items-center justify-between px-1 bg-white/5 py-2 px-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isPageActive ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-white/20'}`}>
                          <Layers size={12} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isPageActive ? 'text-white' : 'text-white/40'}`}>
                          {page.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isPageActive && (
                          <button 
                            onClick={() => editor.switchPage(pIdx)}
                            className="text-[9px] font-bold text-cyan-400/60 hover:text-cyan-400 uppercase tracking-wider"
                          >
                            Switch
                          </button>
                        )}
                        {editor.pages.length > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.deletePage(pIdx);
                            }}
                            className="text-rose-400/40 hover:text-rose-400 transition-colors"
                            title="Delete Page"
                          >
                            <Trash2Icon size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 border-l border-white/5 ml-0.5 pl-4">
                      {pageLayers.length === 0 && (
                        <div className='text-[10px] text-white/20 italic py-2'>Empty canvas</div>
                      )}
                      
                      {pageLayers.slice().sort((a: any, b: any) => b.order - a.order).map((layer: any) => (
                        <div
                          key={layer.id}
                          onClick={() => {
                            if (!isPageActive) {
                              editor.switchPage(pIdx);
                            }
                            editor.selectingItem(layer.id);
                          }}
                          className={`relative rounded-xl border p-2.5 transition-all duration-300 ${editor.selectedIds.includes(layer.id) && isPageActive ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04]'}`}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                              <div className='truncate text-[12px] font-bold text-white/80'>{layer.id}</div>
                              <div className='mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-white/20'>{layer.type}</div>
                            </div>

                            {isPageActive && (
                              <div className='flex items-center gap-1 shrink-0'>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editor.showHideLayer(layer.id);
                                  }}
                                  className={`p-1 rounded-md transition-all ${layer.hideLayer ? 'text-rose-400' : 'text-white/20 hover:text-white'}`}
                                >
                                  {layer.hideLayer ? <EyeOff size={12} /> : <EyeIcon size={12} />}
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === layer.id ? null : layer.id);
                                    }}
                                    className={`p-1 rounded-md transition-all ${openMenuId === layer.id ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/20 hover:text-white'}`}
                                  >
                                    <MoreVertical size={12} />
                                  </button>

                                  {openMenuId === layer.id && (
                                    <div className="absolute right-0 top-full z-[60] mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1b2b] p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                      <MenuAction 
                                        icon={Copy} 
                                        label="Duplicate Layer" 
                                        onClick={() => {
                                          editor.copyLayer(layer.id);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <MenuAction 
                                        icon={Scissors} 
                                        label="Masking Studio" 
                                        onClick={() => {
                                          editor.selectingItem(layer.id);
                                          editor.setMaskStudioOpen(true);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <MenuAction 
                                        icon={Layers} 
                                        label="Copy to Page" 
                                        onClick={() => {
                                          setCopyToPageLayerId(layer.id);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <MenuAction 
                                        icon={Crop} 
                                        label="Crop Selection" 
                                        onClick={() => {
                                          editor.selectingItem(layer.id);
                                          editor.setAiEdit(true);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <MenuAction 
                                        icon={layer.layerlock ? LockKeyholeOpen : LockKeyhole} 
                                        label={layer.layerlock ? "Unlock Layer" : "Lock Layer"} 
                                        onClick={() => {
                                          editor.lockLayer(layer.id);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <MenuAction 
                                        icon={PlusSquare} 
                                        label="Save as Asset" 
                                        onClick={() => {
                                          editor.setAssetSaveLayerId(layer.id);
                                          editor.setAssetSaveOpen(true);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                      <div className="my-1 h-px bg-white/5" />
                                      <MenuAction 
                                        icon={Trash2Icon} 
                                        label="Delete Layer" 
                                        danger 
                                        onClick={() => {
                                          editor.deleteLayer(layer.id);
                                          setOpenMenuId(null);
                                        }} 
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>
      </div>
      {/* Asset Save Permission Dialog */}
      {editor.assetSaveOpen && createPortal(
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='w-full max-w-sm rounded-[40px] border border-white/10 bg-[#0a1728] p-8 shadow-2xl scale-in-center animate-in zoom-in-95 duration-300'>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-6 rounded-3xl bg-cyan-400/15 p-5 text-cyan-400 shadow-lg shadow-cyan-400/10'>
                <PlusSquare size={32} />
              </div>
              <h2 className='text-2xl font-black text-white'>Save to Assets</h2>
              <p className='mt-2 text-xs font-bold uppercase tracking-widest text-white/30'>Choose storage location</p>
              
              <div className='mt-8 w-full space-y-4'>
                <div 
                  onClick={() => editor.confirmSaveAsset(false)}
                  className='group cursor-pointer rounded-3xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.08] hover:border-white/10'
                >
                  <div className='flex items-center gap-4'>
                    <div className='rounded-2xl bg-white/5 p-3 text-white/60 group-hover:text-white transition-colors'>
                      <LockKeyhole size={20} />
                    </div>
                    <div className='text-left'>
                      <div className='text-sm font-bold text-white'>Save Locally</div>
                      <div className='text-[10px] text-white/40'>Private, stored in your browser</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => editor.confirmSaveAsset(true)}
                  className='group cursor-pointer rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 transition-all hover:bg-cyan-400/10 hover:border-cyan-400/30'
                >
                  <div className='flex items-center gap-4'>
                    <div className='rounded-2xl bg-cyan-400/20 p-3 text-cyan-400'>
                      <UploadCloud size={20} />
                    </div>
                    <div className='text-left'>
                      <div className='text-sm font-bold text-white'>Upload to Cloud</div>
                      <div className='text-[10px] text-cyan-400/60'>Public, available across sessions</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  editor.setAssetSaveOpen(false);
                  editor.setAssetSaveLayerId(null);
                }}
                className='mt-8 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all'
              >
                Cancel Process
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Copy to Page Modal */}
      {copyToPageLayerId && createPortal(
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300'>
          <div className='w-full max-w-sm rounded-[40px] border border-white/10 bg-[#0a1728] p-8 shadow-2xl scale-in-center animate-in zoom-in-95 duration-300'>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-6 rounded-3xl bg-cyan-400/15 p-5 text-cyan-400 shadow-lg shadow-cyan-400/10'>
                <Copy size={32} />
              </div>
              <h2 className='text-2xl font-black text-white'>Copy to Page</h2>
              <p className='mt-2 text-xs font-bold uppercase tracking-widest text-white/30'>Select destination canvas</p>
              
              <div className='mt-8 w-full max-h-[40vh] overflow-y-auto custom-scrollbar space-y-3 pr-2'>
                {editor.pages.map((page: any, idx: number) => (
                  <button 
                    key={page.id}
                    onClick={() => {
                      editor.copyLayerToPage(copyToPageLayerId, idx);
                      setCopyToPageLayerId(null);
                    }}
                    className={`w-full group flex items-center justify-between rounded-2xl border p-4 transition-all ${editor.activePageIndex === idx ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-400/30'}`}
                    disabled={editor.activePageIndex === idx}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-white/40 group-hover:text-cyan-400 transition-colors'>
                        {idx + 1}
                      </div>
                      <span className='text-sm font-bold text-white group-hover:text-cyan-400 transition-colors'>{page.name}</span>
                    </div>
                    {editor.activePageIndex === idx && <span className='text-[8px] font-black uppercase text-white/20'>(Current)</span>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCopyToPageLayerId(null)}
                className='mt-8 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
