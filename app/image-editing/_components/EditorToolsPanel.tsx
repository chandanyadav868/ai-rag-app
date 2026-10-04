"use client";

import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Crop, 
  Download, 
  Eraser, 
  FolderArchive, 
  HelpCircle, 
  Image as ImageIcon, 
  ImageUpIcon, 
  Layers, 
  Maximize2, 
  MousePointer2, 
  PenTool, 
  Plus, 
  Scissors, 
  ShapesIcon, 
  Sliders, 
  Sparkles, 
  Square, 
  SquarePen, 
  Trash2, 
  Triangle, 
  Type, 
  UploadCloud, 
  Wand2, 
  X,
  Flame,
  ArrowUpRight,
  BadgeCheck
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { InsertImageModal } from './InsertImageModal';
import { EditorToolsPanelDrawer } from './EditorToolsPanelDrawer';

interface EditorToolsPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
  exportDialogOpen?: boolean;
  setExportDialogOpen?: (open: boolean) => void;
  resizeDrawerOpen?: boolean;
  setResizeDrawerOpen?: (open: boolean) => void;
}

type DrawerType = 'text' | 'shapes' | 'draw' | 'images' | 'ai' | 'resize' | 'thumbnail' | null;
type ExportFormatOption = "png" | "jpeg" | "webp";

interface ExportFormState {
  format: ExportFormatOption;
  quality: number;
  multiplier: number;
  filename: string;
  enableRetinaScaling: boolean;
}

