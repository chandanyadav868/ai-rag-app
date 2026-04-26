"use client";

import { PromptComponencts } from '@/components/PromptComponencts';
import { aspectRatioImage } from '@/constant';
import { ChevronLeft, ChevronRight, Download, ImageUpIcon, PenTool, ShapesIcon, Sparkles, SquarePen, Type, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InfoActionButton } from './InfoActionButton';

interface EditorToolsPanelProps {
  editor: ReturnType<typeof import('../_hooks/useImageEditor').useImageEditor>;
}

type ExportFormatOption = "png" | "jpeg" | "webp";
interface ExportFormState {
  format: ExportFormatOption;
  quality: number;
  multiplier: number;
  filename: string;
  enableRetinaScaling: boolean;
}

export function EditorToolsPanel({ editor }: EditorToolsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportForm, setExportForm] = useState<ExportFormState>({
    format: "png",
    quality: 1,
    multiplier: 1,
    filename: "canvas-export",
    enableRetinaScaling: true,
  });
  const qualitySupported = exportForm.format === "jpeg" || exportForm.format === "webp";

  return (
    <>
      <aside className={`fixed left-0 top-0 z-30 h-screen w-[min(90vw,380px)] border-r border-white/10 bg-[#09182b]/95 backdrop-blur-xl transition-transform duration-300 ${editor.leftPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%-20px)]'}`}>
        <button
          type='button'
          onClick={() => editor.setLeftPanelOpen((prev) => !prev)}
          className='absolute right-0 top-1/2 flex h-16 w-5 -translate-y-1/2 translate-x-full items-center justify-center rounded-r-2xl border border-l-0 border-white/10 bg-[#09182b] text-white shadow-xl'
          aria-label='Toggle image editor panel'
        >
          {editor.leftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className='flex h-full flex-col'>
          <div className='border-b border-white/10 px-5 py-5'>
            <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70'>Workspace</div>
            <h1 className='mt-2 text-2xl font-black text-white'>Image Editor</h1>
            <p className='mt-2 text-sm leading-6 text-white/70'>
              Create, arrange, annotate, and generate new assets from your canvas in one cleaner workspace.
            </p>
          </div>

          <div className='historyScrollbar flex-1 space-y-6 overflow-y-auto overflow-x-visible px-4 py-5 pb-24'>
            <section className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <div>
                  <h2 className='text-sm font-semibold text-white'>Canvas Ratio</h2>
                  <p className='text-xs text-white/60'>Choose the frame before exporting or generating.</p>
                </div>
                <span className='rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100'>
                  {editor.canvasOrientation}
                </span>
              </div>

              <div className='grid grid-cols-3 gap-3'>
                {aspectRatioImage.map((item) => (
                  <button
                    key={item.orientation}
                    type='button'
                    onClick={() => editor.setCanvasOrientation(item.orientation)}
                    className={`rounded-2xl border p-3 text-sm font-semibold transition ${editor.canvasOrientation === item.orientation ? 'border-cyan-300/70 bg-cyan-400/15 text-white' : 'border-white/10 bg-[#081221] text-white/80 hover:bg-white/10'}`}
                  >
                    <div
                      className='mx-auto mb-2 w-12 rounded-md border border-dashed border-white/25 bg-white/[0.03]'
                      style={{ aspectRatio: item.orientation }}
                    />
                    {item.orientation}
                  </button>
                ))}
              </div>
            </section>

            <section className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='mb-3'>
                <h2 className='text-sm font-semibold text-white'>Quick Actions</h2>
                <p className='text-xs text-white/60'>Most-used editing actions in one focused tool row.</p>
              </div>

              <div className='grid grid-cols-2 gap-3'>
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

                <InfoActionButton
                  icon={PenTool}
                  label='Free Draw'
                  description='Draw a freehand path directly on the canvas and store it as a new editable layer.'
                  onClick={() => editor.onShapeClick("freeDrawing")}
                  active={editor.activeTool === "freeDrawing"}
                />

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
                  description='Upload an image file and place it on the canvas as a new layer.'
                  onClick={() => fileInputRef.current?.click()}
                  active={editor.activeTool === "image"}
                  className='col-span-2'
                />

                <InfoActionButton
                  icon={Download}
                  label='Export'
                  description='Open export settings and download the current canvas in a supported image format.'
                  onClick={() => setExportDialogOpen(true)}
                  className='col-span-2'
                />
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
    </>
  );
}
