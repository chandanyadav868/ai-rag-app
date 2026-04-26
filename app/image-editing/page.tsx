"use client";

import EditTool from '@/components/EditTool';
import { createPortal } from 'react-dom';
import { EditorCanvasWorkspace } from './_components/EditorCanvasWorkspace';
import { EditorLayerPanel } from './_components/EditorLayerPanel';
import { EditorToolsPanel } from './_components/EditorToolsPanel';
import { useImageEditor } from './_hooks/useImageEditor';

function ProImageEditor() {
  const editor = useImageEditor();
  
  return (
    <div id='imageEdittingContainer' className='min-h-screen bg-[#07111f] text-white'>
      <main className='relative min-h-screen overflow-hidden'>
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
        document.getElementById("imageEdittingContainer") || document.body
      )}
    </div>
  )
}

export default ProImageEditor