export function EditorToolsPanel({ 
  editor, 
  exportDialogOpen: externalExportOpen, 
  setExportDialogOpen: setExternalExportOpen,
  resizeDrawerOpen,
  setResizeDrawerOpen
}: EditorToolsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [localExportOpen, setLocalExportOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const isExportOpen = externalExportOpen !== undefined ? externalExportOpen : localExportOpen;
  const setExportOpen = setExternalExportOpen || setLocalExportOpen;

  const [exportForm, setExportForm] = useState<ExportFormState>({
    format: "png",
    quality: 1,
    multiplier: 1,
    filename: "canvas-export",
    enableRetinaScaling: true,
  });

  const qualitySupported = exportForm.format === "jpeg" || exportForm.format === "webp";

  // Respond to resize trigger from TopBar
  useEffect(() => {
    if (resizeDrawerOpen) {
      setActiveDrawer('resize');
      setResizeDrawerOpen?.(false);
    }
  }, [resizeDrawerOpen, setResizeDrawerOpen]);

  // Synchronize active tool with drawer
  const handleToolClick = (drawer: DrawerType) => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
      return;
    }
    setActiveDrawer(drawer);
  };

  return (
    <>
      {/* Tool Rail (Width: 64px) & Slide-out Drawer (Desktop md+) */}
      <aside className={`hidden md:flex fixed left-0 top-14 bottom-0 z-30 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        editor.leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sleek Tool Icon Rail */}
        <div className="flex h-full w-16 flex-col items-center justify-between border-r border-white/[0.08] bg-[#0c1017]/95 py-3 backdrop-blur-xl">
          <div className="flex w-full flex-col items-center gap-1.5 px-2">
            {/* Select Tool */}
            <button
              onClick={() => {
                editor.resetToSelectMode();
                setActiveDrawer(null);
              }}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                editor.activeTool === "select" && !activeDrawer
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Select / Move (V)"
            >
              <MousePointer2 size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Select</span>
            </button>

            {/* Text Tool */}
            <button
              onClick={() => handleToolClick('text')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'text' || editor.activeTool === "text"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Add Text (T)"
            >
              <Type size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Text</span>
            </button>

            {/* Shapes Tool */}
            <button
              onClick={() => handleToolClick('shapes')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'shapes' || ["rectangle", "circle", "triangle", "polyline"].includes(editor.activeTool)
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Shapes & Lines"
            >
              <ShapesIcon size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Shapes</span>
            </button>

            {/* Free Draw Tool */}
            <button
              onClick={() => {
                handleToolClick('draw');
                if (editor.activeTool !== "freeDrawing") {
                  editor.onShapeClick("freeDrawing");
                }
              }}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'draw' || editor.activeTool === "freeDrawing"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Brush & Drawing"
            >
              <PenTool size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Draw</span>
            </button>

            {/* Images & Uploads */}
            <button
              onClick={() => handleToolClick('images')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'images' || editor.activeTool === "image"
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Upload & Images"
            >
              <ImageUpIcon size={17} />
              <span className="mt-0.5 text-[9px] font-bold">Images</span>
            </button>

            {/* AI Studio */}
            <button
              onClick={() => handleToolClick('ai')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'ai'
                  ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="AI Magic Tools"
            >
              <Sparkles size={17} className="text-amber-300" />
              <span className="mt-0.5 text-[9px] font-bold">AI</span>
            </button>

            {/* YouTube Thumbnails Tool */}
            <button
              onClick={() => handleToolClick('thumbnail')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'thumbnail'
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-600/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="YouTube Thumbnail Superpowers"
            >
              <Flame size={17} className="text-amber-400 shrink-0" />
              <span className="mt-0.5 text-[8px] font-black uppercase tracking-tighter text-center leading-none max-w-[42px] truncate">YT Studio</span>
            </button>
          </div>

          {/* Bottom Settings in Rail */}
          <div className="flex flex-col items-center gap-1.5 px-2">
            <button
              onClick={() => handleToolClick('resize')}
              className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${
                activeDrawer === 'resize'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
              }`}
              title="Canvas Dimensions"
            >
              <Sliders size={16} />
              <span className="mt-0.5 text-[9px] font-bold">Canvas</span>
            </button>
          </div>
        </div>

        {/* Contextual Secondary Drawer */}
        {activeDrawer && (
          <div className="h-full w-72 border-r border-white/[0.08] bg-[#0f141f]/95 p-4 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {activeDrawer === 'text' && 'Typography'}
                  {activeDrawer === 'shapes' && 'Shapes & Lines'}
                  {activeDrawer === 'draw' && 'Drawing & Brushes'}
                  {activeDrawer === 'images' && 'Add Images'}
                  {activeDrawer === 'ai' && 'AI Magic Studio'}
                  {activeDrawer === 'thumbnail' && 'YouTube Thumbnail Studio'}
                  {activeDrawer === 'resize' && 'Canvas Dimensions'}
                </span>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white transition"
                >
                  <X size={15} />
                </button>
              </div>

              <EditorToolsPanelDrawer
                activeDrawer={activeDrawer}
                editor={editor}
                fileInputRef={fileInputRef}
                setImageModalOpen={setImageModalOpen}
              />
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {activeDrawer && (
        <div
          onClick={() => setActiveDrawer(null)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile Bottom Sheet Drawer */}
      {activeDrawer && (
        <div className="md:hidden fixed inset-x-0 bottom-14 z-50 rounded-t-3xl border-t border-white/10 bg-[#0c1017]/98 p-4 shadow-2xl backdrop-blur-2xl max-h-[72vh] flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-3 shrink-0" />
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3 shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {activeDrawer === 'text' && 'Typography'}
              {activeDrawer === 'shapes' && 'Shapes & Lines'}
              {activeDrawer === 'draw' && 'Drawing & Brushes'}
              {activeDrawer === 'images' && 'Add Images'}
              {activeDrawer === 'ai' && 'AI Magic Studio'}
              {activeDrawer === 'thumbnail' && 'YouTube Thumbnail Studio'}
              {activeDrawer === 'resize' && 'Canvas Dimensions'}
            </span>
            <button
              onClick={() => setActiveDrawer(null)}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            <EditorToolsPanelDrawer
              activeDrawer={activeDrawer}
              editor={editor}
              fileInputRef={fileInputRef}
              setImageModalOpen={setImageModalOpen}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#0c1017]/95 px-1 py-1.5 backdrop-blur-2xl pb-safe shadow-2xl">
        <button
          onClick={() => {
            editor.resetToSelectMode();
            setActiveDrawer(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            editor.activeTool === "select" && !activeDrawer
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <MousePointer2 size={16} />
          <span className="text-[9px] mt-0.5">Select</span>
        </button>

        <button
          onClick={() => handleToolClick('text')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'text'
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Type size={16} />
          <span className="text-[9px] mt-0.5">Text</span>
        </button>

        <button
          onClick={() => handleToolClick('shapes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'shapes'
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <ShapesIcon size={16} />
          <span className="text-[9px] mt-0.5">Shapes</span>
        </button>

        <button
          onClick={() => handleToolClick('draw')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'draw'
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <PenTool size={16} />
          <span className="text-[9px] mt-0.5">Draw</span>
        </button>

        <button
          onClick={() => handleToolClick('images')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'images'
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <ImageIcon size={16} />
          <span className="text-[9px] mt-0.5">Images</span>
        </button>

        <button
          onClick={() => handleToolClick('thumbnail')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'thumbnail'
              ? 'text-amber-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Flame size={16} className="text-amber-400" />
          <span className="text-[9px] mt-0.5">YT Studio</span>
        </button>

        <button
          onClick={() => handleToolClick('resize')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeDrawer === 'resize'
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Sliders size={16} />
          <span className="text-[9px] mt-0.5">Size</span>
        </button>

        <button
          onClick={() => editor.setRightPanelOpen(!editor.rightPanelOpen)}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            editor.rightPanelOpen
              ? 'text-violet-400 font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Layers size={16} />
          <span className="text-[9px] mt-0.5">Layers</span>
          {editor.state.length > 0 && (
            <span className="absolute top-0 right-1 h-3.5 w-3.5 rounded-full bg-violet-600 text-[8px] font-bold text-white flex items-center justify-center">
              {editor.state.length}
            </span>
          )}
        </button>
      </nav>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            editor.fileInserting(e.target.files);
          }
        }}
      />

      {/* Export Dialog Portal */}
      {isExportOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0d121d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Export Canvas</h3>
                <p className="text-xs text-white/50">Download high-resolution image</p>
              </div>
              <button
                onClick={() => setExportOpen(false)}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70">Filename</label>
                <input
                  type="text"
                  value={exportForm.filename}
                  onChange={(e) => setExportForm((prev) => ({ ...prev, filename: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as ExportFormatOption[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportForm((prev) => ({ ...prev, format: fmt }))}
                    className={`rounded-xl py-2 text-xs font-bold uppercase transition ${
                      exportForm.format === fmt
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'border border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {qualitySupported && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/70 mb-1">
                    <span>Quality</span>
                    <span className="text-violet-400">{Math.round(exportForm.quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={exportForm.quality}
                    onChange={(e) => setExportForm((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs font-semibold text-white/70 mb-1">
                  <span>Resolution Scale</span>
                  <span className="text-violet-400">{exportForm.multiplier}x</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setExportForm((prev) => ({ ...prev, multiplier: scale }))}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                        exportForm.multiplier === scale
                          ? 'border border-violet-500 bg-violet-600/20 text-violet-300'
                          : 'border border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setExportOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    editor.exportCanvas(exportForm);
                    setExportOpen(false);
                    toast.success("Canvas exported successfully!");
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:brightness-110 transition"
                >
                  Download Image
                </button>
              </div>

              <button
                onClick={() => {
                  editor.bulkExportAsZip();
                  setExportOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 py-2.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 transition"
              >
                <FolderArchive size={14} />
                <span>Export All Layers (ZIP Archive)</span>
              </button>

              <button
                onClick={() => {
                  try {
                    const dataUrl = editor.fabricJs.current?.toDataURL({ format: 'png', multiplier: 1 });
                    if (dataUrl) {
                      sessionStorage.setItem('polish_ai_imported_gif_frame', dataUrl);
                      setExportOpen(false);
                      toast.success("Design transferred! Opening GIF Maker...");
                      window.location.href = '/gif-maker';
                    }
                  } catch (e) {
                    toast.error("Failed to transfer to GIF Maker");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition active:scale-98"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>Animate Design in GIF Maker</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Insert Image Modal */}
      {imageModalOpen && createPortal(
        <InsertImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onUrlInsert={editor.insertImageFromUrl}
          onFileUpload={() => fileInputRef.current?.click()}
        />,
        document.body
      )}
    </>
  );
}
