"use client";

import React, { useState } from 'react';
import EditTool from '@/components/EditTool';
import { createPortal } from 'react-dom';
import { EditorTopBar } from './_components/EditorTopBar';
import { EditorCanvasWorkspace } from './_components/EditorCanvasWorkspace';
import { EditorLayerPanel } from './_components/EditorLayerPanel';
import { EditorToolsPanel } from './_components/EditorToolsPanel';
import { useImageEditor } from './_hooks/useImageEditor';
import { MaskStudio } from './_components/MaskStudio';

function ProImageEditor() {
  const editor = useImageEditor();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [resizeDrawerOpen, setResizeDrawerOpen] = useState(false);
  
  return (
    <div id="imageEdittingContainer" className="flex h-screen flex-col overflow-hidden bg-[#090d16] text-white">
      {/* Sleek Modern Full-width Studio Top Bar */}
      <EditorTopBar 
        editor={editor} 
        onOpenExport={() => setExportDialogOpen(true)}
        onOpenResize={() => setResizeDrawerOpen(true)}
      />

      {/* Main Studio Work Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Tool Dock & Flyout Drawers */}
        <EditorToolsPanel 
          editor={editor} 
          exportDialogOpen={exportDialogOpen}
          setExportDialogOpen={setExportDialogOpen}
          resizeDrawerOpen={resizeDrawerOpen}
          setResizeDrawerOpen={setResizeDrawerOpen}
        />

        {/* Center Fluid Canvas Viewport */}
        <EditorCanvasWorkspace editor={editor} />

        {/* Right Inspector & Layer Manager */}
        <EditorLayerPanel editor={editor} />
      </div>

      {/* Crop Studio Modal */}
      {editor.aiEdit && createPortal(
        <EditTool
          aiImageFn={editor.aiImageFn}
          onReplaceLayer={(blob: Blob) => {
            const url = URL.createObjectURL(blob);
            if (editor.activeId) {
              editor.replaceLayerImage(editor.activeId, url);
            }
          }}
          fabricjs={editor.fabricJs}
          selectedId={editor.activeId}
          aiEditShowFn={editor.setAiEdit}
        />,
        document.getElementById("imageEdittingContainer") || document.body
      )}

      {/* Mask Studio Modal */}
      <MaskStudio
        isOpen={editor.maskStudioOpen}
        onClose={() => editor.setMaskStudioOpen(false)}
        selectedId={editor.activeId}
        mainFabricCanvas={editor.fabricJs}
        onApply={(url, opts) => editor.applyMask(url, opts)}
        assets={editor.assets}
      />
    </div>
  );
}

export default ProImageEditor;
