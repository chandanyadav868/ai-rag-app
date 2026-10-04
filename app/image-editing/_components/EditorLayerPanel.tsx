"use client";

import ToolBox from '@/components/ToolBox';
import { 
  CheckCircleIcon, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Crop, 
  Edit2, 
  EyeIcon, 
  EyeOff, 
  FolderArchive, 
  Image as ImageIcon, 
  Layers, 
  Library, 
  Loader2Icon, 
  LockKeyhole, 
  LockKeyholeOpen, 
  MoreVertical, 
  PenTool, 
  Plus, 
  PlusSquare, 
  Scissors, 
  Sliders, 
  Sparkles, 
  Square, 
  Trash2, 
  Trash2Icon, 
  Type, 
  UploadCloud, 
  X 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AssetLibrary } from './AssetLibrary';
import { AIFeatures } from './AIFeatures';

interface EditorLayerPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

export function EditorLayerPanel({ editor }: EditorLayerPanelProps) {
  const sortedLayers = editor.state.slice().sort((a, b) => b.order - a.order);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copyToPageLayerId, setCopyToPageLayerId] = useState<string | null>(null);

  // Close floating menus when selection changes
  useEffect(() => {
    setActiveCategory(null);
    setOpenMenuId(null);
  }, [editor.activeId, editor.layerMenu]);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type size={14} className="text-violet-400" />;
      case 'image':
        return <ImageIcon size={14} className="text-emerald-400" />;
      case 'shape':
        return <Square size={14} className="text-amber-400" />;
      case 'draw':
        return <PenTool size={14} className="text-cyan-400" />;
      default:
        return <Layers size={14} className="text-white/60" />;
    }
  };

  return (
    <aside 
      onWheel={(e) => e.stopPropagation()}
      className={`fixed right-0 top-14 bottom-0 z-30 flex w-full md:w-80 flex-col border-l border-white/[0.08] bg-[#0c1017]/95 shadow-2xl backdrop-blur-2xl overscroll-contain transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
      editor.rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Top Header & Navigation Tabs */}
      <div className="border-b border-white/[0.08] p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white">Inspector</span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-white/50">
              {editor.state.length} Layers
            </span>
          </div>

          <button
            onClick={() => editor.setRightPanelOpen(false)}
            className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white transition"
            title="Close Panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]">
          {[
            { id: "Layer", label: "Layers" },
            { id: "Property", label: "Styles" },
            { id: "AI Features", label: "AI" },
            { id: "Assets", label: "Assets" },
          ].map((tab) => {
            const isActive = editor.layerMenu === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => editor.setLayerMenu(tab.id as any)}
                className={`rounded-lg py-1.5 text-center text-[10px] font-bold transition ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div 
        onWheel={(e) => e.stopPropagation()}
        className="custom-scrollbar flex-1 overflow-y-auto p-3 min-h-0 overscroll-contain"
      >
        {editor.layerMenu === "Property" ? (
          <div className="flex-1 flex flex-col min-h-0">
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
          /* LAYERS TAB */
          <div className="space-y-4">
            {editor.pages.map((page: any, pIdx: number) => {
              const isPageActive = editor.activePageIndex === pIdx;
              const pageLayers = isPageActive ? sortedLayers : (page.layers || []);

              return (
                <div key={page.id} className="space-y-2">
                  {/* Page Banner Header */}
                  <div className={`flex items-center justify-between rounded-xl px-3 py-2 border transition ${
                    isPageActive 
                      ? 'border-violet-500/30 bg-violet-600/10' 
                      : 'border-white/[0.04] bg-white/[0.02]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${isPageActive ? 'bg-violet-400 ring-2 ring-violet-400/30' : 'bg-white/20'}`} />
                      <span className={`text-[11px] font-bold ${isPageActive ? 'text-white' : 'text-white/40'}`}>
                        {page.name || `Page ${pIdx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPageActive ? (
                        <button
                          onClick={() => editor.switchPage(pIdx)}
                          className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition uppercase tracking-wider"
                        >
                          Switch
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-violet-300/60 uppercase tracking-widest">
                          Active
                        </span>
                      )}

                      {editor.pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editor.deletePage(pIdx);
                          }}
                          className="text-white/20 hover:text-rose-400 transition"
                          title="Delete Page"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layers List for Page */}
                  <div className="space-y-1.5 pl-1.5 border-l border-white/[0.06] ml-2">
                    {pageLayers.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-center">
                        <div className="text-[11px] font-medium text-white/30">Canvas is empty</div>
                        {isPageActive && (
                          <div className="mt-2 flex justify-center gap-2">
                            <button
                              onClick={() => editor.addTextLayer()}
                              className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white"
                            >
                              + Text
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      pageLayers.slice().sort((a: any, b: any) => b.order - a.order).map((layer: any) => {
                        const isSelected = isPageActive && editor.selectedIds.includes(layer.id);
                        return (
                          <div
                            key={layer.id}
                            onClick={() => {
                              if (!isPageActive) editor.switchPage(pIdx);
                              editor.selectingItem(layer.id);
                            }}
                            className={`group relative flex items-center justify-between rounded-xl border p-2 transition cursor-pointer ${
                              isSelected
                                ? 'border-violet-500 bg-violet-600/15 shadow-sm shadow-violet-600/20'
                                : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/30 border border-white/[0.06]">
                                {getLayerIcon(layer.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`truncate text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                  {layer.id.replace(/_/g, ' ')}
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                                  {layer.type} • {layer.width}×{layer.height}
                                </div>
                              </div>
                            </div>

                            {/* Layer Action Icons */}
                            {isPageActive && (
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editor.showHideLayer(layer.id);
                                  }}
                                  className={`rounded-md p-1 transition ${
                                    layer.hideLayer ? 'text-rose-400 bg-rose-500/10' : 'text-white/30 hover:text-white'
                                  }`}
                                  title={layer.hideLayer ? "Show Layer" : "Hide Layer"}
                                >
                                  {layer.hideLayer ? <EyeOff size={13} /> : <EyeIcon size={13} />}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editor.lockLayer(layer.id);
                                  }}
                                  className={`rounded-md p-1 transition ${
                                    layer.layerlock ? 'text-amber-400 bg-amber-500/10' : 'text-white/30 hover:text-white'
                                  }`}
                                  title={layer.layerlock ? "Unlock Layer" : "Lock Layer"}
                                >
                                  {layer.layerlock ? <LockKeyhole size={13} /> : <LockKeyholeOpen size={13} />}
                                </button>

                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === layer.id ? null : layer.id);
                                    }}
                                    className={`rounded-md p-1 transition ${
                                      openMenuId === layer.id ? 'text-violet-400 bg-violet-500/20' : 'text-white/30 hover:text-white'
                                    }`}
                                  >
                                    <MoreVertical size={13} />
                                  </button>

                                  {/* Context Menu */}
                                  {openMenuId === layer.id && (
                                    <div 
                                      onMouseLeave={() => setOpenMenuId(null)}
                                      className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/10 bg-[#121824] p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editor.copyLayer(layer.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                                      >
                                        <Copy size={13} />
                                        <span>Duplicate</span>
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editor.selectingItem(layer.id);
                                          editor.setAiEdit(true);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                                      >
                                        <Crop size={13} />
                                        <span>Crop Studio</span>
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editor.selectingItem(layer.id);
                                          editor.setMaskStudioOpen(true);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                                      >
                                        <Scissors size={13} />
                                        <span>Mask Studio</span>
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCopyToPageLayerId(layer.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                                      >
                                        <Layers size={13} />
                                        <span>Copy to Page...</span>
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editor.saveLayerAsAsset(layer.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                                      >
                                        <FolderArchive size={13} />
                                        <span>Save to Assets</span>
                                      </button>

                                      <div className="h-px bg-white/[0.08] my-1" />

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editor.deleteLayer(layer.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                                      >
                                        <Trash2 size={13} />
                                        <span>Delete Layer</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Copy to Page Modal */}
      {copyToPageLayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d121d] p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-2">Copy Layer to Page</h4>
            <div className="space-y-1.5 mb-4">
              {editor.pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    editor.copyLayerToPage(copyToPageLayerId, idx);
                    setCopyToPageLayerId(null);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-xs font-semibold text-white/80 hover:bg-violet-600 hover:text-white transition"
                >
                  <span>{p.name || `Page ${idx + 1}`}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setCopyToPageLayerId(null)}
              className="w-full rounded-xl border border-white/10 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
