"use client";

import { ApiEndpoint } from '@/app/(main)/classApi/apiClasses';
import { useContextStore } from '@/components/CreateContext';
import { aspectRatioImage } from '@/constant';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import {
  Canvas,
  CanvasEvents,
  Circle,
  FabricImage,
  FabricObject,
  Line,
  PatternBrush,
  PencilBrush,
  Point,
  Polyline,
  Rect,
  SprayBrush,
  StaticCanvas,
  Textbox,
  Triangle,
  filters,
} from 'fabric';
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { storeLocalAsset, getLocalAsset, storeLocalFont, getAllLocalFonts, getAllLocalAssets, StoredAsset } from '@/lib/persistent-storage';

type PanelTab = "Layer" | "Property" | "Assets" | "AI Features";
type EditorTool = "select" | "image" | "text" | "rectangle" | "triangle" | "circle" | "freeDrawing" | "polyline";
type TemporaryCanvasEvent = "mouse:down" | "mouse:move" | "mouse:up" | "mouse:dblclick" | "path:created";
type TemporaryCanvasHandler = (event: CanvasEvents[TemporaryCanvasEvent]) => void;
export type ExportCanvasFormat = "png" | "jpeg" | "webp";
export interface ExportCanvasOptions {
  format: ExportCanvasFormat;
  quality: number;
  multiplier: number;
  enableRetinaScaling: boolean;
  filename: string;
}

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasDivRef = useRef<HTMLDivElement | null>(null);
  const fabricJs = useRef<Canvas | null>(null);
  const temporaryCanvasListenersRef = useRef<Partial<Record<TemporaryCanvasEvent, TemporaryCanvasHandler>>>({});
  const temporaryCanvasDblClickRef = useRef<((event: MouseEvent) => void) | null>(null);

  const { state, setState, setError } = useContextStore();
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1280, height: 720 });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [somethingDrop, setSomethingDrop] = useState(false);
  const [aiEdit, setAiEdit] = useState(false);
  const [layerMenu, setLayerMenu] = useState<PanelTab>("Layer");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [viewportScale, setViewportScale] = useState(1);
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [brushType, setBrushType] = useState<"pencil" | "spray" | "pattern" | "eraser">("pencil");
  const [eraserSize, setEraserSize] = useState(20);

  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [assets, setAssets] = useState<{ id: string, src: string, name: string }[]>([]);
  const [customFonts, setCustomFonts] = useState<{ name: string, data: string }[]>([]);
  const [fontLoading, setFontLoading] = useState(false);
  const [maskStudioOpen, setMaskStudioOpen] = useState(false);
  const [assetSaveOpen, setAssetSaveOpen] = useState(false);
  const [assetSaveLayerId, setAssetSaveLayerId] = useState<string | null>(null);
  const [assetSaveToPublic, setAssetSaveToPublic] = useState(false);
  const [pages, setPages] = useState<{ id: string, name: string, data: any, layers: any[], width: number, height: number, viewportScale?: number }[]>([
    { id: uuidv4(), name: "Page 1", data: null, layers: [], width: 1280, height: 720, viewportScale: 1 }
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const isHistoryAction = useRef(false);
  const maskStudioOpenRef = useRef(false);
  const aiEditRef = useRef(aiEdit);
  const pagesRef = useRef(pages);
  const activePageIndexRef = useRef(activePageIndex);

  const syncCurrentPageToData = () => {
    if (!fabricJs.current) return pagesRef.current;
    
    // toObject handles custom properties array correctly in Fabric v6
    const currentData = fabricJs.current.toObject(['id', 'selectable', 'name', 'order', 'layerlock', 'originX', 'originY', 'visible', 'src', 'clipPath', 'filters', 'radius', 'rx', 'ry', 'assetId']);
    const latestPages = [...pagesRef.current];
    const currentIndex = activePageIndexRef.current;
    
    if (latestPages[currentIndex]) {
      latestPages[currentIndex] = {
        ...latestPages[currentIndex],
        data: currentData,
        layers: [...state],
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        viewportScale: viewportScale
      };
    }
    return latestPages;
  };

  const rehydrateCanvasData = async (data: any) => {
    if (!data || !data.objects) return data;
    
    const rehydrateObjects = async (objs: any[]) => {
      for (const obj of objs) {
        if (obj.assetId) {
          const storedAsset = await getLocalAsset(obj.assetId);
          if (storedAsset) {
            obj.src = URL.createObjectURL(storedAsset.blob);
          }
        }
        if (obj.objects) {
          await rehydrateObjects(obj.objects);
        }
      }
    };

    await rehydrateObjects(data.objects);
    return data;
  };

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    activePageIndexRef.current = activePageIndex;
  }, [activePageIndex]);

  useEffect(() => {
    maskStudioOpenRef.current = maskStudioOpen;
  }, [maskStudioOpen]);

  useEffect(() => {
    aiEditRef.current = aiEdit;
  }, [aiEdit]);


  useEffect(() => {
    if (fabricJs.current && fabricJs.current.isDrawingMode) {
      const canvas = fabricJs.current;
      if (brushType === "spray") {
        canvas.freeDrawingBrush = new SprayBrush(canvas);
        (canvas.freeDrawingBrush as any).density = 20;
        (canvas.freeDrawingBrush as any).dotWidth = 2;
        (canvas.freeDrawingBrush as any).dotWidthVariance = 1;
      } else if (brushType === "pattern") {
        canvas.freeDrawingBrush = new PatternBrush(canvas);
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = 10;
        const ctx = patternCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, 0, 5, 5);
          ctx.fillRect(5, 5, 5, 5);
        }
        (canvas.freeDrawingBrush as any).source = patternCanvas;
      } else {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }

      if (canvas.freeDrawingBrush) {
        if (brushType === "eraser") {
          (canvas.freeDrawingBrush as any).globalCompositeOperation = "destination-out";
        }
        canvas.freeDrawingBrush.width = brushType === "eraser" ? eraserSize : 10;
        canvas.freeDrawingBrush.color = brushType === "eraser" ? "#ffffff" : "#22c55e";
      }
    }
  }, [brushType, eraserSize]);

  const [view, setView] = useState<"home" | "editor">("editor");
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pendingProject, setPendingProject] = useState<any | null>(null);

  useEffect(() => {
    const savedMetadata = localStorage.getItem('polish_ai_projects_metadata');
    let projectsList = [];
    if (savedMetadata) {
      projectsList = JSON.parse(savedMetadata);
      setRecentProjects(projectsList);
    }

    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    const w = params.get('width');
    const h = params.get('height');
    const pid = params.get('projectId');

    if (w && h) {
      createNewProject(Number(w), Number(h));
    } else if (pid) {
      const metadata = projectsList.find((p: any) => p.id === pid);
      if (metadata) {
        const projectDataRaw = localStorage.getItem(`polish_ai_project_data_${pid}`);
        if (projectDataRaw) {
          const parsed = JSON.parse(projectDataRaw);
          if (parsed.pages) {
            setPages(parsed.pages);
            pagesRef.current = parsed.pages;
            const activeIdx = parsed.activePageIndex || 0;
            setActivePageIndex(activeIdx);
            activePageIndexRef.current = activeIdx;
            
            const activePage = parsed.pages[activeIdx];
            setPendingProject({ 
              id: pid, 
              data: activePage.data, 
              width: activePage.width || metadata.width, 
              height: activePage.height || metadata.height 
            });
          } else {
            // Legacy load
            setPendingProject({ id: pid, data: parsed, width: metadata.width, height: metadata.height });
          }
          setView("editor");
        }
      }
    }

    const savedAssets = localStorage.getItem('polish_ai_assets');
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    }

    const savedFonts = localStorage.getItem('polish_ai_custom_fonts');
    if (savedFonts) {
      const fonts = JSON.parse(savedFonts);
      setCustomFonts(fonts);
      // Native fonts from LocalStorage metadata (if still using both)
    }

    // Load persistent fonts from IndexedDB
    const loadPersistentFonts = async () => {
      const storedFonts = await getAllLocalFonts();
      for (const font of storedFonts) {
        const fontFace = new FontFace(font.name, `url(${URL.createObjectURL(font.blob)})`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
          setCustomFonts(prev => {
            if (prev.find(f => f.name === font.name)) return prev;
            return [...prev, { name: font.name, data: URL.createObjectURL(font.blob) }];
          });
        }).catch(err => console.error("Persistent Font loading error:", err));
      }
    };
    loadPersistentFonts();
    
    // Load persistent assets from IndexedDB
    const loadPersistentAssets = async () => {
      const storedAssets = await getAllLocalAssets();
      setAssets(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAssets = storedAssets
          .filter(a => !existingIds.has(a.id))
          .map(a => ({ id: a.id, src: URL.createObjectURL(a.blob), name: a.name }));
        return [...prev, ...newAssets];
      });
    };
    loadPersistentAssets();

    // Load fonts from Appwrite
    const loadPublicFonts = async () => {
      try {
        const { appwriteFonts } = await import('@/lib/appwrite-fonts');
        const publicFonts = await appwriteFonts.listFonts();
        publicFonts.forEach(font => {
          const fontFace = new FontFace(font.name, `url(${font.url})`);
          fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            setCustomFonts(prev => {
              if (prev.find(f => f.name === font.name)) return prev;
              return [...prev, { name: font.name, data: font.url }];
            });
          }).catch(err => console.error("Public Font loading error:", err));
        });
      } catch (e) {
        console.error("Failed to load public fonts:", e);
      }
    };

    // Load assets from Appwrite
    const loadPublicAssets = async () => {
      try {
        const { appwriteAssets } = await import('@/lib/appwrite-assets');
        const publicAssets = await appwriteAssets.listAssets();
        setAssets(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAssets = publicAssets
            .filter(a => !existingIds.has(a.id))
            .map(a => ({ id: a.id, src: a.url, name: a.name }));
          return [...prev, ...newAssets];
        });
      } catch (e) {
        console.error("Failed to load public assets:", e);
      }
    };

    loadPublicFonts();
    loadPublicAssets();
  }, []);

  // Handle mobile default panel state
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, []);

  const addPage = async () => {
    if (!fabricJs.current || isHistoryAction.current) return;
    
    // 1. Sync current page first
    const updatedPages = syncCurrentPageToData();
    const currentData = updatedPages[activePageIndexRef.current].data;

    // 2. Create new page (cloned from current or empty)
    const newPage = {
      id: uuidv4(),
      name: `Page ${updatedPages.length + 1}`,
      data: currentData,
      layers: [...state],
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      viewportScale: viewportScale
    };
    
    const finalPages = [...updatedPages, newPage];
    const newPageIndex = finalPages.length - 1;

    // 3. Update states immediately to avoid race conditions
    pagesRef.current = finalPages;
    activePageIndexRef.current = newPageIndex;
    setPages(finalPages);
    setActivePageIndex(newPageIndex);
    
    // 4. Reload canvas to ensure object independence
    isHistoryAction.current = true;
    try {
      fabricJs.current.clear();
      const rehydratedData = await rehydrateCanvasData(currentData);
      await fabricJs.current.loadFromJSON(rehydratedData);
      fabricJs.current.getObjects().forEach(obj => attachTransformListeners(obj));
      fabricJs.current.renderAll();
      syncCanvasToState();
      toast.success("New page added from current canvas!");
    } catch (err) {
      console.error("Add page error:", err);
    } finally {
      isHistoryAction.current = false;
    }
  };

  const switchPage = async (index: number) => {
    if (!fabricJs.current || index === activePageIndexRef.current || isHistoryAction.current) return;
    
    // 1. Save current page state
    const updatedPages = syncCurrentPageToData();

    // 2. Load target page
    const targetPage = updatedPages[index];
    isHistoryAction.current = true;
    
    try {
      fabricJs.current.clear();
      // Set target page dimensions
      const targetWidth = targetPage.width || 1280;
      const targetHeight = targetPage.height || 720;
      setCanvasDimensions({ width: targetWidth, height: targetHeight });
      fabricJs.current.setDimensions({ width: targetWidth, height: targetHeight });
      
      // Restore viewport scale if exists, else fit
      if (targetPage.viewportScale) {
        setViewportScale(targetPage.viewportScale);
      } else {
        fitCanvasToViewport({ width: targetWidth, height: targetHeight });
      }

      if (targetPage.data) {
        const rehydratedData = await rehydrateCanvasData(targetPage.data);
        await fabricJs.current.loadFromJSON(rehydratedData);
        
        // Re-attach listeners to new objects
        fabricJs.current.getObjects().forEach(obj => attachTransformListeners(obj));
      } else {
        fabricJs.current.backgroundColor = "#ffffff";
      }
      fabricJs.current.renderAll();
      syncCanvasToState();
      
      // Update states immediately to avoid race conditions
      pagesRef.current = updatedPages;
      activePageIndexRef.current = index;
      setPages(updatedPages);
      setActivePageIndex(index);
      setState(targetPage.layers || []);
    } catch (err) {
      console.error("Page switch error:", err);
      toast.error("Failed to switch page smoothly.");
    } finally {
      isHistoryAction.current = false;
    }
    
    toast.info(`Switched to ${targetPage.name}`);
  };

  const deletePage = async (index: number) => {
    if (pages.length <= 1) {
      toast.error("You must have at least one page.");
      return;
    }
    
    const isDeletingActive = index === activePageIndex;
    const newPages = pages.filter((_, i) => i !== index);
    
    let nextIndex = activePageIndex;
    if (isDeletingActive) {
      nextIndex = Math.min(index, newPages.length - 1);
    } else if (index < activePageIndex) {
      nextIndex = activePageIndex - 1;
    }

    // Update states immediately to avoid race conditions
    pagesRef.current = newPages;
    activePageIndexRef.current = nextIndex;
    setPages(newPages);
    setActivePageIndex(nextIndex);

    if (isDeletingActive && fabricJs.current) {
      const targetPage = newPages[nextIndex];
      isHistoryAction.current = true;
      try {
        fabricJs.current.clear();
        // Set target page dimensions
        const targetWidth = targetPage.width || 1280;
        const targetHeight = targetPage.height || 720;
        setCanvasDimensions({ width: targetWidth, height: targetHeight });
        fabricJs.current.setDimensions({ width: targetWidth, height: targetHeight });
        
        // Restore viewport scale
        if (targetPage.viewportScale) {
          setViewportScale(targetPage.viewportScale);
        } else {
          fitCanvasToViewport({ width: targetWidth, height: targetHeight });
        }

        if (targetPage.data) {
          await fabricJs.current.loadFromJSON(targetPage.data);
          fabricJs.current.getObjects().forEach(obj => attachTransformListeners(obj));
        } else {
          fabricJs.current.backgroundColor = "#ffffff";
        }
        fabricJs.current.renderAll();
        setState(targetPage.layers || []);
      } catch (err) {
        console.error("Delete switch error:", err);
      } finally {
        isHistoryAction.current = false;
      }
    }
    
    toast.success("Page deleted");
  };

  useEffect(() => {
    localStorage.setItem('polish_ai_assets', JSON.stringify(assets));
  }, [assets]);

  const saveProject = async (projectName?: string) => {
    if (!fabricJs.current) return;

    const id = currentProjectId || uuidv4();
    const thumbnail = fabricJs.current.toDataURL({
      format: 'webp',
      quality: 0.5,
      multiplier: 200 / canvasDimensions.width
    });

    // 1. Sync current page state before global save
    const latestPages = syncCurrentPageToData();
    const currentIndex = activePageIndexRef.current;

    const projectData = {
      pages: latestPages,
      activePageIndex: currentIndex,
      width: canvasDimensions.width,
      height: canvasDimensions.height
    };

    const metadata = {
      id,
      name: projectName || (recentProjects.find(p => p.id === id)?.name) || `Project ${recentProjects.length + 1}`,
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      thumbnail,
      lastEdited: Date.now(),
    };

    localStorage.setItem(`polish_ai_project_data_${id}`, JSON.stringify(projectData));
    const updatedMetadata = [metadata, ...recentProjects.filter(p => p.id !== id)].slice(0, 50);
    localStorage.setItem('polish_ai_projects_metadata', JSON.stringify(updatedMetadata));
    setRecentProjects(updatedMetadata);
    setCurrentProjectId(id);
    setPages(latestPages);
  };

  const loadProject = async (id: string) => {
    const projectDataRaw = localStorage.getItem(`polish_ai_project_data_${id}`);
    const metadata = recentProjects.find(p => p.id === id);
    if (projectDataRaw && metadata) {
      const parsed = JSON.parse(projectDataRaw);
      if (parsed.pages) {
        // Multi-page format
        setPages(parsed.pages);
        pagesRef.current = parsed.pages;
        const activeIdx = parsed.activePageIndex || 0;
        setActivePageIndex(activeIdx);
        activePageIndexRef.current = activeIdx;

        const activePage = parsed.pages[activeIdx];
        setPendingProject({ 
          id, 
          data: activePage.data, 
          width: activePage.width || metadata.width, 
          height: activePage.height || metadata.height 
        });
      } else {
        // Legacy project format
        const legacyWidth = metadata.width || 1280;
        const legacyHeight = metadata.height || 720;
        const newPages = [{ id: uuidv4(), name: "Page 1", data: parsed, layers: [], width: legacyWidth, height: legacyHeight }];
        setPages(newPages);
        pagesRef.current = newPages;
        setActivePageIndex(0);
        activePageIndexRef.current = 0;
        setPendingProject({ id, data: parsed, width: legacyWidth, height: legacyHeight });
      }
      setView("editor");
    }
  };

  const createNewProject = (width: number, height: number) => {
    setPages([{ id: uuidv4(), name: "Page 1", data: null, layers: [], width, height }]);
    setActivePageIndex(0);
    setPendingProject({ width, height, isNew: true });
    setView("editor");
  };

  const updateCanvasDimensions = (width: number, height: number) => {
    setCanvasDimensions({ width, height });
    
    // Update active page dimensions and scale in the pages array
    setPages(prev => {
      const next = [...prev];
      if (next[activePageIndex]) {
        next[activePageIndex] = { ...next[activePageIndex], width, height, viewportScale };
      }
      return next;
    });

    if (fabricJs.current) {
      fabricJs.current.setDimensions({ width, height });
      fitCanvasToViewport({ width, height });
    }
  };

  useEffect(() => {
    const handlePending = async () => {
      if (view === "editor" && fabricJs.current && pendingProject) {
        const { id, data, width, height, isNew } = pendingProject;

        // Lock history during load
        isHistoryAction.current = true;

        // Ensure dimensions are correct
        setCanvasDimensions({ width, height });
        if (fabricJs.current) fabricJs.current.setDimensions({ width, height });

        if (isNew) {
        fabricJs.current?.clear();
          if (fabricJs.current) fabricJs.current.backgroundColor = "#ffffff";
          setCurrentProjectId(null);
          setState([]);
        } else if (data) {
          const rehydratedData = await rehydrateCanvasData(data);
          await fabricJs.current?.loadFromJSON(rehydratedData);
          setCurrentProjectId(id);
          
          // Force render after load
          fabricJs.current?.requestRenderAll();

          // Rebuild layers state from loaded objects
          const objects = fabricJs.current.getObjects();
          objects.forEach((obj: any) => attachTransformListeners(obj));
          
          // Synchronize state from the loaded canvas
          syncCanvasToState();
        }

        fabricJs.current?.renderAll();
        fitCanvasToViewport({ width, height });
        setPendingProject(null);
        isHistoryAction.current = false;
      }
    };
    handlePending();
  }, [view, pendingProject]);

  const generateLayerId = (prefix: string) => `${prefix}_${uuidv4().split("-")[0]}`;

  const renderCanvas = () => {
    fabricJs.current?.renderAll();
  };

  const updateCanvasCursor = (tool: EditorTool) => {
    if (!fabricJs.current) return;

    if (tool === "select") {
      fabricJs.current.defaultCursor = "default";
      fabricJs.current.hoverCursor = "move";
      fabricJs.current.moveCursor = "move";
      fabricJs.current.freeDrawingCursor = "crosshair";
      return;
    }

    const crosshairTools: EditorTool[] = ["rectangle", "triangle", "circle", "freeDrawing", "polyline"];
    const nextCursor =
      tool === "text"
        ? "text"
        : tool === "image"
          ? "copy"
          : crosshairTools.includes(tool)
            ? "crosshair"
            : "default";

    fabricJs.current.defaultCursor = nextCursor;
    fabricJs.current.hoverCursor = nextCursor;
    fabricJs.current.moveCursor = nextCursor;
    fabricJs.current.freeDrawingCursor = nextCursor;
  };

  const registerTemporaryCanvasListener = <T extends TemporaryCanvasEvent>(
    eventName: T,
    handler: (event: CanvasEvents[T]) => void,
  ) => {
    if (!fabricJs.current) return;

    const existingHandler = temporaryCanvasListenersRef.current[eventName];
    if (existingHandler) {
      fabricJs.current.off(eventName, existingHandler as (event: CanvasEvents[T]) => void);
    }

    temporaryCanvasListenersRef.current[eventName] = handler as TemporaryCanvasHandler;
    fabricJs.current.on(eventName, handler);
  };

  const registerTemporaryNativeDblClick = (handler: (event: MouseEvent) => void) => {
    const upperCanvas = fabricJs.current?.upperCanvasEl;
    if (!upperCanvas) return;

    if (temporaryCanvasDblClickRef.current) {
      upperCanvas.removeEventListener("dblclick", temporaryCanvasDblClickRef.current);
    }

    temporaryCanvasDblClickRef.current = handler;
    upperCanvas.addEventListener("dblclick", handler);
  };

  const clearTemporaryCanvasListeners = () => {
    if (!fabricJs.current) return;

    Object.entries(temporaryCanvasListenersRef.current).forEach(([eventName, handler]) => {
      if (!handler) return;
      fabricJs.current?.off(eventName as TemporaryCanvasEvent, handler as TemporaryCanvasHandler);
    });

    if (temporaryCanvasDblClickRef.current && fabricJs.current.upperCanvasEl) {
      fabricJs.current.upperCanvasEl.removeEventListener("dblclick", temporaryCanvasDblClickRef.current);
    }

    temporaryCanvasListenersRef.current = {};
    temporaryCanvasDblClickRef.current = null;
    fabricJs.current.isDrawingMode = false;
    fabricJs.current.selection = true;
    fabricJs.current.skipTargetFind = false;
  };

  const resetToSelectMode = () => {
    setActiveTool("select");
    updateCanvasCursor("select");
    clearTemporaryCanvasListeners();
    fabricJs.current?.requestRenderAll();
  };

  const syncObjectToState = (object: any) => {
    if (!object) return;
    const id = object.get("id");
    if (!id) return;

    const nextSnapshot: Partial<StateProps> = {
      globalCompositeOperation: object.get("globalCompositeOperation"),
      top: object.get("top") ?? 0,
      left: object.get("left") ?? 0,
      width: Number(Math.round(object.getScaledWidth()).toFixed(0)),
      height: Number(Math.round(object.getScaledHeight()).toFixed(0)),
      angle: object.get("angle") ?? 0,
      fill: object.get("fill"),
      skewX: object.get("skewX") ?? 0,
      skewY: object.get("skewY") ?? 0,
    };

    setState((prev) => prev.map((item) => item.id === id ? ({ ...item, ...nextSnapshot }) : item));
  };

  const attachTransformListeners = (object: FabricObject) => {
    object.on("modified", ({ target }) => {
      syncObjectToState(target);
    });

    object.on("scaling", ({ transform }) => {
      syncObjectToState(transform.target);
    });
  };

  const getMaxOrder = () => {
    const values = state.map((item) => item.order ?? 0);
    return Math.max(...(values.length ? values : [0]));
  };

  const syncCanvasToState = () => {
    if (!fabricJs.current) return;
    const objects = fabricJs.current.getObjects();
    const newState: any[] = objects.map((obj: any) => {
      return {
        id: obj.get("id"),
        type: obj.type === "i-text" || obj.type === "textbox" ? "text" : (obj.type === "image" ? "image" : "shape"),
        left: obj.get("left") ?? 0,
        top: obj.get("top") ?? 0,
        width: Math.round(obj.getScaledWidth()),
        height: Math.round(obj.getScaledHeight()),
        angle: obj.get("angle") ?? 0,
        fill: obj.get("fill"),
        order: obj.get("order") ?? 0,
        src: obj.get("src"), // for images
        layerlock: obj.get("layerlock"),
        hideLayer: !obj.get("visible"),
        skewX: obj.get("skewX") ?? 0,
        skewY: obj.get("skewY") ?? 0,
      };
    });
    setState(newState);
  };

  const saveHistory = () => {
    if (!fabricJs.current || isHistoryAction.current) return;
    const json = fabricJs.current.toObject(['id', 'selectable', 'name', 'order', 'layerlock', 'originX', 'originY', 'visible', 'src', 'assetId']);
    setHistory((prev) => [json, ...prev].slice(0, 10));
    setRedoStack([]);
  };

  const undo = async () => {
    if (!fabricJs.current || history.length === 0 || isHistoryAction.current) return;
    isHistoryAction.current = true;

    const currentJson = fabricJs.current.toObject(['id', 'selectable', 'name', 'order', 'layerlock', 'originX', 'originY', 'visible', 'src', 'assetId']);
    const prevJson = history[0];

    await fabricJs.current.loadFromJSON(prevJson);
    fabricJs.current.renderAll();

    setRedoStack((prev) => [currentJson, ...prev].slice(0, 10));
    setHistory((prev) => prev.slice(1));
    syncCanvasToState();

    isHistoryAction.current = false;
  };

  const redo = async () => {
    if (!fabricJs.current || redoStack.length === 0 || isHistoryAction.current) return;
    isHistoryAction.current = true;

    const currentJson = fabricJs.current.toObject(['id', 'selectable', 'name', 'order', 'layerlock', 'originX', 'originY', 'visible', 'src', 'assetId']);
    const nextJson = redoStack[0];

    await fabricJs.current.loadFromJSON(nextJson);
    fabricJs.current.renderAll();

    setHistory((prev) => [currentJson, ...prev].slice(0, 10));
    setRedoStack((prev) => prev.slice(1));
    syncCanvasToState();

    isHistoryAction.current = false;
  };

  const addAsset = (src: string, name: string) => {
    const newAsset = { id: uuidv4(), src, name };
    setAssets((prev) => [newAsset, ...prev]);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const saveLayerAsAsset = (layerId: string) => {
    setAssetSaveLayerId(layerId);
    setAssetSaveOpen(true);
    setAssetSaveToPublic(false); // Default to local
  };

  const confirmSaveAsset = async (isPublic: boolean) => {
    if (!fabricJs.current || !assetSaveLayerId) return;
    const obj = fabricJs.current.getObjects().find(o => o.get("id") === assetSaveLayerId);
    if (!obj) return;

    const toastId = toast.loading(isPublic ? "Uploading to Cloud..." : "Saving locally...");

    try {
      const dataUrl = obj.toDataURL({ 
        format: 'png',
        multiplier: 2,
      });

      if (isPublic) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `${obj.get("name") || assetSaveLayerId.split('_')[0]}_asset.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        const { appwriteAssets } = await import('@/lib/appwrite-assets');
        const uploadedAsset = await appwriteAssets.uploadAsset(file);
        
        setAssets(prev => [{ id: uploadedAsset.id, src: uploadedAsset.url, name: uploadedAsset.name }, ...prev]);
        toast.success("Saved to Cloud Assets!", { id: toastId });
      } else {
        addAsset(dataUrl, `Local Asset ${assets.length + 1}`);
        toast.success("Saved to Local Assets!", { id: toastId });
      }
      setAssetSaveOpen(false);
      setAssetSaveLayerId(null);
    } catch (err) {
      console.error("Asset save error:", err);
      toast.error("Failed to save asset", { id: toastId });
    }
  };

  const addCustomFont = async (file: File, isPublic: boolean = false) => {
    setFontLoading(true);
    
    try {
      const name = file.name.split('.')[0];
      let fontUrl: string;

      if (isPublic) {
        const { appwriteFonts } = await import('@/lib/appwrite-fonts');
        const uploadedFont = await appwriteFonts.uploadFont(file);
        fontUrl = uploadedFont.url;
      } else {
        const reader = new FileReader();
        fontUrl = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read font file"));
          reader.readAsDataURL(file);
        });
      }

      const fontFace = new FontFace(name, `url(${fontUrl})`);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);

      setCustomFonts(prev => {
        const newFont = { name, data: fontUrl };
        const next = [...prev, newFont];
        if (!isPublic) {
          localStorage.setItem('polish_ai_custom_fonts', JSON.stringify(next.filter(f => !f.data.startsWith('http'))));
        }
        return next;
      });

      toast.success(`Font "${name}" added successfully ${isPublic ? 'to Cloud' : 'locally'}!`);
    } catch (err) {
      console.error("Font loading/upload error:", err);
      toast.error(`Failed to ${isPublic ? 'upload' : 'load'} font`);
    } finally {
      setFontLoading(false);
    }
  };

  const fitCanvasToViewport = (dims: { width: number, height: number }) => {
    if (!fabricJs.current) return;

    // Use full target resolution for the Fabric canvas internals
    fabricJs.current.setDimensions({ width: dims.width, height: dims.height });
    fabricJs.current.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Calculate fitted scale for initial UI display (so it fits the screen)
    const desktop = window.innerWidth >= 1024;
    const availableWidth = desktop
      ? Math.max(320, Math.floor(window.innerWidth * 0.5) - 80)
      : Math.max(280, window.innerWidth - 32);
    const availableHeight = desktop
      ? Math.max(260, window.innerHeight - 190)
      : Math.max(240, window.innerHeight - 220);

    const widthRatio = availableWidth / dims.width;
    const heightRatio = availableHeight / dims.height;
    const fittedScale = Math.min(widthRatio, heightRatio, 1);

    setViewportScale(fittedScale);
    renderCanvas();
  };

  const droppingFile = (files: FileList) => {
    if (!files.length) return;
    const blockedTypes = ["avif", "gif", "svg+xml", "svg", "pdf"];
    if (blockedTypes.includes(files[0].type)) return;
    fileInserting(files);
  };

  useEffect(() => {
    if (!canvasRef.current || fabricJs.current) return;

    // Custom premium selection styling matching user request
    FabricObject.prototype.set({
      borderColor: '#8b5cf6', // Violet 500
      borderScaleFactor: 2,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#8b5cf6',
      cornerSize: 12,
      cornerStyle: 'circle',
      transparentCorners: false,
      padding: 0,
      borderDashArray: null,
    });

    fabricJs.current = new Canvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    // Enforce custom premium styling on every object added to canvas
    fabricJs.current.on("object:added", (e) => {
      const obj = e.target;
      obj.set({
        borderColor: '#8b5cf6',
        borderScaleFactor: 2,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#8b5cf6',
        cornerSize: 12,
        transparentCorners: false,
        padding: 0,
        borderDashArray: null,
      });

      // Style corner handles as circles
      if (obj.controls) {
        ['tl', 'tr', 'bl', 'br'].forEach(key => {
          if (obj.controls[key]) (obj.controls[key] as any).cornerStyle = 'circle';
        });
        // Style side handles as rectangles (pills)
        ['mt', 'mb', 'ml', 'mr'].forEach(key => {
          if (obj.controls[key]) (obj.controls[key] as any).cornerStyle = 'rect';
        });
      }
    });

    fabricJs.current.on("object:modified", saveHistory);
    fabricJs.current.on("object:added", saveHistory);
    fabricJs.current.on("object:removed", saveHistory);

    fabricJs.current.on("selection:created", (e) => {
      const objects = e.selected || [];
      const ids = objects.map(obj => obj.get("id")).filter(Boolean);
      setSelectedIds(ids);
      if (ids.length > 0) setActiveId(ids[0]);
    });

    fabricJs.current.on("selection:updated", (e) => {
      const objects = e.selected || [];
      const ids = objects.map(obj => obj.get("id")).filter(Boolean);
      setSelectedIds(ids);
      if (ids.length > 0) setActiveId(ids[0]);
    });

    fabricJs.current.on("selection:cleared", () => {
      setSelectedIds([]);
      setActiveId(null);
    });

    let isPinching = false;
    let lastDistance = 0;
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const dropOverImage = (event: DragEvent) => {
      event.preventDefault();
      setSomethingDrop(true);
    };

    const dropImage = (event: DragEvent) => {
      event.preventDefault();
      if (!event.dataTransfer) return;
      droppingFile(event.dataTransfer.files);
      setSomethingDrop(false);
    };

    const deletingObj = (event: KeyboardEvent) => {
      if (!fabricJs.current || aiEditRef.current) return;
      if (event.key === "Delete") {
        fabricJs.current.getActiveObjects().forEach((object) => {
          const id = object.get("id");
          if (id) {
            deleteLayer(id);
          }
        });
      }
      if (event.key === "Escape") {
        deselectAll();
      }
    };

    fabricJs.current.on("mouse:wheel", (opt) => {
      const event = opt.e as WheelEvent;
      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY;
      const zoomStep = 0.01; // Even slower zoom
      setViewportScale((prev) => {
        const next = delta > 0 ? prev - zoomStep : prev + zoomStep;
        return Math.min(Math.max(next, 0.1), 5);
      });
    });

    fabricJs.current.on("mouse:down", (opt) => {
    });

    fabricJs.current.on("mouse:move", (opt) => {
    });

    fabricJs.current.on("mouse:up", () => {
      if (!fabricJs.current) return;
      isDragging = false;
      fabricJs.current.selection = true;
      fabricJs.current.setCursor('default');
    });

    fabricJs.current.on("selection:created", (event) => {
      setActiveId(event.selected?.[0]?.get("id") ?? null);
    });

    fabricJs.current.on("selection:updated", (event) => {
      setActiveId(event.selected?.[0]?.get("id") ?? null);
    });

    fabricJs.current.on("selection:cleared", () => {
      setActiveId(null);
    });

    fabricJs.current.on("object:moving", (options) => {
      const obj = options.target;
      if (!obj || !fabricJs.current) return;

      const snapThreshold = 15;
      const canvasWidth = fabricJs.current.width!;
      const canvasHeight = fabricJs.current.height!;

      const objWidth = obj.getScaledWidth();
      const objHeight = obj.getScaledHeight();

      // Calculate boundaries based on origins
      const left = obj.originX === 'center' ? obj.left! - objWidth / 2 : (obj.originX === 'right' ? obj.left! - objWidth : obj.left!);
      const top = obj.originY === 'center' ? obj.top! - objHeight / 2 : (obj.originY === 'bottom' ? obj.top! - objHeight : obj.top!);

      // Center Snapping
      if (Math.abs((left + objWidth / 2) - canvasWidth / 2) < snapThreshold) {
        const targetLeft = canvasWidth / 2 - objWidth / 2;
        obj.set('left', obj.originX === 'center' ? canvasWidth / 2 : (obj.originX === 'right' ? targetLeft + objWidth : targetLeft));
      }

      if (Math.abs((top + objHeight / 2) - canvasHeight / 2) < snapThreshold) {
        const targetTop = canvasHeight / 2 - objHeight / 2;
        obj.set('top', obj.originY === 'center' ? canvasHeight / 2 : (obj.originY === 'bottom' ? targetTop + objHeight : targetTop));
      }

      // Edge Snapping
      if (Math.abs(left) < snapThreshold) {
        obj.set('left', obj.originX === 'center' ? objWidth / 2 : (obj.originX === 'right' ? objWidth : 0));
      }
      if (Math.abs(top) < snapThreshold) {
        obj.set('top', obj.originY === 'center' ? objHeight / 2 : (obj.originY === 'bottom' ? objHeight : 0));
      }
      if (Math.abs(left + objWidth - canvasWidth) < snapThreshold) {
        const targetLeft = canvasWidth - objWidth;
        obj.set('left', obj.originX === 'center' ? targetLeft + objWidth / 2 : (obj.originX === 'right' ? canvasWidth : targetLeft));
      }
      if (Math.abs(top + objHeight - canvasHeight) < snapThreshold) {
        const targetTop = canvasHeight - objHeight;
        obj.set('top', obj.originY === 'center' ? targetTop + objHeight / 2 : (obj.originY === 'bottom' ? canvasHeight : targetTop));
      }
    });

    const handleTouchStart = (event: TouchEvent) => {
      if (!fabricJs.current || event.touches.length !== 2) return;

      isPinching = true;
      fabricJs.current.selection = false;
      fabricJs.current.forEachObject((object) => {
        object.selectable = false;
      });

      lastDistance = Math.hypot(
        event.touches[1].clientX - event.touches[0].clientX,
        event.touches[1].clientY - event.touches[0].clientY
      );
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!fabricJs.current || !isPinching || event.touches.length !== 2) return;
      event.preventDefault();

      const currentDistance = Math.hypot(
        event.touches[1].clientX - event.touches[0].clientX,
        event.touches[1].clientY - event.touches[0].clientY
      );

      if (lastDistance <= 0) return;

      const currentScale = currentDistance / lastDistance;
      const zoomDamping = 0.4; // Slower pinch zoom
      const adjustedScale = 1 + (currentScale - 1) * zoomDamping;

      setViewportScale((prev) => {
        const next = prev * adjustedScale;
        return Math.min(Math.max(next, 0.1), 5);
      });

      lastDistance = currentDistance;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!fabricJs.current || event.touches.length >= 2) return;
      isPinching = false;
      lastDistance = 0;
      fabricJs.current.selection = true;
      fabricJs.current.forEachObject((object) => {
        object.selectable = true;
      });
    };

    const canvasElement = canvasRef.current;
    canvasElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvasElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasElement.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("dragover", dropOverImage);
    window.addEventListener("drop", dropImage);
    window.addEventListener("keydown", deletingObj);

    const handlePaste = async (e: ClipboardEvent) => {
      if (maskStudioOpenRef.current || aiEditRef.current) return; // Use Refs for latest state
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const assetId = await storeLocalAsset(blob, `pasted_${Date.now()}`);
            const imageUrl = URL.createObjectURL(blob);
            await addImageToCanvas(imageUrl, { assetId });
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);

    fitCanvasToViewport(canvasDimensions);

    return () => {
      window.removeEventListener("dragover", dropOverImage);
      window.removeEventListener("drop", dropImage);
      window.removeEventListener("keydown", deletingObj);
      window.removeEventListener("paste", handlePaste);
      if (canvasElement) {
        canvasElement.removeEventListener("touchstart", handleTouchStart);
        canvasElement.removeEventListener("touchmove", handleTouchMove);
        canvasElement.removeEventListener("touchend", handleTouchEnd);
      }
      
      if (fabricJs.current) {
        try {
          fabricJs.current.dispose();
        } catch (e) {
          console.warn("Fabric dispose warning:", e);
        }
        fabricJs.current = null;
      }
    };
  }, []); // Only initialize once on mount

  useEffect(() => {
    fitCanvasToViewport(canvasDimensions);
  }, [canvasDimensions]);

  useEffect(() => {
    const handleResize = () => {
      fitCanvasToViewport(canvasDimensions);
    };

    window.removeEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasDimensions]);

  const addImageToCanvas = async (imageUrl: string, options: { assetId?: string } = {}) => {
    if (!fabricJs.current) return;
    const canvas = fabricJs.current;
    const { assetId } = options;

    try {
      const image = await FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" });
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const maxWidth = Math.max(160, canvasWidth - 64);
      const maxHeight = Math.max(160, canvasHeight - 64);
      const originalWidth = image.width ?? maxWidth;
      const originalHeight = image.height ?? maxHeight;
      const fitRatio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);
      image.scale(fitRatio);

      const fittedWidth = image.getScaledWidth();
      const fittedHeight = image.getScaledHeight();
      const left = Math.max(24, (canvasWidth - fittedWidth) / 2);
      const top = Math.max(24, (canvasHeight - fittedHeight) / 2);

      const nextLayer: StateProps = {
        id: generateLayerId("image"),
        left,
        top,
        fill: "#fff",
        scaleX: fitRatio,
        scaleY: fitRatio,
        scale: 1,
        width: fittedWidth,
        height: fittedHeight,
        globalCompositeOperation: "normal",
        order: getMaxOrder() + 1,
        type: "image",
        angle: 0,
        layerlock: false,
        src: imageUrl,
        assetId: assetId
      };

      image.set({
        id: nextLayer.id,
        assetId: assetId,
        left,
        top,
        angle: nextLayer.angle,
        scaleX: image.scaleX ?? fitRatio,
        scaleY: image.scaleY ?? fitRatio,
        originX: "left",
        originY: "top",
        objectCaching: false,
      });
      canvas.add(image);
      attachTransformListeners(image);
      image.setCoords();
      canvas.setActiveObject(image);
      canvas.requestRenderAll();
      setActiveTool("select");
      updateCanvasCursor("select");
      setState((prev) => [{
        ...nextLayer,
        left: image.left ?? nextLayer.left,
        top: image.top ?? nextLayer.top,
      }, ...prev]);
    } catch (error) {
      console.error("Failed to load image:", error);
      toast.error("Failed to load image. This may be due to CORS restrictions on the source website.");
    }
  };

  const applyMask = async (maskDataUrl: string, options: { left: number, top: number, scaleX: number, scaleY: number, angle: number, feather?: number }) => {
    if (!fabricJs.current) return;
    const activeObject = fabricJs.current.getActiveObject();
    if (!activeObject) {
      toast.error("Please select an element to mask first.");
      return;
    }

    try {
      const maskImage = await FabricImage.fromURL(maskDataUrl, { crossOrigin: "anonymous" });
      
      // In Fabric, the clipPath is relative to the object's transform.
      // Setting absolutePositioned: false ensures it stays locked to the object's local center.
      maskImage.set({
        left: options.left,
        top: options.top,
        scaleX: options.scaleX,
        scaleY: options.scaleY,
        angle: options.angle,
        originX: 'center',
        originY: 'center',
        absolutePositioned: false 
      });
      
      // Apply feathering if requested
      if (options.feather && options.feather > 0) {
        maskImage.filters = [new filters.Blur({ blur: options.feather / 100 })]; // Normalize feather to 0-1 range for Fabric Blur
        maskImage.applyFilters();
      }

      activeObject.set({
        clipPath: maskImage,
        dirty: true
      });

      fabricJs.current.requestRenderAll();
      saveHistory();
      toast.success("Mask applied successfully!");
      setMaskStudioOpen(false);
    } catch (err) {
      console.error("Mask applying error:", err);
      toast.error("Failed to apply mask.");
    }
  };

  const fileInserting = async (files: FileList) => {
    if (!files.length) return;
    const file = files[0];
    const assetId = await storeLocalAsset(file, file.name);
    const imageUrl = URL.createObjectURL(file);
    await addImageToCanvas(imageUrl, { assetId });
  };

  const insertImageFromUrl = async (url: string) => {
    await addImageToCanvas(url);
  };

  const insertShape = (shapeType: "rectangle" | "triangle" | "circle", partial: Partial<StateProps>) => {
    if (!fabricJs.current) return null;

    const shared = {
      width: partial.width ?? 200,
      height: partial.height ?? 200,
      top: partial.top ?? 100,
      left: partial.left ?? 100,
      id: generateLayerId("shape"),
      angle: partial.angle ?? 0,
      fill: partial.fill ?? "rgba(255, 0, 0, 0.5)",
      stroke: partial.stroke ?? "#f87171",
      strokeWidth: partial.strokeWidth ?? 2,
      layerlock: false,
    };

    let shape: FabricObject | null = null;
    if (shapeType === "rectangle") {
      shape = new Rect({
        id: shared.id,
        left: shared.left,
        top: shared.top,
        width: shared.width,
        height: shared.height,
        angle: shared.angle,
        fill: shared.fill,
        stroke: shared.stroke,
        strokeWidth: shared.strokeWidth,
        objectCaching: false,
        originX: "left",
        originY: "top",
      });
    }
    if (shapeType === "triangle") {
      shape = new Triangle({
        id: shared.id,
        left: shared.left,
        top: shared.top,
        width: shared.width,
        height: shared.height,
        angle: shared.angle,
        fill: shared.fill,
        stroke: shared.stroke,
        strokeWidth: shared.strokeWidth,
        objectCaching: false,
        originX: "left",
        originY: "top",
      });
    }
    if (shapeType === "circle") {
      shape = new Circle({
        id: shared.id,
        left: shared.left,
        top: shared.top,
        angle: shared.angle,
        fill: shared.fill,
        stroke: shared.stroke,
        strokeWidth: shared.strokeWidth,
        radius: Math.max((partial.width ?? 0) / 2, 1),
        originX: "center",
        originY: "center",
        objectCaching: false,
      });
    }
    if (!shape) return null;

    attachTransformListeners(shape);
    fabricJs.current.add(shape);
    shape.setCoords();
    setState((prev) => [{ ...shared, order: getMaxOrder() + 1, type: "shape" }, ...prev]);
    return shape;
  };

  const deleteLayer = (layerId: string) => {
    const target = fabricJs.current?.getObjects().find((object) => object.get("id") === layerId);
    setState((prev) => prev.filter((item) => item.id !== layerId));
    if (target) {
      fabricJs.current?.remove(target);
      renderCanvas();
    }
  };

  const copyLayer = async (layerId: string) => {
    if (!fabricJs.current) return;

    const target = fabricJs.current.getObjects().find((object) => object.get("id") === layerId);
    const stateLayer = state.find((item) => item.id === layerId);
    if (!target || !stateLayer) return;

    const cloned = await target.clone();
    const nextId = generateLayerId(String(target.type ?? "layer"));

    cloned.set({
      id: nextId,
      left: (target.left ?? 0) + 20,
      top: (target.top ?? 0) + 20,
    });

    attachTransformListeners(cloned);
    fabricJs.current.add(cloned);
    fabricJs.current.setActiveObject(cloned);
    renderCanvas();

    setState((prev) => [{
      ...stateLayer,
      id: nextId,
      order: getMaxOrder() + 1,
      top: (stateLayer.top ?? 0) + 20,
      left: (stateLayer.left ?? 0) + 20,
    }, ...prev]);
  };

  const lockLayer = (layerId: string) => {
    const object = fabricJs.current?.getObjects().find((item) => item.get("id") === layerId);
    if (!object) return;

    setState((prev) => prev.map((item) => {
      if (item.id !== layerId) return item;
      const nextLock = !item.layerlock;
      object.set({
        lockMovementX: nextLock,
        lockMovementY: nextLock,
        lockRotation: nextLock,
        lockScalingFlip: nextLock,
        lockScalingX: nextLock,
        lockScalingY: nextLock,
        lockSkewingX: nextLock,
        lockSkewingY: nextLock,
      });
      renderCanvas();
      return { ...item, layerlock: nextLock };
    }));
  };

  const copyLayerToPage = async (layerId: string, targetPageIndex: number) => {
    if (!fabricJs.current || targetPageIndex === activePageIndex) return;

    const targetObj = fabricJs.current.getObjects().find(o => o.get("id") === layerId);
    const layerData = state.find(l => l.id === layerId);
    if (!targetObj || !layerData) return;

    try {
      // 1. Clone the fabric object
      const clonedObj = await targetObj.clone();
      const newId = generateLayerId(String(targetObj.type ?? "layer"));
      clonedObj.set({ id: newId });

      // 2. Prepare the layer state
      const newLayerState = { ...layerData, id: newId };

      // 3. Inject into target page's JSON data
      setPages(prev => {
        const next = [...prev];
        const targetPage = next[targetPageIndex];
        
        // Deserialize target page data to add the new object
        // We use a temporary static canvas for this if targetPage.data exists
        const updatedData = { ...targetPage.data };
        if (!updatedData.objects) updatedData.objects = [];
        
        const objJson = clonedObj.toObject(['id', 'selectable', 'name', 'order', 'layerlock', 'originX', 'originY', 'visible', 'src']);
        updatedData.objects.push(objJson);

        next[targetPageIndex] = {
          ...targetPage,
          data: updatedData,
          layers: [...(targetPage.layers || []), newLayerState]
        };
        return next;
      });

      toast.success(`Copied to ${pages[targetPageIndex].name}`);
    } catch (err) {
      console.error("Copy to page error:", err);
      toast.error("Failed to copy layer to target page.");
    }
  };

  const bulkExportAsZip = async () => {
    if (!fabricJs.current || pagesRef.current.length === 0) return;

    const zip = new JSZip();
    const toastId = toast.loading("Generating ZIP with all elements...");

    try {
      // 1. Sync current page first to ensure latest changes are caught
      const allPages = syncCurrentPageToData();

      // 2. Process each page
      for (let pIdx = 0; pIdx < allPages.length; pIdx++) {
        const page = allPages[pIdx];
        const pageName = page.name || `Page ${pIdx + 1}`;
        const pageFolder = zip.folder(pageName);
        if (!pageFolder) continue;

        // Create a temporary off-screen canvas
        const tempCanvas = new StaticCanvas(undefined, {
          width: page.width || 1280,
          height: page.height || 720,
        });

        if (page.data) {
          await tempCanvas.loadFromJSON(page.data);
          const objects = tempCanvas.getObjects();

          // Export each object as a separate PNG
          for (let oIdx = 0; oIdx < objects.length; oIdx++) {
            const obj = objects[oIdx];
            
            // Get data URL for the individual object
            const dataUrl = obj.toDataURL({
              format: 'png',
              quality: 1,
              enableRetinaScaling: true
            });

            const base64Data = dataUrl.split(',')[1];
            const safeId = (obj.get('id') || `layer_${oIdx}`).replace(/[^a-z0-9]/gi, '_');
            const fileName = `${oIdx + 1}_${obj.type}_${safeId}.png`;
            pageFolder.file(fileName, base64Data, { base64: true });
          }
        }
        
        tempCanvas.dispose();
      }

      // 3. Generate ZIP and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${(currentProjectId || 'project').slice(0, 8)}_assets.zip`);
      toast.success("Bulk export complete!", { id: toastId });
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to generate bulk export.", { id: toastId });
    }
  };

  const exportCanvas = (options?: Partial<ExportCanvasOptions>) => {
    if (!fabricJs.current) return;

    const canvas = fabricJs.current;
    const canvasWidth = Math.max(canvas.getWidth(), 1);
    const canvasHeight = Math.max(canvas.getHeight(), 1);
    const widthMultiplier = canvasDimensions.width / canvasWidth;
    const heightMultiplier = canvasDimensions.height / canvasHeight;
    const baseMultiplier = Math.min(widthMultiplier, heightMultiplier);

    console.log("Export Debug:", {
      canvasDimensions,
      canvasWidth,
      canvasHeight,
      widthMultiplier,
      heightMultiplier,
      baseMultiplier
    });

    const resolvedFormat = options?.format ?? "png";
    const resolvedQuality = Math.min(Math.max(options?.quality ?? 1, 0.1), 1);
    const userMultiplier = options?.multiplier ?? 1;
    const resolvedMultiplier = userMultiplier * baseMultiplier;
    const resolvedRetinaScaling = options?.enableRetinaScaling ?? false;
    const extension = resolvedFormat === "jpeg" ? "jpg" : resolvedFormat;
    const resolvedFilename = (options?.filename?.trim() || "canvas-export").replace(/\.(png|jpg|jpeg|webp)$/i, "");

    const dataUrl = canvas.toDataURL({
      format: resolvedFormat,
      quality: resolvedQuality,
      multiplier: resolvedMultiplier,
      enableRetinaScaling: resolvedRetinaScaling,
    });

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${resolvedFilename}.${extension}`;
    anchor.click();
  };

  const selectingItem = (layerId: string) => {
    const canvas = fabricJs.current;
    if (!canvas) return;

    const object = canvas.getObjects().find((item) => item.get("id") === layerId);
    if (!object) return;

    setActiveId(layerId);
    setSelectedIds([layerId]);
    canvas.discardActiveObject();
    canvas.setActiveObject(object);
    object.set({ selectable: true, hasControls: true });
    object.setCoords();
    renderCanvas();
  };

  const deselectAll = () => {
    if (!fabricJs.current) return;
    fabricJs.current.discardActiveObject();
    fabricJs.current.requestRenderAll();
    setActiveId(null);
    setSelectedIds([]);
  };

  const aiImageFn = (blob: Blob) => {
    const file = new File([blob], `ai-image-${uuidv4()}.png`, { type: blob.type || "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInserting(transfer.files);
  };

  const uploadImageGemina = async (layerId: string) => {
    try {
      const source = fabricJs.current?.getObjects().find((object) => object.get("id") === layerId);
      if (!source) return;

      const clone = await source.clone();
      const tempCanvas = new StaticCanvas(undefined, {
        width: source.getScaledWidth(),
        height: source.getScaledHeight(),
      });

      clone.set({ left: 0, top: 0 });
      tempCanvas.add(clone);
      tempCanvas.renderAll();

      const blob = await tempCanvas.toBlob({ format: "png", multiplier: 1, enableRetinaScaling: true });
      if (!blob) return;

      const file = new File([blob], "image.png", { type: blob.type || "image/png" });
      const formData = new FormData();
      formData.set("file", file);

      setState((prev) => prev.map((item) => item.id === layerId ? ({ ...item, currentlyUploading: true }) : item));

      const response = await ApiEndpoint.FileUpload('/google-api-setup', {}, formData);
      const fileData = response.data;

      setError({ type: "success", message: "Uploaded Successfully" });
      setState((prev) => prev.map((item) => item.id === layerId ? ({ ...item, geminaUploadData: fileData, currentlyUploading: false }) : item));
    } catch (error) {
      setError({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong'
      });
    }
  };

  const checkingBox = (layerId: string, checked: boolean) => {
    setState((prev) => prev.map((item) => item.id === layerId ? ({ ...item, refrenceAiCheckBox: checked }) : item));
  };

  const showHideLayer = (layerId: string) => {
    const object = fabricJs.current?.getObjects().find((item) => item.get("id") === layerId);
    if (!object) return;

    object.set("visible", !object.visible);
    renderCanvas();
    setState((prev) => prev.map((item) => item.id === layerId ? ({ ...item, hideLayer: !object.visible }) : item));
  };

  const addTextLayer = () => {
    if (!fabricJs.current) return;
    setActiveTool("text");
    updateCanvasCursor("text");
    const canvas = fabricJs.current;

    const nextLayer: StateProps = {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Arial",
      width: 0,
      height: 0,
      angle: 0,
      id: generateLayerId("text"),
      type: "text",
      order: getMaxOrder() + 1,
      scale: 1,
    };

    const textbox = new Textbox("Hello", {
      editable: true,
      left: nextLayer.left,
      top: nextLayer.top,
      width: 220,
      fill: "#000000",
      fontSize: nextLayer.fontSize,
      fontFamily: nextLayer.fontFamily,
      angle: nextLayer.angle,
      originX: "left",
      originY: "top",
    });

    canvas.add(textbox);
    // ensure the fabric object has the same id as the layer state so selection/inspector can sync
    textbox.set({ id: nextLayer.id });
    textbox.setCoords();
    attachTransformListeners(textbox);
    canvas.setActiveObject(textbox);
    // update activeId so the ToolBox/Inspector shows text properties immediately
    setActiveId(nextLayer.id);
    canvas.requestRenderAll();
    setActiveTool("select");
    updateCanvasCursor("select");
    setState((prev) => [{
      ...nextLayer,
      left: textbox.left ?? nextLayer.left,
      top: textbox.top ?? nextLayer.top,
      width: textbox.width ?? nextLayer.width,
      height: textbox.height ?? nextLayer.height,
    }, ...prev]);
  };

  const onShapeClick = (type: string) => {
    if (!fabricJs.current) return;
    const canvas = fabricJs.current;
    const selectedTool = type as EditorTool;
    setActiveTool(selectedTool);
    updateCanvasCursor(selectedTool);

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let activeShape: FabricObject | null = null;

    clearTemporaryCanvasListeners();
    canvas.discardActiveObject();
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.requestRenderAll();

    if (type === "rectangle" || type === "triangle" || type === "circle") {
      registerTemporaryCanvasListener("mouse:down", (options: CanvasEvents["mouse:down"]) => {
        console.log("mouse down", { type });

        isDrawing = true;
        startX = options.scenePoint.x;
        startY = options.scenePoint.y;
        activeShape = insertShape(type as "rectangle" | "triangle" | "circle", {
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          fill: "rgba(255, 0, 0, 0.5)",
          stroke: "#f87171",
          strokeWidth: 2,
        });
      });

      registerTemporaryCanvasListener("mouse:move", (options: CanvasEvents["mouse:move"]) => {
        if (!activeShape || !isDrawing) return;
        const currentX = options.scenePoint.x;
        const currentY = options.scenePoint.y;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);

        if (type === "circle" && activeShape instanceof Circle) {
          const dx = currentX - startX;
          const dy = currentY - startY;
          const radius = Math.max(Math.sqrt(dx * dx + dy * dy) / 2, 1);
          activeShape.set({
            left: startX + dx / 2,
            top: startY + dy / 2,
            originX: "center",
            originY: "center",
            radius,
            fill: "rgba(255, 0, 0, 0.5)",
            stroke: "#f87171",
            strokeWidth: 2,
          });
        } else if (activeShape instanceof Rect || activeShape instanceof Triangle) {
          activeShape.set({
            left,
            top,
            width: Math.max(width, 1),
            height: Math.max(height, 1),
            originX: "left",
            originY: "top",
            fill: "rgba(255, 0, 0, 0.5)",
            stroke: "#f87171",
            strokeWidth: 2,
          });
        } else {
          activeShape.set({
            left,
            top,
            width: Math.max(width, 1),
            height: Math.max(height, 1),
            originX: "left",
            originY: "top",
          });
        }

        activeShape.set("dirty", true);
        activeShape.setCoords();
        canvas.requestRenderAll();
      });

      registerTemporaryCanvasListener("mouse:up", () => {
        console.log("mouse up");

        isDrawing = false;
        if (!activeShape) {
          resetToSelectMode();
          canvas.requestRenderAll();
          return;
        }

        const scaledWidth = activeShape.getScaledWidth();
        const scaledHeight = activeShape.getScaledHeight();

        if (scaledWidth < 8 || scaledHeight < 8) {
          const shapeId = activeShape.get("id");
          canvas.remove(activeShape);
          if (shapeId) {
            setState((prev) => prev.filter((item) => item.id !== shapeId));
          }
          activeShape = null;
          resetToSelectMode();
          canvas.requestRenderAll();
          return;
        }

        activeShape.setCoords();
        canvas.skipTargetFind = false;
        canvas.selection = true;
        canvas.setActiveObject(activeShape);
        syncObjectToState(activeShape);
        resetToSelectMode();
        canvas.requestRenderAll();
      });

      return;
    }

    if (type === "polyline") {
      const points: { x: number; y: number }[] = [];
      let polyline: Polyline | null = null;
      let tempLine: Line | null = null;
      let drawing = false;
      let finalized = false;
      const newId = generateLayerId("path");
      const normalizePoints = () => {
        if (points.length < 2) return points;

        const lastPoint = points[points.length - 1];
        const previousPoint = points[points.length - 2];
        const duplicateLastPoint =
          Math.abs(lastPoint.x - previousPoint.x) < 1 &&
          Math.abs(lastPoint.y - previousPoint.y) < 1;

        if (duplicateLastPoint) {
          points.pop();
        }

        return points;
      };
      const getStoredPoints = () => normalizePoints().map((point) => ({ x: point.x, y: point.y }));
      const removePreviewObjects = () => {
        if (polyline) {
          canvas.remove(polyline);
          polyline = null;
        }
        if (tempLine) {
          canvas.remove(tempLine);
          tempLine = null;
        }
      };
      const buildPreviewPolyline = () => {
        if (polyline) {
          canvas.remove(polyline);
        }
        if (points.length < 2) {
          polyline = null;
          return;
        }

        polyline = new Polyline(points, {
          stroke: "#ff4d4f",
          strokeWidth: 3,
          fill: "rgba(0,0,0,0)",
          selectable: false,
          evented: false,
          objectCaching: false,
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        canvas.add(polyline);
      };
      const finishPolyline = () => {
        if (finalized) return;
        finalized = true;
        drawing = false;
        const finalPoints = getStoredPoints();

        removePreviewObjects();

        if (finalPoints.length < 2) {
          resetToSelectMode();
          canvas.requestRenderAll();
          return;
        }

        const finalPolyline = new Polyline(finalPoints, {
          stroke: "#ff4d4f",
          strokeWidth: 3,
          fill: "rgba(0,0,0,0)",
          selectable: true,
          evented: true,
          hasBorders: true,
          hasControls: true,
          objectCaching: false,
          perPixelTargetFind: false,
          padding: 12,
          hoverCursor: "move",
          moveCursor: "move",
          id: newId,
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });

        canvas.add(finalPolyline);
        attachTransformListeners(finalPolyline);
        finalPolyline.setCoords();
        canvas.skipTargetFind = false;
        canvas.selection = true;
        canvas.setActiveObject(finalPolyline);

        setState((prev) => [{
          id: newId,
          left: finalPolyline.left ?? 0,
          top: finalPolyline.top ?? 0,
          width: Number(Math.round(finalPolyline.getScaledWidth()).toFixed(0)),
          height: Number(Math.round(finalPolyline.getScaledHeight()).toFixed(0)),
          angle: finalPolyline.angle ?? 0,
          fill: "transparent",
          stroke: "#ff4d4f",
          strokeWidth: 3,
          type: "polyline",
          order: getMaxOrder() + 1,
        }, ...prev]);

        resetToSelectMode();
        setActiveId(newId);
        canvas.setActiveObject(finalPolyline);
        canvas.requestRenderAll();
      };

      registerTemporaryCanvasListener("mouse:down", (options: CanvasEvents["mouse:down"]) => {
        const event = options.e as MouseEvent | undefined;
        if (event?.detail === 2) {
          finishPolyline();
          return;
        }

        const nextPoint = { x: options.scenePoint.x, y: options.scenePoint.y };
        points.push(nextPoint);
        if (points.length === 1) {
          drawing = true;
        }

        if (tempLine) {
          canvas.remove(tempLine);
          tempLine = null;
        }

        buildPreviewPolyline();
        canvas.requestRenderAll();
      });

      registerTemporaryCanvasListener("mouse:move", (options: CanvasEvents["mouse:move"]) => {
        if (!drawing || points.length === 0) return;
        const lastPoint = points[points.length - 1];
        if (tempLine) canvas.remove(tempLine);

        tempLine = new Line([lastPoint.x, lastPoint.y, options.scenePoint.x, options.scenePoint.y], {
          stroke: "#ff4d4f",
          strokeWidth: 3,
          selectable: false,
          evented: false,
          strokeDashArray: [5, 5],
          objectCaching: false,
          strokeLineCap: "round",
        });

        canvas.add(tempLine);
        canvas.requestRenderAll();
      });

      registerTemporaryCanvasListener("mouse:dblclick", () => {
        finishPolyline();
      });
      registerTemporaryNativeDblClick((event) => {
        event.preventDefault();
        event.stopPropagation();
        finishPolyline();
      });

      return;
    }

    if (type === "freeDrawing") {
      canvas.isDrawingMode = true;

      if (brushType === "spray") {
        canvas.freeDrawingBrush = new SprayBrush(canvas);
        (canvas.freeDrawingBrush as any).density = 20;
        (canvas.freeDrawingBrush as any).dotWidth = 2;
        (canvas.freeDrawingBrush as any).dotWidthVariance = 1;
      } else if (brushType === "pattern") {
        canvas.freeDrawingBrush = new PatternBrush(canvas);
        // Create a simple placeholder pattern for now
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = 10;
        const ctx = patternCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, 0, 5, 5);
          ctx.fillRect(5, 5, 5, 5);
        }
        (canvas.freeDrawingBrush as any).source = patternCanvas;
      } else if (brushType === "eraser") {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        (canvas.freeDrawingBrush as any).globalCompositeOperation = "destination-out";
      } else {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }

      if (!canvas.freeDrawingBrush) return;

      canvas.freeDrawingBrush.color = brushType === "eraser" ? "rgba(0,0,0,1)" : "#22c55e";
      canvas.freeDrawingBrush.width = brushType === "eraser" ? eraserSize : 10;

      registerTemporaryCanvasListener("path:created", (event: CanvasEvents["path:created"]) => {
        const path = event.path;
        if (!path) return;

        const newId = generateLayerId("path");
        path.set({ id: newId, fill: path.fill ?? "transparent" });
        attachTransformListeners(path);

        setState((prev) => [{
          id: newId,
          left: path.left ?? 0,
          top: path.top ?? 0,
          width: path.width ?? 0,
          height: path.height ?? 0,
          angle: path.angle ?? 0,
          fill: path.fill ?? "transparent",
          type: "freeDrawing",
          order: getMaxOrder() + 1,
        }, ...prev]);

        // Removed resetToSelectMode and selectingItem to keep user in drawing mode
      });
    }
  };

  const resizeCanvas = (mode: "ZoomIn" | "ZoomOut" | "intial", amount: number) => {
    if (mode === "ZoomIn") {
      setViewportScale((prev) => Number((prev + amount).toFixed(2)));
      return;
    }

    if (mode === "ZoomOut") {
      setViewportScale((prev) => Math.max(0.2, Number((prev - amount).toFixed(2))));
      return;
    }

    setViewportScale(amount);
  };

  return {
    activeId,
    activeTool,
    aiEdit,
    canvasDivRef,
    canvasRef,
    exportCanvas,
    fabricJs,
    fileInserting,
    addImageToCanvas,
    leftPanelOpen,
    layerMenu,
    onShapeClick,
    resizeCanvas,
    rightPanelOpen,
    selectingItem,
    setActiveId,
    setAiEdit,
    canvasDimensions,
    setCanvasDimensions,
    updateCanvasDimensions,
    deselectAll,
    setLayerMenu: setLayerMenu as Dispatch<SetStateAction<string>>,
    setLeftPanelOpen,
    setRightPanelOpen,
    setState,
    showHideLayer,
    somethingDrop,
    state,
    uploadImageGemina,
    viewportScale,
    addTextLayer,
    aiImageFn,
    checkingBox,
    copyLayer,
    deleteLayer,
    lockLayer,
    resetToSelectMode,
    insertImageFromUrl,
    eraserSize,
    setEraserSize,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    assets,
    addAsset,
    removeAsset,
    saveLayerAsAsset,
    customFonts,
    addCustomFont,
    fontLoading,
    maskStudioOpen,
    setMaskStudioOpen,
    applyMask,
    // New exports
    view,
    setView,
    loadProject,
    createNewProject,
    brushType,
    setBrushType,
    recentProjects,
    saveProject,
    currentProjectId,
    attachTransformListeners,
    saveHistory,
    selectedIds,
    setSelectedIds,
    assetSaveOpen,
    setAssetSaveOpen,
    assetSaveLayerId,
    setAssetSaveLayerId,
    confirmSaveAsset,
    copyLayerToPage,
    pages,
    activePageIndex,
    addPage,
    switchPage,
    deletePage,
    bulkExportAsZip,
  };
}
