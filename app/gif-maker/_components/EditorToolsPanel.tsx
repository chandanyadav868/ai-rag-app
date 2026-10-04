"use client";

import { PromptComponencts } from '@/components/PromptComponencts';
import { aspectRatioImage } from '@/constant';
import { ChevronLeft, ChevronRight, Download, Eraser, Home, ImageUpIcon, MousePointer2, PenTool, Redo2, Save, Scissors, ShapesIcon, Sparkles, SquarePen, Type, Undo2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { InfoActionButton } from './InfoActionButton';
import { InsertImageModal } from './InsertImageModal';

const HINDI_TYPOGRAPHY_PRESETS = [
  {
    name: "Hindi Breaking News",
    category: "News Ribbon",
    text: "सनसनीखेज खुलासा 🚨",
    fontFamily: "Mukta",
    fontWeight: "900",
    fontSize: 34,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 5,
    paintFirst: "stroke",
    backgroundColor: "#dc2626",
    shadowColor: "rgba(0,0,0,0.85)",
    shadowBlur: 14,
    shadowOffsetX: 3,
    shadowOffsetY: 4,
    desc: "Red Ribbon Banner + Heavy Stroke",
  },
  {
    name: "Yellow Shock Hook",
    category: "High CTR",
    text: "सच्चाई क्या है?!",
    fontFamily: "Anton",
    fontWeight: "bold",
    fontSize: 38,
    fill: "#ffe600",
    stroke: "#000000",
    strokeWidth: 6,
    paintFirst: "stroke",
    backgroundColor: "",
    shadowColor: "#000000",
    shadowBlur: 16,
    shadowOffsetX: 4,
    shadowOffsetY: 6,
    desc: "High-CTR Yellow Outline Slant",
  },
  {
    name: "Tech Price Badge",
    category: "Tech",
    text: "₹99,999 📱",
    fontFamily: "Bebas Neue",
    fontWeight: "bold",
    fontSize: 36,
    fill: "#00f0ff",
    stroke: "#000000",
    strokeWidth: 5,
    paintFirst: "stroke",
    backgroundColor: "#0a0f1d",
    shadowColor: "#00f0ff",
    shadowBlur: 20,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    desc: "Electric Cyan Glow + Tech Pill",
  },
  {
    name: "Gold Luxury Title",
    category: "Royal",
    text: "MAHA EPISODE 👑",
    fontFamily: "Rozha One",
    fontWeight: "bold",
    fontSize: 32,
    fill: "#ffd700",
    stroke: "#451a03",
    strokeWidth: 4,
    paintFirst: "stroke",
    backgroundColor: "",
    shadowColor: "#b45309",
    shadowBlur: 16,
    shadowOffsetX: 3,
    shadowOffsetY: 5,
    desc: "Gold Luxury Heading",
  },
  {
    name: "Exposed Ribbon",
    category: "Investigative",
    text: "पर्दाफाश! महाघोटाला 🔥",
    fontFamily: "Yatra One",
    fontWeight: "bold",
    fontSize: 32,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 5,
    paintFirst: "stroke",
    backgroundColor: "#000000",
    shadowColor: "#dc2626",
    shadowBlur: 16,
    desc: "Black Ribbon + Crimson Glow",
  },
];

import { useGifEditor } from '../_hooks/useGifEditor';

interface EditorToolsPanelProps {
  editor: ReturnType<typeof useGifEditor>;
}

type ExportFormatOption = "png" | "jpeg" | "webp";
interface ExportFormState {
  format: ExportFormatOption;
  quality: number;
  multiplier: number;
  filename: string;
  enableRetinaScaling: boolean;
}

import { useRouter } from 'next/navigation';

export function EditorToolsPanel({ editor }: EditorToolsPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [brushMenuOpen, setBrushMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [exportForm, setExportForm] = useState<ExportFormState>({
    format: "png",
    quality: 1,
    multiplier: 1,
    filename: "canvas-export",
    enableRetinaScaling: true,
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const qualitySupported = exportForm.format === "jpeg" || exportForm.format === "webp";

  const handleSaveSubmit = () => {
    editor.saveProject(projectName || undefined);
    setSaveDialogOpen(false);
  };

  return (
    <>
      <aside className={`fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-[min(90vw,340px)] border-r border-white/10 bg-[#09182b]/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${editor.leftPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%-0px)]'}`}>
        <div className='flex h-full flex-col'>
          <div className='border-b border-white/10 px-4 py-3 md:px-5 md:py-4'>
            <div className='flex items-center justify-between'>
              <div className='text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>Tools & Assets</div>
              <div className='flex gap-2'>
                <button
                  onClick={() => router.push('/gif-home-screen')}
                  className='p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all'
                  title="Go to Home"
                >
                  <Home size={12} />
                </button>
                <button
                  onClick={() => {
                    if (editor.currentProjectId) {
                      editor.saveProject();
                      toast.success("Project updated!");
                    } else {
                      const current = editor.recentProjects.find(p => p.id === editor.currentProjectId);
                      setProjectName(current?.name || "");
                      setSaveDialogOpen(true);
                    }
                  }}
                  className='p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all'
                  title="Save Project"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={() => editor.setLeftPanelOpen(false)}
                  className='p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all'
                  title="Close Panel"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <h1 className='mt-1 text-lg font-black text-white'>Gif Maker</h1>
            <p className='mt-2 text-[10px] font-medium leading-relaxed text-white/40 uppercase tracking-tight'>
              Create and animate your workspace.
            </p>
          </div>

          <div className='historyScrollbar flex-1 space-y-4 overflow-y-auto overflow-x-visible px-4 py-4 pb-24'>

            <section className='rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
              <div className='mb-2'>
                <h2 className='text-[10px] font-black uppercase tracking-wider text-white/80'>Custom Size</h2>
              </div>
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <label className='text-[10px] uppercase tracking-wider text-white/40'>Width</label>
                  <input
                    type='number'
                    value={editor.canvasDimensions.width}
                    onChange={(e) => {
                      editor.updateCanvasDimensions(Number(e.target.value), editor.canvasDimensions.height);
                    }}
                    className='mt-1 w-full rounded-xl border border-white/10 bg-[#081221] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50'
                  />
                </div>
                <div className='flex-1'>
                  <label className='text-[10px] uppercase tracking-wider text-white/40'>Height</label>
                  <input
                    type='number'
                    value={editor.canvasDimensions.height}
                    onChange={(e) => {
                      editor.updateCanvasDimensions(editor.canvasDimensions.width, Number(e.target.value));
                    }}
                    className='mt-1 w-full rounded-xl border border-white/10 bg-[#081221] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50'
                  />
                </div>
              </div>
            </section>

            <section className='rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
              <div className='mb-3'>
                <h2 className='text-[10px] font-black uppercase tracking-wider text-white/80'>Quick Actions</h2>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <InfoActionButton
                  icon={MousePointer2}
                  label='Select'
                  description='Return to selection mode to move, resize, or edit existing layers.'
                  onClick={editor.resetToSelectMode}
                  active={editor.activeTool === "select"}
                />

                <InfoActionButton
                  icon={Type}
                  label='Add Text'
                  description='Insert an editable text layer on the canvas and make it the active selection.'
                  onClick={editor.addTextLayer}
                  active={editor.activeTool === "text"}
                />

                <div className='relative'>
                  <InfoActionButton
                    icon={ShapesIcon}
                    label='Shapes'
                    description='Open shape tools and draw rectangles, circles, or triangles directly on the canvas.'
                    onClick={() => setShapeMenuOpen((prev) => !prev)}
                    active={shapeMenuOpen || ["rectangle", "circle", "triangle"].includes(editor.activeTool)}
                  />

                  {shapeMenuOpen && (
                    <div className='absolute left-0 top-full z-20 mt-3 w-full rounded-2xl border border-white/10 bg-[#081221] p-2 shadow-2xl'>
                      {[
                        { label: "Rectangle", type: "rectangle" },
                        { label: "Circle", type: "circle" },
                        { label: "Triangle", type: "triangle" },
                      ].map((shape) => (
                        <button
                          key={shape.type}
                          type='button'
                          onClick={() => {
                            editor.onShapeClick(shape.type);
                            setShapeMenuOpen(false);
                          }}
                          className='block w-full rounded-xl px-3 py-2 text-left text-sm text-white/85 transition hover:bg-white/10'
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className='relative'>
                  <InfoActionButton
                    icon={PenTool}
                    label='Free Draw'
                    description='Draw a freehand path directly on the canvas and store it as a new editable layer.'
                    onClick={() => {
                      if (editor.activeTool === "freeDrawing") {
                        editor.resetToSelectMode();
                        setBrushMenuOpen(false);
                      } else {
                        editor.onShapeClick("freeDrawing");
                        setBrushMenuOpen(true);
                      }
                    }}
                    active={editor.activeTool === "freeDrawing"}
                  />

                  {brushMenuOpen && editor.activeTool === "freeDrawing" && (
                    <div className='absolute left-0 top-full z-20 mt-3 w-full rounded-2xl border border-white/10 bg-[#081221] p-2 shadow-2xl'>
                      {[
                        { label: "Pencil", type: "pencil" },
                        { label: "Spray", type: "spray" },
                        { label: "Pattern", type: "pattern" },
                        { label: "Eraser", type: "eraser" },
                      ].map((brush) => (
                        <button
                          key={brush.type}
                          type='button'
                          onClick={() => {
                            editor.setBrushType(brush.type as any);
                            setBrushMenuOpen(false);
                          }}
                          className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${editor.brushType === brush.type ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/85 hover:bg-white/10'}`}
                        >
                          {brush.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <InfoActionButton
                  icon={SquarePen}
                  label='Polyline'
                  description='Click multiple points to create a connected line path, then double-click to finish it.'
                  onClick={() => editor.onShapeClick("polyline")}
                  active={editor.activeTool === "polyline"}
                />

                <InfoActionButton
                  icon={ImageUpIcon}
                  label='Insert Image'
                  description='Upload a file, use a URL, or paste from clipboard to add a new layer.'
                  onClick={() => setImageModalOpen(true)}
                  active={imageModalOpen || editor.activeTool === "image"}
                  className='col-span-2'
                />

                <InfoActionButton
                  icon={Scissors}
                  label='Mask Studio'
                  description='Apply precision shape masks (Circle, Squircle, Heart, Star, Shield) to any active layer.'
                  onClick={() => editor.setMaskStudioOpen(true)}
                  active={editor.maskStudioOpen}
                />

                <InfoActionButton
                  icon={Download}
                  label='Export'
                  description='Open export settings and download the current canvas in a supported image format.'
                  onClick={() => setExportDialogOpen(true)}
                />
              </div>

              {/* Hindi & Viral Typography Presets Section */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    Hindi & High-CTR Banners
                  </span>
                </div>
                <div className="space-y-1.5">
                  {HINDI_TYPOGRAPHY_PRESETS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => editor.addTextLayer(preset)}
                      className="w-full text-left p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-cyan-400/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                          {preset.text}
                        </span>
                        <span className="text-[9px] font-bold text-white/40 group-hover:text-white/70">
                          {preset.fontFamily}
                        </span>
                      </div>
                      <div className="text-[9px] text-white/40 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                id='image-editor-upload'
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={(e) => {
                  if (e.target.files) {
                    editor.fileInserting(e.target.files);
                  }
                }}
              />
            </section>
            {/* ai connection components */}
            {/* <section className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='mb-4 flex items-start justify-between gap-3'>
                <div>
                  <h2 className='text-sm font-semibold text-white'>AI Prompt Studio</h2>
                  <p className='text-xs text-white/60'>Generate new visuals from your active canvas workflow.</p>
                </div>
                <div className='rounded-full bg-emerald-400/15 p-2 text-emerald-200'>
                  <Sparkles size={16} />
                </div>
              </div>

              <div className='rounded-2xl border border-white/10 bg-[#081221] p-2'>
                <PromptComponencts
                  canvasOrientation={editor.canvasOrientation}
                  fabricJs={editor.fabricJs}
                  imageSetting={editor.aiImageFn}
                  state={editor.state}
                />
              </div>
            </section> */}
          </div>
        </div>
      </aside>

      {exportDialogOpen && typeof document !== "undefined" && createPortal(
        <div
          className='fixed inset-0 z-[80] flex items-center justify-center bg-[#020617]/75 p-4 backdrop-blur-sm'
          onClick={() => setExportDialogOpen(false)}
        >
          <div
            className='w-full max-w-md rounded-[28px] border border-white/10 bg-[#081221] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70'>Export</div>
                <h3 className='mt-2 text-2xl font-black text-white'>Download Settings</h3>
                <p className='mt-2 text-sm leading-6 text-white/65'>
                  Choose a common Fabric-supported format and adjust quality or scale before exporting.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setExportDialogOpen(false)}
                className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10'
                aria-label='Close export dialog'
              >
                <X size={16} />
              </button>
            </div>

            <div className='mt-6 space-y-4'>
              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-white/85'>Filename</span>
                <input
                  type='text'
                  value={exportForm.filename}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, filename: event.target.value }))}
                  className='w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60'
                  placeholder='canvas-export'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-white/85'>Format</span>
                <select
                  value={exportForm.format}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, format: event.target.value as ExportFormatOption }))}
                  className='w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60'
                >
                  <option value='png' className='bg-slate-900 text-white'>PNG</option>
                  <option value='jpeg' className='bg-slate-900 text-white'>JPEG</option>
                  <option value='webp' className='bg-slate-900 text-white'>WEBP</option>
                </select>
              </label>

              <label className='block'>
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <span className='text-sm font-semibold text-white/85'>Quality</span>
                  <span className='rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100'>
                    {exportForm.quality.toFixed(2)}
                  </span>
                </div>
                <input
                  type='range'
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={exportForm.quality}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, quality: Number(event.target.value) }))}
                  className='editorRange disabled:cursor-not-allowed disabled:opacity-40'
                  disabled={!qualitySupported}
                  style={{ "--range-percent": `${((exportForm.quality - 0.1) / 0.9) * 100}%` } as React.CSSProperties}
                />
                <div className='mt-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/35'>
                  <span>0.10</span>
                  <span>{qualitySupported ? '1.00' : 'PNG ignores quality'}</span>
                </div>
              </label>

              <label className='block'>
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <span className='text-sm font-semibold text-white/85'>Scale</span>
                  <span className='rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100'>
                    {exportForm.multiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type='range'
                  min={1}
                  max={4}
                  step={0.5}
                  value={exportForm.multiplier}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, multiplier: Number(event.target.value) }))}
                  className='editorRange'
                  style={{ "--range-percent": `${((exportForm.multiplier - 1) / 3) * 100}%` } as React.CSSProperties}
                />
                <div className='mt-2 flex justify-between text-[11px] uppercase tracking-[0.18em] text-white/35'>
                  <span>1x</span>
                  <span>4x</span>
                </div>
              </label>

              <label className='flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3'>
                <div>
                  <div className='text-sm font-semibold text-white/85'>Retina Scaling</div>
                  <div className='text-xs text-white/55'>Keeps export sharper on high-density screens.</div>
                </div>
                <input
                  type='checkbox'
                  checked={exportForm.enableRetinaScaling}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, enableRetinaScaling: event.target.checked }))}
                  className='h-4 w-4 accent-cyan-300'
                />
              </label>
            </div>

            <div className='mt-6 flex gap-3'>
              <button
                type='button'
                onClick={() => setExportDialogOpen(false)}
                className='flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => {
                  editor.exportCanvas(exportForm);
                  setExportDialogOpen(false);
                }}
                className='flex-1 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/25'
              >
                Export
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {saveDialogOpen && createPortal(
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md'>
          <div className='w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#09182b]/95 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)]'>
            <div className='flex items-center justify-between mb-8'>
              <h2 className='text-2xl font-black text-white'>Save Design</h2>
              <button onClick={() => setSaveDialogOpen(false)} className='p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all'>
                <X size={20} />
              </button>
            </div>

            <div className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-xs uppercase tracking-[0.2em] text-white/40 font-bold ml-1'>Project Name</label>
                <input
                  type='text'
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className='w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500/50 transition-all text-lg font-bold text-white'
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSubmit()}
                />
              </div>

              <div className='flex gap-4 pt-4'>
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className='flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-all'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubmit}
                  className='flex-1 px-6 py-4 rounded-2xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20'
                >
                  Save Now
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {imageModalOpen && createPortal(
        <InsertImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onUrlInsert={editor.insertImageFromUrl}
          onFileUpload={() => fileInputRef.current?.click()}
        />,
        document.getElementById("imageEdittingContainer") || document.body
      )}
    </>
  );
}
