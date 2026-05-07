"use client";

import { EditorCanvasWorkspace } from './_components/EditorCanvasWorkspace';
import { EditorLayerPanel } from './_components/EditorLayerPanel';
import { EditorToolsPanel } from './_components/EditorToolsPanel';
import { useGifEditor } from './_hooks/useGifEditor';
import { GifPreviewModal } from './_components/GifPreviewModal';

import { createPortal } from 'react-dom';
import EditTool from '@/components/EditTool';
import { MaskStudio } from './_components/MaskStudio';

function ProGifMaker() {
  const editor = useGifEditor();
  
  return (
    <div id='gifMakerContainer' className='h-screen bg-[#07111f] text-white'>
      <main className='relative h-screen overflow-hidden'>
        <EditorToolsPanel editor={editor} />
        <EditorCanvasWorkspace editor={editor} />
        <EditorLayerPanel editor={editor} />
      </main>

      {editor.aiEdit && createPortal(
        <EditTool
          aiImageFn={editor.aiImageFn}
          fabricjs={editor.fabricJs}
          selectedId={editor.activeId}
          aiEditShowFn={editor.setAiEdit}
        />,
        document.getElementById("gifMakerContainer") || document.body
      )}

      <MaskStudio
        isOpen={editor.maskStudioOpen}
        onClose={() => editor.setMaskStudioOpen(false)}
        selectedId={editor.activeId}
        mainFabricCanvas={editor.fabricJs}
        onApply={(url, opts) => editor.applyMask(url, opts)}
        assets={editor.assets}
      />

      <GifPreviewModal
        isOpen={editor.isPlaying}
        onClose={() => editor.setIsPlaying(false)}
        frames={editor.frames}
        previewIdx={editor.previewIdx}
        isPlaying={editor.isPlaying}
        setIsPlaying={editor.setIsPlaying}
      />
    </div>
  )
}

export default ProGifMaker;
