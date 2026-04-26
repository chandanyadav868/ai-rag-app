"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Trash2, Eye, EyeOff, Play, Square, X, Type, Image as ImageIcon, Layers, Wrench, ChevronLeft, ChevronRight, Circle, Square as SquareIcon, Triangle, Palette, ChevronDown, Check, Monitor, Smartphone, LayoutGrid, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Oswald', 'Raleway', 'Poppins', 'Playfair Display', 'Comic Neue'
];

// Reusable Color Picker Component
const ColorPicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{label}</label>
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-1.5 transition-colors focus-within:border-blue-500/50 focus-within:bg-black/60">
      <div className="relative h-6 w-6 overflow-hidden rounded-lg border border-white/20 shadow-inner">
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -left-2 -top-2 h-10 w-10 cursor-pointer opacity-0"
        />
        <div className="h-full w-full" style={{ backgroundColor: value }} />
      </div>
      <span className="text-xs font-medium text-white/80">{value.toUpperCase()}</span>
    </div>
  </div>
);

// Custom Font Dropdown
const FontDropdown = ({ value, onChange, isOpen, setIsOpen }: { value: string, onChange: (val: string) => void, isOpen: boolean, setIsOpen: (val: boolean) => void }) => (
  <div className="relative flex flex-col gap-1.5">
    <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Font Family</label>
    <button 
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white transition hover:bg-black/60 focus:border-blue-500/50"
    >
      <span style={{ fontFamily: value }}>{value}</span>
      <ChevronDown size={14} className="text-white/50" />
    </button>
    
    {isOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        <div className="absolute top-full left-0 mt-1 max-h-48 w-full z-50 overflow-y-auto rounded-xl border border-white/10 bg-[#1e1e20] p-1 shadow-2xl custom-scrollbar">
          {GOOGLE_FONTS.map(font => (
            <button
              key={font}
              onClick={() => { onChange(font); setIsOpen(false); }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white/10"
            >
              <span style={{ fontFamily: font }}>{font}</span>
              {value === font && <Check size={14} className="text-blue-400" />}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
);

export default function GifMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  
  // UI States
  const [isToolsOpen, setIsToolsOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  
  // App States
  const [frames, setFrames] = useState<string[]>([]);
  const [layers, setLayers] = useState<fabric.Object[]>([]);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  // Active Object Sync States
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeRadius, setActiveRadius] = useState(0);
  const [activeFont, setActiveFont] = useState('Inter');
  const [isEditFontDropdownOpen, setIsEditFontDropdownOpen] = useState(false);

  // Tools States
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('Awesome GIF');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(40);
  const [textFont, setTextFont] = useState('Inter');
  const [isToolFontDropdownOpen, setIsToolFontDropdownOpen] = useState(false);
  const [shapeColor, setShapeColor] = useState('#3b82f6');
  
  // Canvas Size State
  const [aspectRatio, setAspectRatio] = useState('landscape'); // landscape, portrait, square
  const canvasWidth = aspectRatio === 'landscape' ? 600 : aspectRatio === 'portrait' ? 400 : 500;
  const canvasHeight = aspectRatio === 'landscape' ? 400 : aspectRatio === 'portrait' ? 600 : 500;

  // Zoom & Scale States
  const [cssScale, setCssScale] = useState(1);
  const [fabricZoom, setFabricZoom] = useState(1);

  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [draggedFrameIdx, setDraggedFrameIdx] = useState<number | null>(null);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    const fontFamilies = GOOGLE_FONTS.map(f => f.replace(' ', '+')).join('&family=');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Handle CSS Scaling for Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // We use the parent element width to determine available space, minus some padding buffer (48px)
        const parent = containerRef.current.parentElement;
        if (parent) {
          const availableWidth = parent.clientWidth - 48; 
          if (availableWidth < canvasWidth) {
            setCssScale(availableWidth / canvasWidth);
          } else {
            setCssScale(1);
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    // Set timeout to ensure DOM is fully rendered before calculating
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasWidth, isToolsOpen, isLayersOpen]); // Re-calculate when tools panels toggle or width changes

  // Initialize Fabric Canvas
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsToolsOpen(false);
      setIsLayersOpen(false);
    }

    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: '#ffffff'
    });
    
    setFabricCanvas(canvas);

    const updateLayersAndSelection = () => {
      setLayers([...canvas.getObjects()]);
      const active = canvas.getActiveObjects();
      
      if (active.length === 1) {
        const obj = active[0];
        setActiveObject(obj);
        
        // Sync properties
        if (obj.fill) setActiveColor(obj.fill as string);
        if (obj.type === 'rect') setActiveRadius((obj as fabric.Rect).rx || 0);
        if (obj.type === 'i-text') setActiveFont((obj as fabric.IText).fontFamily || 'Inter');
      } else {
        setActiveObject(null);
      }
    };

    canvas.on('object:added', updateLayersAndSelection);
    canvas.on('object:removed', updateLayersAndSelection);
    canvas.on('object:modified', updateLayersAndSelection);
    canvas.on('selection:created', updateLayersAndSelection);
    canvas.on('selection:updated', updateLayersAndSelection);
    canvas.on('selection:cleared', updateLayersAndSelection);

    // Zoom and Pan Handlers
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:wheel', function(opt) {
      const e = opt.e as WheelEvent;
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.2) zoom = 0.2;
      canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);
      setFabricZoom(zoom);
      e.preventDefault();
      e.stopPropagation();
    });

    canvas.on('mouse:down', function(opt) {
      const evt = opt.e as MouseEvent;
      if (evt.altKey === true) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on('mouse:move', function(opt) {
      if (isDragging) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
        }
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', function(opt) {
      if (canvas.viewportTransform) {
        canvas.setViewportTransform(canvas.viewportTransform);
      }
      isDragging = false;
      canvas.selection = true;
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Handle Aspect Ratio Change
  const handleAspectRatioChange = (ratio: 'landscape' | 'portrait' | 'square') => {
    setAspectRatio(ratio);
    if (!fabricCanvas) return;
    
    let w = 600; let h = 400;
    if (ratio === 'portrait') { w = 400; h = 600; }
    else if (ratio === 'square') { w = 500; h = 500; }
    
    fabricCanvas.setDimensions({ width: w, height: h });
    fabricCanvas.renderAll();
  };

  // Zoom Controls
  const handleZoomIn = () => {
    if (fabricCanvas) {
      const z = Math.min(5, fabricCanvas.getZoom() + 0.2);
      fabricCanvas.zoomToPoint(new fabric.Point(canvasWidth/2, canvasHeight/2), z);
      setFabricZoom(z);
    }
  };

  const handleZoomOut = () => {
    if (fabricCanvas) {
      const z = Math.max(0.2, fabricCanvas.getZoom() - 0.2);
      fabricCanvas.zoomToPoint(new fabric.Point(canvasWidth/2, canvasHeight/2), z);
      setFabricZoom(z);
    }
  };

  const handleZoomReset = () => {
    if (fabricCanvas) {
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setFabricZoom(1);
    }
  };

  // Handle Keyboard Deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvas) {
        const activeObj = fabricCanvas.getActiveObject();
        const isEditingText = activeObj && activeObj.type === 'i-text' && (activeObj as fabric.IText).isEditing;
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
        
        if (!isEditingText && !isInputFocused) {
          deleteSelected();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas]);

  // Preview Playback interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setPreviewIdx((prev) => (prev + 1) % frames.length);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  // Image Tools
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;
    
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data === 'string') {
        fabric.FabricImage.fromURL(data).then((img) => {
          img.scaleToWidth(200);
          fabricCanvas.add(img);
          fabricCanvas.centerObject(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  const handleAddUrl = () => {
    if (!urlInput || !fabricCanvas) return;
    
    fabric.FabricImage.fromURL(urlInput, { crossOrigin: 'anonymous' }).then((img) => {
      img.scaleToWidth(200);
      fabricCanvas.add(img);
      fabricCanvas.centerObject(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      setUrlInput('');
    }).catch(err => {
      console.error("Error loading image from URL", err);
      alert("Failed to load image from URL. Ensure the URL is valid and CORS is allowed.");
    });
  };

  // Text Tool
  const handleAddText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText(textInput, {
      left: canvasWidth / 2 - 100,
      top: canvasHeight / 2 - 20,
      fill: textColor,
      fontSize: textSize,
      fontFamily: textFont
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  // Shape Tools
  const addRectangle = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: canvasWidth / 2 - 50, 
      top: canvasHeight / 2 - 50,
      fill: shapeColor,
      width: 100, height: 100,
      rx: 0, ry: 0
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      left: canvasWidth / 2 - 50, 
      top: canvasHeight / 2 - 50,
      fill: shapeColor,
      radius: 50
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
  };

  const addTriangle = () => {
    if (!fabricCanvas) return;
    const triangle = new fabric.Triangle({
      left: canvasWidth / 2 - 50, 
      top: canvasHeight / 2 - 50,
      fill: shapeColor,
      width: 100, height: 100
    });
    fabricCanvas.add(triangle);
    fabricCanvas.setActiveObject(triangle);
    fabricCanvas.renderAll();
  };

  // Edit Active Object Properties (Sync changes instantly)
  const updateActiveObjectFill = (color: string) => {
    setActiveColor(color);
    if (!activeObject || !fabricCanvas) return;
    activeObject.set('fill', color);
    fabricCanvas.renderAll();
  };

  const updateActiveObjectRadius = (radius: number) => {
    setActiveRadius(radius);
    if (!activeObject || !fabricCanvas) return;
    if (activeObject.type === 'rect') {
      activeObject.set('rx', radius);
      activeObject.set('ry', radius);
    }
    fabricCanvas.renderAll();
  };

  const updateActiveObjectFont = (font: string) => {
    setActiveFont(font);
    if (!activeObject || !fabricCanvas || activeObject.type !== 'i-text') return;
    (activeObject as fabric.IText).set('fontFamily', font);
    fabricCanvas.renderAll();
  }

  // Setup Drag & Drop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fabricCanvas) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (f) => {
          const data = f.target?.result;
          if (typeof data === 'string') {
            fabric.FabricImage.fromURL(data).then((img) => {
              const rect = container.getBoundingClientRect();
              const x = (e.clientX - rect.left) / cssScale;
              const y = (e.clientY - rect.top) / cssScale;
              
              img.scaleToWidth(200);
              img.set({ left: x - 100, top: y - 100 });
              fabricCanvas.add(img);
              fabricCanvas.setActiveObject(img);
              fabricCanvas.renderAll();
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [fabricCanvas, cssScale]);

  // Frame Capture
  const addFrame = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject();
    
    // Reset zoom before capturing frame to ensure clean export
    const currentZoom = fabricCanvas.getZoom();
    const currentVpt = fabricCanvas.viewportTransform;
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.renderAll();
    
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
    
    // Restore zoom
    if (currentVpt) {
      fabricCanvas.setViewportTransform(currentVpt);
      fabricCanvas.renderAll();
    }
    
    setFrames([...frames, dataUrl]);
  };
  
  // Canvas Operations
  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    }
  };

  const toggleLayerVisibility = (obj: fabric.Object) => {
    if (!fabricCanvas) return;
    obj.set('visible', !obj.visible);
    fabricCanvas.renderAll();
    setLayers([...fabricCanvas.getObjects()]);
  };

  const deleteLayer = (obj: fabric.Object) => {
    if (!fabricCanvas) return;
    fabricCanvas.remove(obj);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
  };

  // Frame Operations
  const clearFrames = () => {
    setFrames([]);
    setIsPlaying(false);
  };

  const removeFrame = (index: number) => {
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    if (newFrames.length === 0) {
      setIsPlaying(false);
    }
  };

  const handleFrameDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedFrameIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFrameDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedFrameIdx === null || draggedFrameIdx === idx) return;

    const newFrames = [...frames];
    const draggedFrame = newFrames[draggedFrameIdx];
    newFrames.splice(draggedFrameIdx, 1);
    newFrames.splice(idx, 0, draggedFrame);
    
    setDraggedFrameIdx(idx);
    setFrames(newFrames);
  };

  const handleFrameDragEnd = () => {
    setDraggedFrameIdx(null);
  };

  // Export GIF
  const exportGif = async () => {
    if (frames.length === 0) {
      alert("Please add at least one frame before exporting.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // @ts-ignore
      const GIF = (await import('gif.js')).default;
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: '/gif.worker.js',
        width: canvasWidth,
        height: canvasHeight,
        background: '#ffffff'
      });
      
      const imagePromises = frames.map(src => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      });
      
      const images = await Promise.all(imagePromises);
      
      images.forEach(img => {
        gif.addFrame(img, { delay: 500, copy: true });
      });
      
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animated.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      });
      
      gif.render();
      
    } catch (error) {
      console.error("Error creating GIF:", error);
      alert("There was an error creating the GIF.");
      setIsExporting(false);
    }
  };

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[1920px] overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0b] shadow-2xl">
      
      {/* ---------------- FLOATING TOOLS PANEL (LEFT) ---------------- */}
      <div 
        className={`absolute left-0 top-0 z-20 flex h-full w-80 flex-col gap-4 border-r border-white/10 bg-[#161618]/95 p-4 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:bg-[#161618] lg:shadow-none ${isToolsOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wide">Tools</h2>
          <button onClick={() => setIsToolsOpen(false)} className="rounded-full bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          

          {/* Insert Image Tool */}
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
              <ImageIcon size={16} /> Add Image
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Local Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="w-full text-xs text-white file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Image from URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/img.png"
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white transition focus:border-white/30 focus:bg-black/60 focus:outline-none"
                  />
                  <button 
                    onClick={handleAddUrl}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-white/90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Text Tool */}
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Type size={16} /> Add Text
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Text Content</label>
                <input 
                  type="text" 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white transition focus:border-white/30 focus:bg-black/60 focus:outline-none"
                />
              </div>
              
              <FontDropdown 
                value={textFont} 
                onChange={setTextFont} 
                isOpen={isToolFontDropdownOpen} 
                setIsOpen={setIsToolFontDropdownOpen} 
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <ColorPicker value={textColor} onChange={setTextColor} label="Color" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Size</label>
                  <input 
                    type="number" 
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value) || 40)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-medium text-white transition focus:border-white/30 focus:bg-black/60 focus:outline-none"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleAddText}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold transition hover:bg-white/10 hover:text-white"
              >
                Insert Text
              </button>
            </div>
          </div>

          {/* Shapes Tool */}
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Triangle size={16} /> Add Shape
            </h3>
            <div className="flex flex-col gap-4">
              <ColorPicker value={shapeColor} onChange={setShapeColor} label="Shape Fill" />
              
              <div className="grid grid-cols-3 gap-2">
                <button onClick={addRectangle} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/40 py-3 text-[10px] font-medium transition hover:bg-white/10 hover:text-white">
                  <SquareIcon size={18} fill="currentColor" /> Rect
                </button>
                <button onClick={addCircle} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/40 py-3 text-[10px] font-medium transition hover:bg-white/10 hover:text-white">
                  <Circle size={18} fill="currentColor" /> Circle
                </button>
                <button onClick={addTriangle} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/40 py-3 text-[10px] font-medium transition hover:bg-white/10 hover:text-white">
                  <Triangle size={18} fill="currentColor" /> Tri
                </button>
              </div>
            </div>
          </div>

          {/* Active Object Properties */}
          {activeObject && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-400">
                <Palette size={16} /> Edit Selection
              </h3>
              
              {/* Color Editor for Shapes and Text */}
              {(activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle' || activeObject.type === 'i-text') && (
                <div className="mb-4">
                  <ColorPicker value={activeColor} onChange={updateActiveObjectFill} label="Color" />
                </div>
              )}

              {/* Corner Radius for Rectangles */}
              {activeObject.type === 'rect' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Corner Radius ({activeRadius}px)</label>
                  <input 
                    type="range" 
                    min="0" max="100"
                    value={activeRadius}
                    onChange={(e) => updateActiveObjectRadius(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {/* Font Editor for Text */}
              {activeObject.type === 'i-text' && (
                <FontDropdown 
                  value={activeFont} 
                  onChange={updateActiveObjectFont} 
                  isOpen={isEditFontDropdownOpen} 
                  setIsOpen={setIsEditFontDropdownOpen} 
                />
              )}
            </div>
          )}

        </div>
      </div>

      {/* Floating Tools Toggle Button */}
      {!isToolsOpen && (
        <button 
          onClick={() => setIsToolsOpen(true)}
          className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 rounded-r-2xl border border-l-0 border-white/10 bg-[#161618] px-3 py-4 text-sm font-semibold shadow-2xl transition hover:bg-[#202022] lg:hidden"
        >
          <Wrench size={18} />
          <span className="hidden sm:inline">Tools</span>
          <ChevronRight size={16} />
        </button>
      )}

      {/* ---------------- CENTRAL WORKSPACE ---------------- */}
      <div className="flex h-full w-full flex-col overflow-y-auto px-4 py-6 sm:px-12 custom-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          
          {/* Canvas Toolbar & Aspect Ratio */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161618] px-4 py-3 shadow-xl">
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Aspect Ratio Controls */}
              <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1 border border-white/5">
                <button 
                  onClick={() => handleAspectRatioChange('landscape')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${aspectRatio === 'landscape' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  <Monitor size={14} /> <span className="hidden sm:inline">Landscape</span>
                </button>
                <button 
                  onClick={() => handleAspectRatioChange('square')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${aspectRatio === 'square' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  <LayoutGrid size={14} /> <span className="hidden sm:inline">Square</span>
                </button>
                <button 
                  onClick={() => handleAspectRatioChange('portrait')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${aspectRatio === 'portrait' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  <Smartphone size={14} /> <span className="hidden sm:inline">Portrait</span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1 border border-white/5">
                <button 
                  onClick={handleZoomOut}
                  className="flex items-center justify-center rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="w-10 text-center text-[10px] font-bold text-white/70">{Math.round(fabricZoom * 100)}%</span>
                <button 
                  onClick={handleZoomIn}
                  className="flex items-center justify-center rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="mx-1 h-4 w-px bg-white/10"></div>
                <button 
                  onClick={handleZoomReset}
                  className="flex items-center justify-center rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  title="Reset Zoom"
                >
                  <Maximize size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 sm:text-sm"
              >
                <Trash2 size={16} /> <span className="hidden xl:inline">Delete Selected</span>
              </button>
              <button 
                onClick={addFrame}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 sm:px-6 sm:text-sm"
              >
                + Capture Frame
              </button>
            </div>
          </div>

          <div className="flex justify-center text-[10px] text-white/40">
            Tip: Scroll to zoom. Hold Alt and drag to pan when zoomed in.
          </div>

          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="relative mx-auto flex w-full justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-[#161618] p-4 shadow-xl transition hover:border-white/40 sm:p-6"
            style={{ height: (canvasHeight * cssScale) + 48 }}
          >
            <div 
              className={`relative flex items-center justify-center rounded bg-white shadow-inner origin-top`}
              style={{ 
                width: canvasWidth, 
                height: canvasHeight, 
                minWidth: canvasWidth, 
                minHeight: canvasHeight,
                transform: `scale(${cssScale})`
              }}
            >
              
              {/* HIDDEN CANVAS INSTEAD OF UNMOUNTING */}
              <div style={{ display: isPlaying ? 'none' : 'block', width: '100%', height: '100%' }}>
                <canvas ref={canvasRef} />
              </div>
              
              {/* PREVIEW OVERLAY */}
              {isPlaying && frames.length > 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                  <img src={frames[previewIdx]} alt="Preview Frame" className="h-full w-full object-contain" />
                  <div className="absolute right-4 top-4 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                    Previewing...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frames Timeline Panel */}
          <div className="rounded-2xl border border-white/10 bg-[#161618] p-4 shadow-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-semibold sm:text-lg">Timeline ({frames.length})</h3>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={frames.length === 0}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition disabled:opacity-50 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  {isPlaying ? 'Stop' : 'Play'}
                </button>
                
                <button 
                  onClick={exportGif}
                  disabled={isExporting || frames.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 sm:text-sm"
                >
                  {isExporting ? 'Creating...' : 'Export GIF'}
                </button>
              </div>
            </div>
            
            {frames.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-xs text-white/40 sm:text-sm">
                Capture frames to build your timeline
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-4 pt-2 custom-scrollbar">
                {frames.map((frame, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => handleFrameDragStart(e, idx)}
                    onDragOver={(e) => handleFrameDragOver(e, idx)}
                    onDragEnd={handleFrameDragEnd}
                    className={`group relative h-20 min-w-[120px] sm:h-24 sm:min-w-[140px] cursor-grab overflow-hidden rounded-xl border-2 bg-white transition active:cursor-grabbing ${draggedFrameIdx === idx ? 'border-blue-500 opacity-50' : 'border-white/10'}`}
                  >
                    <img src={frame} alt={`Frame ${idx}`} className="h-full w-full object-contain" />
                    
                    <div className="absolute bottom-0 left-0 bg-black/60 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white backdrop-blur-md">
                      {idx + 1}
                    </div>
                    
                    <button 
                      onClick={() => removeFrame(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-md transition hover:bg-red-500 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {frames.length > 0 && (
              <div className="mt-2 text-right">
                <button onClick={clearFrames} className="text-xs text-red-400 hover:text-red-300">
                  Clear all frames
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- FLOATING LAYERS PANEL (RIGHT) ---------------- */}
      <div 
        className={`absolute right-0 top-0 z-20 flex h-full w-72 flex-col gap-4 border-l border-white/10 bg-[#161618]/95 p-4 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:bg-[#161618] lg:shadow-none ${isLayersOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}
      >
        <div className="flex items-center justify-between">
          <button onClick={() => setIsLayersOpen(false)} className="rounded-full bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden">
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold tracking-wide">Layers</h2>
        </div>

        <div className="flex-1 overflow-y-auto pl-2 custom-scrollbar">
          <div className="flex flex-col gap-2">
            {layers.length === 0 ? (
              <div className="mt-4 text-center text-xs text-white/40">No objects on canvas</div>
            ) : (
              layers.slice().reverse().map((layer, idx) => (
                <div key={idx} onClick={() => { if(fabricCanvas) { fabricCanvas.setActiveObject(layer); fabricCanvas.renderAll(); } }} className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${activeObject === layer ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-black/30 hover:bg-black/50'}`}>
                  <span className="truncate text-xs font-medium text-white/90">
                    {layer.type === 'i-text' ? `Text: "${(layer as fabric.IText).text}"` : 
                     layer.type === 'rect' ? 'Rectangle' : 
                     layer.type === 'circle' ? 'Circle' : 
                     layer.type === 'triangle' ? 'Triangle' : 'Image'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer); }} className="text-white/50 transition hover:text-white">
                      {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer); }} className="text-white/50 transition hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Layers Toggle Button */}
      {!isLayersOpen && (
        <button 
          onClick={() => setIsLayersOpen(true)}
          className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-white/10 bg-[#161618] px-3 py-4 text-sm font-semibold shadow-2xl transition hover:bg-[#202022] lg:hidden"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Layers</span>
          <Layers size={18} />
        </button>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />
    </div>
  );
}
