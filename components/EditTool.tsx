"use client";

import {
  Canvas,
  CanvasEvents,
  Circle,
  FabricObject,
  Group,
  Line,
  Path,
  PencilBrush,
  Polygon,
  Polyline,
  Rect,
} from 'fabric';
import {
  CircleIcon,
  BrushCleaning,
  Crop,
  Download,
  Layers3,
  MousePointer2,
  PenTool,
  Square,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface EditToolProp {
  aiEditShowFn: React.Dispatch<React.SetStateAction<boolean>>;
  selectedId: string | null;
  fabricjs: React.MutableRefObject<Canvas | null>;
  aiImageFn: (file: Blob) => void;
}

type CropTool = "select" | "rectangle" | "circle" | "polygon" | "freeDraw";
type TemporaryCanvasEvent = "mouse:down" | "mouse:move" | "mouse:up" | "mouse:dblclick" | "path:created";
type TemporaryCanvasHandler = (event: CanvasEvents[TemporaryCanvasEvent]) => void;

const MASK_FILL = "rgba(34, 197, 94, 0.18)";
const MASK_STROKE = "#22c55e";

function EditTool({ aiEditShowFn, fabricjs, selectedId, aiImageFn }: EditToolProp) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const editCanvasRef = useRef<Canvas | null>(null);
  const sourceObjectRef = useRef<FabricObject | null>(null);
  const temporaryListenersRef = useRef<Partial<Record<TemporaryCanvasEvent, TemporaryCanvasHandler>>>({});
  const temporaryNativeDblClickRef = useRef<((event: MouseEvent) => void) | null>(null);

  const [activeTool, setActiveTool] = useState<CropTool>("select");
  const [maskCount, setMaskCount] = useState(0);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [sourceSummary, setSourceSummary] = useState({ width: 0, height: 0 });
  const [statusText, setStatusText] = useState("Choose a crop tool to start building your mask.");

  const generateId = (prefix: string) => `${prefix}_${uuidv4().split("-")[0]}`;

  const getMaskObjects = () =>
    editCanvasRef.current?.getObjects().filter((object) => object.get("editorRole") === "mask") ?? [];

  const updateMaskCount = () => {
    setMaskCount(getMaskObjects().length);
  };

  const setCanvasCursors = (tool: CropTool) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    if (tool === "select") {
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
      canvas.moveCursor = "move";
      canvas.freeDrawingCursor = "crosshair";
      return;
    }

    const nextCursor = "crosshair";
    canvas.defaultCursor = nextCursor;
    canvas.hoverCursor = nextCursor;
    canvas.moveCursor = nextCursor;
    canvas.freeDrawingCursor = nextCursor;
  };

  const registerTemporaryListener = <T extends TemporaryCanvasEvent>(
    eventName: T,
    handler: (event: CanvasEvents[T]) => void,
  ) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    const existingHandler = temporaryListenersRef.current[eventName];
    if (existingHandler) {
      canvas.off(eventName, existingHandler as (event: CanvasEvents[T]) => void);
    }

    temporaryListenersRef.current[eventName] = handler as TemporaryCanvasHandler;
    canvas.on(eventName, handler);
  };

  const registerNativeDoubleClick = (handler: (event: MouseEvent) => void) => {
    const upperCanvas = editCanvasRef.current?.upperCanvasEl;
    if (!upperCanvas) return;

    if (temporaryNativeDblClickRef.current) {
      upperCanvas.removeEventListener("dblclick", temporaryNativeDblClickRef.current);
    }

    temporaryNativeDblClickRef.current = handler;
    upperCanvas.addEventListener("dblclick", handler);
  };

  const clearTemporaryListeners = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    Object.entries(temporaryListenersRef.current).forEach(([eventName, handler]) => {
      if (!handler) return;
      canvas.off(eventName as TemporaryCanvasEvent, handler as TemporaryCanvasHandler);
    });

    if (temporaryNativeDblClickRef.current && canvas.upperCanvasEl) {
      canvas.upperCanvasEl.removeEventListener("dblclick", temporaryNativeDblClickRef.current);
    }

    temporaryListenersRef.current = {};
    temporaryNativeDblClickRef.current = null;
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.skipTargetFind = false;
  };

  const enterSelectMode = (message = "Move, resize, or refine the crop masks before exporting.") => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    clearTemporaryListeners();
    setActiveTool("select");
    setCanvasCursors("select");
    canvas.selection = true;
    canvas.skipTargetFind = false;
    canvas.requestRenderAll();
    setStatusText(message);
  };

  const prepareForDrawing = (tool: CropTool, message: string) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    clearTemporaryListeners();
    setActiveTool(tool);
    setCanvasCursors(tool);
    canvas.discardActiveObject();
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.requestRenderAll();
    setStatusText(message);
    setSelectedMaskId(null);
  };

  const createMaskOptions = (id: string) => ({
    id,
    editorRole: "mask",
    fill: MASK_FILL,
    stroke: MASK_STROKE,
    strokeWidth: 2,
    strokeDashArray: [8, 6],
    selectable: true,
    evented: true,
    hasBorders: true,
    hasControls: true,
    objectCaching: false,
    padding: 10,
    hoverCursor: "move",
    moveCursor: "move",
  });

  const closeFreeDrawPath = (path: Path) => {
    const nextCommands = [...path.path];
    const lastCommand = nextCommands[nextCommands.length - 1]?.[0];

    if (lastCommand !== "Z") {
      nextCommands.push(["Z"]);
    }

    path.set({
      path: nextCommands,
      fill: MASK_FILL,
      stroke: MASK_STROKE,
      strokeWidth: 2,
      strokeDashArray: undefined,
      objectCaching: false,
    });
    path.setCoords();
  };

  const startRectangleCrop = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    prepareForDrawing("rectangle", "Drag on the canvas to create a rectangular crop mask.");

    let drawing = false;
    let startX = 0;
    let startY = 0;
    let activeRect: Rect | null = null;

    registerTemporaryListener("mouse:down", (options: CanvasEvents["mouse:down"]) => {
      drawing = true;
      startX = options.scenePoint.x;
      startY = options.scenePoint.y;

      activeRect = new Rect({
        ...createMaskOptions(generateId("mask")),
        left: startX,
        top: startY,
        width: 0,
        height: 0,
      });

      canvas.add(activeRect);
    });

    registerTemporaryListener("mouse:move", (options: CanvasEvents["mouse:move"]) => {
      if (!drawing || !activeRect) return;

      const currentX = options.scenePoint.x;
      const currentY = options.scenePoint.y;
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      activeRect.set({
        left: Math.min(startX, currentX),
        top: Math.min(startY, currentY),
        width,
        height,
      });
      activeRect.setCoords();
      canvas.requestRenderAll();
    });

    registerTemporaryListener("mouse:up", () => {
      if (!drawing) return;
      drawing = false;

      if (!activeRect || (activeRect.width ?? 0) < 8 || (activeRect.height ?? 0) < 8) {
        if (activeRect) {
          canvas.remove(activeRect);
        }
        enterSelectMode("Rectangle mask was too small, so it was removed.");
        return;
      }

      activeRect.setCoords();
      canvas.setActiveObject(activeRect);
      updateMaskCount();
      setSelectedMaskId(String(activeRect.get("id")));
      enterSelectMode("Rectangle crop mask added.");
    });
  };

  const startCircleCrop = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    prepareForDrawing("circle", "Drag to place a circular crop mask.");

    let drawing = false;
    let startX = 0;
    let startY = 0;
    let activeCircle: Circle | null = null;

    registerTemporaryListener("mouse:down", (options: CanvasEvents["mouse:down"]) => {
      drawing = true;
      startX = options.scenePoint.x;
      startY = options.scenePoint.y;

      activeCircle = new Circle({
        ...createMaskOptions(generateId("mask")),
        radius: 0,
        left: startX,
        top: startY,
        originX: "center",
        originY: "center",
      });

      canvas.add(activeCircle);
    });

    registerTemporaryListener("mouse:move", (options: CanvasEvents["mouse:move"]) => {
      if (!drawing || !activeCircle) return;

      const currentX = options.scenePoint.x;
      const currentY = options.scenePoint.y;
      const size = Math.min(Math.abs(currentX - startX), Math.abs(currentY - startY));
      const directionX = currentX >= startX ? 1 : -1;
      const directionY = currentY >= startY ? 1 : -1;

      activeCircle.set({
        radius: size / 2,
        left: startX + directionX * (size / 2),
        top: startY + directionY * (size / 2),
      });
      activeCircle.setCoords();
      canvas.requestRenderAll();
    });

    registerTemporaryListener("mouse:up", () => {
      if (!drawing) return;
      drawing = false;

      if (!activeCircle || (activeCircle.radius ?? 0) < 6) {
        if (activeCircle) {
          canvas.remove(activeCircle);
        }
        enterSelectMode("Circle mask was too small, so it was removed.");
        return;
      }

      activeCircle.setCoords();
      canvas.setActiveObject(activeCircle);
      updateMaskCount();
      setSelectedMaskId(String(activeCircle.get("id")));
      enterSelectMode("Circular crop mask added.");
    });
  };

  const startPolygonCrop = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    prepareForDrawing("polygon", "Click to place points, then double-click to finish the polygon crop.");

    const points: { x: number; y: number }[] = [];
    let previewPolyline: Polyline | null = null;
    let previewGuide: Line | null = null;
    let finalized = false;

    const removePreview = () => {
      if (previewPolyline) {
        canvas.remove(previewPolyline);
        previewPolyline = null;
      }
      if (previewGuide) {
        canvas.remove(previewGuide);
        previewGuide = null;
      }
    };

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

    const buildPreviewPolyline = () => {
      if (previewPolyline) {
        canvas.remove(previewPolyline);
      }
      if (points.length < 2) {
        previewPolyline = null;
        return;
      }

      previewPolyline = new Polyline(points, {
        fill: "rgba(16, 185, 129, 0.10)",
        stroke: MASK_STROKE,
        strokeWidth: 2,
        strokeDashArray: [8, 6],
        selectable: false,
        evented: false,
        objectCaching: false,
        strokeLineCap: "round",
        strokeLineJoin: "round",
      });

      canvas.add(previewPolyline);
    };

    const finalizePolygon = () => {
      if (finalized) return;
      finalized = true;

      const finalPoints = normalizePoints().map((point) => ({ x: point.x, y: point.y }));
      removePreview();

      if (finalPoints.length < 3) {
        enterSelectMode("Polygon crop needs at least three points.");
        return;
      }

      const polygonMask = new Polygon(finalPoints, {
        ...createMaskOptions(generateId("mask")),
      });

      canvas.add(polygonMask);
      polygonMask.setCoords();
      canvas.setActiveObject(polygonMask);
      updateMaskCount();
      setSelectedMaskId(String(polygonMask.get("id")));
      enterSelectMode("Polygon crop mask added.");
    };

    registerTemporaryListener("mouse:down", (options: CanvasEvents["mouse:down"]) => {
      const event = options.e as MouseEvent | undefined;
      if (event?.detail === 2) {
        finalizePolygon();
        return;
      }

      points.push({ x: options.scenePoint.x, y: options.scenePoint.y });

      if (previewGuide) {
        canvas.remove(previewGuide);
        previewGuide = null;
      }

      buildPreviewPolyline();
      canvas.requestRenderAll();
    });

    registerTemporaryListener("mouse:move", (options: CanvasEvents["mouse:move"]) => {
      if (!points.length) return;
      const lastPoint = points[points.length - 1];

      if (previewGuide) {
        canvas.remove(previewGuide);
      }

      previewGuide = new Line([lastPoint.x, lastPoint.y, options.scenePoint.x, options.scenePoint.y], {
        stroke: MASK_STROKE,
        strokeWidth: 2,
        strokeDashArray: [6, 6],
        selectable: false,
        evented: false,
        objectCaching: false,
        strokeLineCap: "round",
      });

      canvas.add(previewGuide);
      canvas.requestRenderAll();
    });

    registerTemporaryListener("mouse:dblclick", () => {
      finalizePolygon();
    });

    registerNativeDoubleClick((event) => {
      event.preventDefault();
      event.stopPropagation();
      finalizePolygon();
    });
  };

  const startFreeDrawCrop = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    prepareForDrawing("freeDraw", "Draw a closed free-form loop. The area inside that loop will become the crop mask.");

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    if (!canvas.freeDrawingBrush) return;

    canvas.freeDrawingBrush.color = MASK_STROKE;
    canvas.freeDrawingBrush.width = 4;
    canvas.freeDrawingBrush.strokeLineCap = "round";
    canvas.freeDrawingBrush.strokeLineJoin = "round";

    registerTemporaryListener("path:created", (event: CanvasEvents["path:created"]) => {
      const path = event.path as Path | undefined;
      if (!path) return;

      const nextId = generateId("mask");
      closeFreeDrawPath(path);
      path.set({
        ...createMaskOptions(nextId),
        id: nextId,
      });
      path.setCoords();
      canvas.setActiveObject(path);
      updateMaskCount();
      setSelectedMaskId(nextId);
      canvas.requestRenderAll();
      setStatusText("Free-form crop mask added. The filled area inside your loop will be used for cropping.");
    });
  };

  const clearAllMasks = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    getMaskObjects().forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    updateMaskCount();
    setSelectedMaskId(null);
    enterSelectMode("All crop masks cleared.");
  };

  const removeSelectedMask = () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.get("editorRole") !== "mask") {
      setStatusText("Select a crop mask first, then remove it.");
      return;
    }

    canvas.remove(activeObject);
    canvas.discardActiveObject();
    updateMaskCount();
    setSelectedMaskId(null);
    enterSelectMode("Selected crop mask removed.");
  };

  const exportCroppedAsset = async () => {
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    const maskObjects = getMaskObjects();

    if (!canvas || !sourceObject) return;
    if (!maskObjects.length) {
      setStatusText("Add at least one crop mask before exporting.");
      return;
    }

    const bounds = maskObjects
      .map((object) => object.getBoundingRect())
      .reduce((acc, rect) => ({
        left: Math.min(acc.left, rect.left),
        top: Math.min(acc.top, rect.top),
        right: Math.max(acc.right, rect.left + rect.width),
        bottom: Math.max(acc.bottom, rect.top + rect.height),
      }), {
        left: Number.POSITIVE_INFINITY,
        top: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        bottom: Number.NEGATIVE_INFINITY,
      });

    const clipNodes = await Promise.all(maskObjects.map(async (object) => {
      const clone = await object.clone();
      const isPathMask = clone.type === "path";

      clone.set({
        fill: "#000000",
        stroke: isPathMask ? undefined : "#000000",
        strokeWidth: isPathMask ? 0 : 0,
        strokeDashArray: undefined,
        selectable: false,
        evented: false,
        absolutePositioned: true,
      });
      return clone;
    }));

    const clipPath = clipNodes.length === 1
      ? clipNodes[0]
      : new Group(clipNodes, { absolutePositioned: true });

    const previousBackground = canvas.backgroundColor;
    const previousClipPath = sourceObject.clipPath;

    maskObjects.forEach((object) => object.set("visible", false));
    sourceObject.clipPath = clipPath;
    canvas.backgroundColor = "transparent";
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const blob = await canvas.toBlob({
      format: "png",
      quality: 1,
      multiplier: 2,
      enableRetinaScaling: true,
      left: bounds.left,
      top: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      filter: (object) => object === sourceObject,
    });

    sourceObject.clipPath = previousClipPath;
    canvas.backgroundColor = previousBackground;
    maskObjects.forEach((object) => object.set("visible", true));
    canvas.requestRenderAll();

    if (!blob) {
      setStatusText("Export failed. Please try the crop again.");
      return;
    }

    aiImageFn(blob);
    aiEditShowFn(false);
  };

  useEffect(() => {
    let disposed = false;

    const initializeEditor = async () => {
      if (!canvasElementRef.current || !selectedId) return;

      const selectedObject = fabricjs.current?.getObjects().find((object) => object.get("id") === selectedId);
      if (!selectedObject) return;

      if (editCanvasRef.current) {
        await editCanvasRef.current.dispose();
        editCanvasRef.current = null;
      }

      const clone = await selectedObject.clone();
      if (disposed || !canvasElementRef.current) return;

      const sourceWidth = Math.max(1, clone.getScaledWidth());
      const sourceHeight = Math.max(1, clone.getScaledHeight());
      const maxStageWidth = Math.max(420, Math.min(window.innerWidth - 420, 980));
      const maxStageHeight = Math.max(320, Math.min(window.innerHeight - 240, 680));
      const fitScale = Math.min(
        (maxStageWidth - 80) / sourceWidth,
        (maxStageHeight - 80) / sourceHeight,
        1,
      );

      clone.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        scaleX: (clone.scaleX ?? 1) * fitScale,
        scaleY: (clone.scaleY ?? 1) * fitScale,
        selectable: false,
        evented: false,
        hoverCursor: "default",
      });

      const stageWidth = Math.max(360, Math.min(maxStageWidth, Math.ceil(clone.getScaledWidth() + 96)));
      const stageHeight = Math.max(280, Math.min(maxStageHeight, Math.ceil(clone.getScaledHeight() + 96)));

      const canvas = new Canvas(canvasElementRef.current, {
        width: stageWidth,
        height: stageHeight,
        backgroundColor: "#f8fafc",
        selection: true,
      });

      clone.set({
        left: (stageWidth - clone.getScaledWidth()) / 2,
        top: (stageHeight - clone.getScaledHeight()) / 2,
      });

      canvas.add(clone);
      clone.setCoords();
      canvas.requestRenderAll();

      sourceObjectRef.current = clone;
      editCanvasRef.current = canvas;
      setSourceSummary({
        width: Math.round(clone.getScaledWidth()),
        height: Math.round(clone.getScaledHeight()),
      });
      setCanvasReady(true);
      setMaskCount(0);
      setSelectedMaskId(null);

      setCanvasCursors("select");
      setStatusText("Choose a crop tool to start building your mask.");

      canvas.on("selection:created", (event) => {
        setSelectedMaskId(event.selected?.[0]?.get("editorRole") === "mask" ? String(event.selected[0].get("id")) : null);
      });
      canvas.on("selection:updated", (event) => {
        setSelectedMaskId(event.selected?.[0]?.get("editorRole") === "mask" ? String(event.selected[0].get("id")) : null);
      });
      canvas.on("selection:cleared", () => {
        setSelectedMaskId(null);
      });
    };

    initializeEditor();

    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete") return;

      const canvas = editCanvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (!activeObject || activeObject.get("editorRole") !== "mask") {
        return;
      }

      canvas.remove(activeObject);
      canvas.discardActiveObject();
      setMaskCount(canvas.getObjects().filter((object) => object.get("editorRole") === "mask").length);
      setSelectedMaskId(null);
      clearTemporaryListeners();
      setActiveTool("select");
      setCanvasCursors("select");
      canvas.selection = true;
      canvas.skipTargetFind = false;
      canvas.requestRenderAll();
      setStatusText("Selected crop mask removed.");
    };

    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      disposed = true;
      window.removeEventListener("keydown", handleDeleteKey);
      clearTemporaryListeners();
      if (editCanvasRef.current) {
        editCanvasRef.current.dispose().catch(() => undefined);
        editCanvasRef.current = null;
      }
      sourceObjectRef.current = null;
    };
  }, [fabricjs, selectedId]);

  const toolButtons = [
    {
      key: "select" as const,
      label: "Select",
      icon: MousePointer2,
      description: "Move and resize crop masks",
      onClick: () => enterSelectMode("Select masks to move, resize, or delete them."),
    },
    {
      key: "rectangle" as const,
      label: "Rectangle",
      icon: Square,
      description: "Drag a rectangular mask",
      onClick: startRectangleCrop,
    },
    {
      key: "circle" as const,
      label: "Circle",
      icon: CircleIcon,
      description: "Drag a circular mask",
      onClick: startCircleCrop,
    },
    {
      key: "polygon" as const,
      label: "Polygon",
      icon: PenTool,
      description: "Click points, double-click to finish",
      onClick: startPolygonCrop,
    },
    {
      key: "freeDraw" as const,
      label: "Free Draw",
      icon: BrushCleaning,
      description: "Paint a mask for detailed cropping",
      onClick: startFreeDrawCrop,
    },
  ];

  return (
    <div className='fixed inset-0 z-[70] bg-[#020617]/80 p-4 backdrop-blur-xl md:p-6'>
      <div className='mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#081221] text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]'>
        <div className='flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6'>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70'>Crop Studio</div>
            <h2 className='mt-2 text-2xl font-black text-white'>Refine Your Selection</h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-white/65'>
              Build one crop or combine rectangle, circle, and polygon masks together. Export merges every mask into one clean clipped result.
            </p>
          </div>

          <button
            type='button'
            onClick={() => aiEditShowFn(false)}
            className='inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10'
            aria-label='Close crop studio'
          >
            <X size={18} />
          </button>
        </div>

        <div className='grid flex-1 gap-0 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_320px]'>
          <aside className='border-b border-white/10 bg-[#09182b] p-5 lg:border-b-0 lg:border-r'>
            <div className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-2xl bg-cyan-400/15 p-3 text-cyan-100'>
                  <Crop size={18} />
                </div>
                <div>
                  <div className='text-sm font-semibold text-white'>Crop Tools</div>
                  <div className='text-xs text-white/60'>Switch tools any time while editing.</div>
                </div>
              </div>

              <div className='mt-4 grid gap-3'>
                {toolButtons.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.key}
                      type='button'
                      onClick={tool.onClick}
                      className={`rounded-2xl border p-3 text-left transition ${
                        activeTool === tool.key
                          ? 'border-cyan-300/60 bg-cyan-400/15 text-white'
                          : 'border-white/10 bg-[#081221] text-white/85 hover:bg-white/10'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='rounded-xl bg-white/5 p-2'>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className='text-sm font-semibold'>{tool.label}</div>
                          <div className='text-xs text-white/60'>{tool.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-2xl bg-emerald-400/15 p-3 text-emerald-100'>
                  <Layers3 size={18} />
                </div>
                <div>
                  <div className='text-sm font-semibold text-white'>Selection Summary</div>
                  <div className='text-xs text-white/60'>Current working object inside the crop stage.</div>
                </div>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-3'>
                <div className='rounded-2xl border border-white/10 bg-[#081221] p-3'>
                  <div className='text-xs uppercase tracking-[0.2em] text-white/45'>Width</div>
                  <div className='mt-2 text-lg font-bold text-white'>{sourceSummary.width}px</div>
                </div>
                <div className='rounded-2xl border border-white/10 bg-[#081221] p-3'>
                  <div className='text-xs uppercase tracking-[0.2em] text-white/45'>Height</div>
                  <div className='mt-2 text-lg font-bold text-white'>{sourceSummary.height}px</div>
                </div>
              </div>
            </div>
          </aside>

          <section className='flex min-h-[420px] flex-col bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_40%),linear-gradient(180deg,#0b1325_0%,#09111f_100%)]'>
            <div className='border-b border-white/10 px-5 py-4 md:px-6'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='rounded-full bg-white/8 px-4 py-2 text-sm text-white/80'>
                  {maskCount} crop mask{maskCount === 1 ? "" : "s"}
                </span>
                <span className='rounded-full bg-white/8 px-4 py-2 text-sm text-white/80'>
                  Active tool: {activeTool}
                </span>
                {selectedMaskId && (
                  <span className='rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100'>
                    Selected: {selectedMaskId}
                  </span>
                )}
              </div>
              <p className='mt-3 text-sm leading-6 text-white/65'>{statusText}</p>
            </div>

            <div className='flex flex-1 items-center justify-center p-4 md:p-6'>
              <div className='overflow-auto rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl'>
                <div className='rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-3'>
                  <canvas ref={canvasElementRef} className='block rounded-[20px] shadow-[0_18px_60px_rgba(0,0,0,0.35)]' />
                </div>
              </div>
            </div>
          </section>

          <aside className='border-t border-white/10 bg-[#09182b] p-5 lg:border-l lg:border-t-0'>
            <div className='rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-2xl bg-fuchsia-400/15 p-3 text-fuchsia-100'>
                  <WandSparkles size={18} />
                </div>
                <div>
                  <div className='text-sm font-semibold text-white'>Export Actions</div>
                  <div className='text-xs text-white/60'>Mixed crop masks are grouped together on export.</div>
                </div>
              </div>

              <div className='mt-4 grid gap-3'>
                <button
                  type='button'
                  onClick={removeSelectedMask}
                  disabled={!selectedMaskId}
                  className='inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45'
                >
                  <Trash2 size={16} />
                  Remove Selected Mask
                </button>

                <button
                  type='button'
                  onClick={clearAllMasks}
                  disabled={!maskCount}
                  className='inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#081221] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45'
                >
                  <Layers3 size={16} />
                  Clear All Masks
                </button>

                <button
                  type='button'
                  onClick={exportCroppedAsset}
                  disabled={!canvasReady}
                  className='inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-45'
                >
                  <Download size={16} />
                  Export Cropped Result
                </button>
              </div>
            </div>

            <div className='mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='text-sm font-semibold text-white'>How It Works</div>
              <div className='mt-3 space-y-3 text-sm leading-6 text-white/65'>
                <p>`Rectangle` and `Circle` are drag tools for fast mask placement.</p>
                <p>`Polygon` lets you click point-by-point, then double-click to close the crop area.</p>
                <p>Every mask you add is combined during export, so you can build complex grouped crops without losing control.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default EditTool;
