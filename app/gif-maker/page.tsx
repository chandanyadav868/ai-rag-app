"use client";

import React, { useEffect } from 'react';
import { EditorTopBar } from './_components/EditorTopBar';
import { EditorCanvasWorkspace } from './_components/EditorCanvasWorkspace';
import { EditorLayerPanel } from './_components/EditorLayerPanel';
import { EditorToolsPanel } from './_components/EditorToolsPanel';
import { useGifEditor } from './_hooks/useGifEditor';
import { GifPreviewModal } from './_components/GifPreviewModal';
import { toast } from 'sonner';

import { createPortal } from 'react-dom';
import EditTool from '@/components/EditTool';
import { MaskStudio } from './_components/MaskStudio';

function ProGifMaker() {
  const editor = useGifEditor();

  // Seamless Creative Pipeline: Import design handed off from /image-editing or /video-to-gif
  useEffect(() => {
    try {
      // 1. Single design frame from Image Editing
      const importedFrame = sessionStorage.getItem('polish_ai_imported_gif_frame');
      if (importedFrame) {
        sessionStorage.removeItem('polish_ai_imported_gif_frame');
        setTimeout(() => {
          editor.insertImageFromUrl(importedFrame);
          setTimeout(() => {
            editor.addFrame();
            toast.success("Imported design from Studio as Frame #1!");
          }, 400);
        }, 300);
      }

      // 2. Video frames from Video to GIF Converter
      const importedVideoData = sessionStorage.getItem('polish_ai_imported_video_frames');
      if (importedVideoData) {
        sessionStorage.removeItem('polish_ai_imported_video_frames');
        const parsed = JSON.parse(importedVideoData);
        if (parsed.frames && Array.isArray(parsed.frames) && parsed.frames.length > 0) {
          setTimeout(() => {
            editor.setFrames(parsed.frames);
            if (parsed.frameDelay) editor.setFrameDelay(parsed.frameDelay);
            if (parsed.width && parsed.height) {
              editor.updateCanvasDimensions(parsed.width, parsed.height);
            }
            editor.setActiveFrameIndex(0);
            editor.setStageMode('frame');
            toast.success(`Imported ${parsed.frames.length} frames from Video to GIF Converter!`);
          }, 350);
        }
      }
    } catch (e) {
      console.error("Failed to load imported frame:", e);
    }
  }, [editor.insertImageFromUrl, editor.addFrame, editor.setFrames, editor.setFrameDelay, editor.updateCanvasDimensions, editor.setActiveFrameIndex, editor.setStageMode]);
  
  return (
    <div id="gifMakerContainer" className="flex flex-col h-screen w-screen overflow-hidden bg-[#07111f] text-white select-none">
      {/* Sleek Dedicated Studio Top Navigation Bar */}
      <EditorTopBar editor={editor} />

      {/* Main Studio Viewport Area */}
      <main className="relative flex flex-1 h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        {/* Left Tools & Presets Dock */}
        <EditorToolsPanel editor={editor} />

        {/* Central Fluid 2D Interactive Viewport with Timeline */}
        <EditorCanvasWorkspace editor={editor} />

        {/* Right Inspector & Animation Deck */}
        <EditorLayerPanel editor={editor} />
      </main>

      {/* AI Inpainting / Generative Edit Studio Modal */}
      {editor.aiEdit && createPortal(
        <EditTool
          aiImageFn={editor.aiImageFn}
          fabricjs={editor.fabricJs}
          selectedId={editor.activeId}
          aiEditShowFn={editor.setAiEdit}
        />,
        document.getElementById("gifMakerContainer") || document.body
      )}

      {/* Tight Precision Mask Studio */}
      <MaskStudio
        isOpen={editor.maskStudioOpen}
        onClose={() => editor.setMaskStudioOpen(false)}
        selectedId={editor.activeId}
        mainFabricCanvas={editor.fabricJs}
        onApply={(url, opts) => editor.applyMask(url, opts)}
        assets={editor.assets}
      />

      {/* Real-time Animated GIF Preview Modal */}
      <GifPreviewModal
        isOpen={editor.isPlaying}
        onClose={() => editor.setIsPlaying(false)}
        frames={editor.frames}
        previewIdx={editor.previewIdx}
        isPlaying={editor.isPlaying}
        setIsPlaying={editor.setIsPlaying}
      />
    </div>
  );
}

export default ProGifMaker;
