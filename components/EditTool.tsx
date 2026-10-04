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
  filters,
  FabricImage,
  StaticCanvas,
} from 'fabric';
import {
  CircleIcon,
  Brush,
  Crop,
  Download,
  Layers3,
  MousePointer2,
  PenTool,
  Plus,
  Minus,
  Square,
  Trash2,
  WandSparkles,
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid3X3,
  Check,
  Layers,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface EditToolProp {
  aiEditShowFn: React.Dispatch<React.SetStateAction<boolean>>;
  selectedId: string | null;
  fabricjs: React.MutableRefObject<Canvas | null>;
  aiImageFn: (file: Blob) => void;
  onReplaceLayer?: (file: Blob) => void;
}

type CropTool = "select" | "rectangle" | "circle" | "polygon" | "freeDraw";
type TemporaryCanvasEvent = "mouse:down" | "mouse:move" | "mouse:up" | "mouse:dblclick" | "path:created";
type TemporaryCanvasHandler = (event: CanvasEvents[TemporaryCanvasEvent]) => void;

const MASK_FILL = "rgba(34, 197, 94, 0.18)";
const MASK_STROKE = "#22c55e";

function EditTool({ aiEditShowFn, fabricjs, selectedId, aiImageFn, onReplaceLayer }: EditToolProp) {
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
  const [statusText, setStatusText] = useState("Choose a crop tool or aspect ratio to refine your crop.");
  const [viewportScale, setViewportScale] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feather, setFeather] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState<string>("free");
  const [showGrid, setShowGrid] = useState(true);
  const [cropDimensions, setCropDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ASPECT_RATIOS = [
    { label: "Free", value: null, key: "free" },
    { label: "1:1", value: 1, key: "1:1" },
    { label: "16:9", value: 16 / 9, key: "16:9" },
    { label: "9:16", value: 9 / 16, key: "9:16" },
    { label: "4:3", value: 4 / 3, key: "4:3" },
    { label: "4:5", value: 4 / 5, key: "4:5" },
    { label: "3:2", value: 3 / 2, key: "3:2" },
  ];

  const updateZoom = (mode: "ZoomIn" | "ZoomOut" | "Initial", amount = 0.1) => {
    setViewportScale((prev) => {
      if (mode === "ZoomIn") return Number((prev + amount).toFixed(2));
      if (mode === "ZoomOut") return Math.max(0.1, Number((prev - amount).toFixed(2)));
      return 1;
    });
  };

  const applyAspectRatio = (ratioKey: string, ratioVal: number | null) => {
    setSelectedRatio(ratioKey);
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    if (!canvas || !sourceObject) return;

    // Clear existing masks
    getMaskObjects().forEach((m) => canvas.remove(m));

    const srcW = sourceObject.getScaledWidth();
    const srcH = sourceObject.getScaledHeight();

    let targetW = srcW * 0.85;
    let targetH = srcH * 0.85;

    if (ratioVal !== null) {
      if (srcW / srcH > ratioVal) {
        targetH = srcH * 0.85;
        targetW = targetH * ratioVal;
      } else {
        targetW = srcW * 0.85;
        targetH = targetW / ratioVal;
      }
    }

    const rect = new Rect({
      left: Math.max(0, (srcW - targetW) / 2),
      top: Math.max(0, (srcH - targetH) / 2),
      width: targetW,
      height: targetH,
      fill: MASK_FILL,
      stroke: MASK_STROKE,
      strokeWidth: 2,
      rx: borderRadius,
      ry: borderRadius,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#8b5cf6',
      cornerSize: 12,
      cornerStyle: 'circle',
      transparentCorners: false,
      lockUniScaling: ratioVal !== null,
    });

    (rect as any).set("editorRole", "mask");
    const nextId = generateId("mask_rect");
    (rect as any).set("id", nextId);
    (rect as any).targetRatio = ratioVal;

    canvas.add(rect);
    canvas.setActiveObject(rect);
    updateMaskCount();
    setSelectedMaskId(nextId);
    setCropDimensions({ width: Math.round(targetW), height: Math.round(targetH) });
    canvas.requestRenderAll();
    enterSelectMode(`Aspect ratio set to ${ratioKey}.`);
  };

  const rotateImage = (degrees: number) => {
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    if (!canvas || !sourceObject) return;

    const currentAngle = (sourceObject.angle || 0) + degrees;
    sourceObject.set({ angle: currentAngle });
    sourceObject.setCoords();
    canvas.requestRenderAll();
    setStatusText(`Rotated ${degrees > 0 ? '+90°' : '-90°'}.`);
  };

  const flipImage = (axis: 'x' | 'y') => {
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    if (!canvas || !sourceObject) return;

    if (axis === 'x') {
      sourceObject.set({ flipX: !sourceObject.flipX });
    } else {
      sourceObject.set({ flipY: !sourceObject.flipY });
    }
    sourceObject.setCoords();
    canvas.requestRenderAll();
    setStatusText(`Flipped ${axis === 'x' ? 'horizontally' : 'vertically'}.`);
  };

  const resetTransforms = () => {
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    if (!canvas || !sourceObject) return;

    sourceObject.set({ angle: 0, flipX: false, flipY: false });
    sourceObject.setCoords();
    canvas.requestRenderAll();
    setStatusText("Transforms reset to default.");
  };

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

  const exportCroppedAsset = async (mode: 'replace' | 'new' = 'replace') => {
    const canvas = editCanvasRef.current;
    const sourceObject = sourceObjectRef.current;
    let maskObjects = getMaskObjects();

    if (!canvas || !sourceObject) return;
    setIsExporting(true);

    let temporaryMaskCreated = false;
    if (!maskObjects.length) {
      const srcW = sourceObject.getScaledWidth();
      const srcH = sourceObject.getScaledHeight();
      const defaultRect = new Rect({
        left: 0,
        top: 0,
        width: srcW,
        height: srcH,
        fill: MASK_FILL,
        stroke: MASK_STROKE,
        selectable: false,
      });
      (defaultRect as any).set("editorRole", "mask");
      canvas.add(defaultRect);
      maskObjects = [defaultRect];
      temporaryMaskCreated = true;
    }

    try {
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

      // Apply feathering to the clipPath
      if (feather > 0) {
        const clipCanvas = new StaticCanvas(undefined, {
          width: canvas.width,
          height: canvas.height,
        });
        clipCanvas.add(clipPath);
        clipCanvas.renderAll();
        
        const clipDataUrl = clipCanvas.toDataURL();
        const clipImage = await FabricImage.fromURL(clipDataUrl);
        clipImage.set({ absolutePositioned: true });
        clipImage.filters = [new filters.Blur({ blur: feather / 100 })];
        clipImage.applyFilters();
        
        sourceObject.clipPath = clipImage;
      } else {
        sourceObject.clipPath = clipPath;
      }
      canvas.backgroundColor = "transparent";
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      const cropLeft = Math.max(0, bounds.left);
      const cropTop = Math.max(0, bounds.top);
      const cropWidth = Math.max(1, bounds.right - bounds.left);
      const cropHeight = Math.max(1, bounds.bottom - bounds.top);

      const blob = await canvas.toBlob({
        format: "png",
        quality: 1,
        multiplier: 1,
        enableRetinaScaling: false,
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
        filter: (object) => object === sourceObject,
      });

      sourceObject.clipPath = previousClipPath;
      canvas.backgroundColor = previousBackground;
      maskObjects.forEach((object) => object.set("visible", true));
      if (temporaryMaskCreated) {
        maskObjects.forEach((m) => canvas.remove(m));
      }
      canvas.requestRenderAll();

      if (!blob) {
        setStatusText("Export failed. Please try the crop again.");
        return;
      }

      if (mode === 'replace' && onReplaceLayer) {
        onReplaceLayer(blob);
      } else {
        aiImageFn(blob);
      }
      aiEditShowFn(false);
    } catch (err) {
      console.error("Crop export error:", err);
      setStatusText("Failed to export cropped image.");
    } finally {
      setIsExporting(false);
    }
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

      // Determine the maximum available space for the crop stage
      const maxStageWidth = window.innerWidth - 80; // Full width minus small margin
      const maxStageHeight = window.innerHeight - 150;

      const fitScale = Math.min(
        (maxStageWidth) / sourceWidth,
        (maxStageHeight) / sourceHeight,
        1,
      );

      clone.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
        hoverCursor: "default",
      });

      // Apply premium selection styling matching user request
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

      const canvas = new Canvas(canvasElementRef.current, {
        width: sourceWidth,
        height: sourceHeight,
        backgroundColor: "#0f172a",
        selection: true,
      });

      // Enforce custom premium styling matching user request
      canvas.on("object:added", (e) => {
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

        if (obj.controls) {
          ['tl', 'tr', 'bl', 'br'].forEach(key => {
            if (obj.controls[key]) (obj.controls[key] as any).cornerStyle = 'circle';
          });
          ['mt', 'mb', 'ml', 'mr'].forEach(key => {
            if (obj.controls[key]) (obj.controls[key] as any).cornerStyle = 'rect';
          });
        }
      });

      canvas.add(clone);
      clone.setCoords();
      canvas.requestRenderAll();

      sourceObjectRef.current = clone;
      editCanvasRef.current = canvas;
      setSourceSummary({
        width: Math.round(sourceWidth),
        height: Math.round(sourceHeight),
      });
      setViewportScale(fitScale);
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

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        updateZoom(delta > 0 ? "ZoomIn" : "ZoomOut", Math.abs(delta));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      disposed = true;
      window.removeEventListener("keydown", handleDeleteKey);
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
      clearTemporaryListeners();
      if (editCanvasRef.current) {
        editCanvasRef.current.dispose().catch(() => undefined);
        editCanvasRef.current = null;
      }
      sourceObjectRef.current = null;
    };
  }, [fabricjs, selectedId]);
  
  // Real-time preview of feathering using shadow
  useEffect(() => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    
    const masks = getMaskObjects();
    masks.forEach(mask => {
      if (feather > 0) {
        mask.set('shadow', {
          color: MASK_STROKE,
          blur: feather,
          offsetX: 0,
          offsetY: 0,
          nonScaling: true
        });
      } else {
        mask.set('shadow', null);
      }
    });
    canvas.requestRenderAll();
  }, [feather]);

  // Update corner radius for rectangle masks
  useEffect(() => {
    const canvas = editCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== 'rect' || activeObject.get('editorRole') !== 'mask') return;

    activeObject.set({
      rx: borderRadius,
      ry: borderRadius
    });
    canvas?.requestRenderAll();
  }, [borderRadius]);

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
      icon: Brush,
      description: "Paint a mask for detailed cropping",
      onClick: startFreeDrawCrop,
    },
  ];

  return (
    <div className='fixed inset-0 z-[70] bg-[#020617]/80 p-4 backdrop-blur-xl md:p-6'>
      <div className='mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#081221] text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]'>
        <div className='flex items-center justify-between flex-wrap gap-4 border-b border-white/10 px-5 py-3 md:px-8'>
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Crop size={20} />
            </div>
            <div className="min-w-0">
              <div className='flex items-center gap-2'>
                <span className='text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-cyan-400'>Crop Studio</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-mono text-white/60">
                  {cropDimensions.width || sourceSummary.width} × {cropDimensions.height || sourceSummary.height} px
                </span>
              </div>
              <p className='text-xs text-white/40 truncate'>{statusText}</p>
            </div>
          </div>

          {/* Aspect Ratio Selector Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-black/30 p-1 rounded-2xl border border-white/5">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.key}
                type="button"
                onClick={() => applyAspectRatio(ratio.key, ratio.value)}
                className={`rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  selectedRatio === ratio.key
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type='button'
              onClick={() => aiEditShowFn(false)}
              className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white'
              aria-label='Close crop studio'
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className='relative flex-1 overflow-hidden flex flex-col'>
          {/* Open Sidebar Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className='absolute left-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#09182b]/90 text-white shadow-2xl backdrop-blur-xl transition-all hover:bg-cyan-500 hover:text-black animate-in fade-in zoom-in duration-300'
              title="Open Crop Tools"
            >
              <Crop size={18} />
            </button>
          )}

          {/* Floating Sidebar */}
          <aside className={`absolute left-4 top-4 md:left-6 md:top-6 z-40 w-16 md:w-20 rounded-[24px] md:rounded-[32px] border border-white/10 bg-[#09182b]/95 p-2 md:p-4 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            <div className='flex flex-col items-center gap-2 md:gap-3'>
              <button
                onClick={() => setSidebarOpen(false)}
                className='p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all'
              >
                <X size={16} />
              </button>

              <div className='w-full h-px bg-white/10 my-0.5' />

              {toolButtons.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.key}
                    type='button'
                    onClick={() => {
                      tool.onClick();
                    }}
                    title={tool.label}
                    className={`group relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl border transition-all duration-300 ${activeTool === tool.key
                      ? 'border-cyan-300/60 bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Icon size={18} />
                    {activeTool === tool.key && (
                      <div className="absolute -right-1.5 md:-right-2 top-1/2 -translate-y-1/2 w-1 h-5 md:h-6 bg-cyan-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className='flex flex-1 flex-col bg-[#050c17]'>
            {/* Top Toolbar */}
            <div className='border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 bg-[#09182b]/50 backdrop-blur-md'>
              {/* Image Transforms: Rotate, Flip, Grid */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
                  <button
                    onClick={() => rotateImage(-90)}
                    title="Rotate 90° CCW"
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={() => rotateImage(90)}
                    title="Rotate 90° CW"
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                  >
                    <RotateCw size={15} />
                  </button>
                  <div className="w-px h-3.5 bg-white/10 mx-1" />
                  <button
                    onClick={() => flipImage('x')}
                    title="Flip Horizontal"
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                  >
                    <FlipHorizontal size={15} />
                  </button>
                  <button
                    onClick={() => flipImage('y')}
                    title="Flip Vertical"
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                  >
                    <FlipVertical size={15} />
                  </button>
                  <div className="w-px h-3.5 bg-white/10 mx-1" />
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    title={showGrid ? "Hide Rule-of-Thirds Grid" : "Show Rule-of-Thirds Grid"}
                    className={`p-1.5 rounded-lg transition ${showGrid ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Grid3X3 size={15} />
                  </button>
                  <button
                    onClick={resetTransforms}
                    title="Reset Rotation & Flip"
                    className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Mobile/Tablet Aspect Ratio pills dropdown */}
                <div className="lg:hidden flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
                  <select
                    value={selectedRatio}
                    onChange={(e) => {
                      const found = ASPECT_RATIOS.find(r => r.key === e.target.value);
                      if (found) applyAspectRatio(found.key, found.value);
                    }}
                    className="bg-transparent text-[10px] font-bold uppercase text-white/70 outline-none px-2 py-1 cursor-pointer"
                  >
                    {ASPECT_RATIOS.map(r => (
                      <option key={r.key} value={r.key} className="bg-[#09182b] text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sliders & Zoom */}
              <div className='flex items-center gap-3 md:gap-4 flex-wrap'>
                <div className='flex items-center gap-2 bg-black/20 rounded-xl p-1 px-3 border border-white/5'>
                  <button onClick={() => updateZoom("ZoomOut")} className='p-1.5 text-white/40 hover:text-white transition'><Minus size={14} /></button>
                  <span className='min-w-[2.5rem] text-center text-[11px] font-black text-cyan-400 tabular-nums'>{Math.round(viewportScale * 100)}%</span>
                  <button onClick={() => updateZoom("ZoomIn")} className='p-1.5 text-white/40 hover:text-white transition'><Plus size={14} /></button>
                  <button onClick={() => updateZoom("Initial")} title="Reset Zoom" className='p-1 text-white/30 hover:text-white transition ml-1'><Maximize2 size={12} /></button>
                </div>

                {selectedMaskId && (
                  <>
                    <div className='flex items-center gap-2 md:gap-3 bg-black/20 rounded-xl py-1 px-3 border border-white/5'>
                      <span className='text-[9px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap'>Feather</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={feather}
                        onChange={(e) => setFeather(parseInt(e.target.value))}
                        className="w-16 md:w-20 h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                      />
                      <span className='min-w-[1.2rem] text-[10px] font-mono text-cyan-400'>{feather}</span>
                    </div>

                    <div className='flex items-center gap-2 md:gap-3 bg-black/20 rounded-xl py-1 px-3 border border-white/5'>
                      <span className='text-[9px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap'>Radius</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={borderRadius}
                        onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                        className="w-16 md:w-20 h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                      />
                      <span className='min-w-[1.2rem] text-[10px] font-mono text-cyan-400'>{borderRadius}</span>
                    </div>
                  </>
                )}

                {/* Mask Actions & Export */}
                <div className='flex items-center gap-2 flex-wrap'>
                  {selectedMaskId && (
                    <button
                      onClick={removeSelectedMask}
                      className='h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold uppercase tracking-wider transition'
                    >
                      Delete
                    </button>
                  )}
                  {maskCount > 0 && (
                    <button
                      onClick={clearAllMasks}
                      className='h-8 px-2.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider transition'
                    >
                      Clear
                    </button>
                  )}

                  {onReplaceLayer && (
                    <button
                      onClick={() => exportCroppedAsset('replace')}
                      disabled={!canvasReady || isExporting}
                      className='h-9 px-4 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50'
                    >
                      <Check size={14} />
                      <span>{isExporting ? 'Applying...' : 'Apply Crop'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => exportCroppedAsset('new')}
                    disabled={!canvasReady || isExporting}
                    className='h-9 px-3.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50'
                    title="Add as new layer to canvas"
                  >
                    <Layers size={13} />
                    <span>New Layer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Stage */}
            <div ref={containerRef} className='flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]'>
              <div className='absolute inset-0 flex items-center justify-center p-0'>
                <div
                  style={{
                    transform: `scale(${viewportScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out'
                  }}
                  className='relative'
                >
                  <canvas ref={canvasElementRef} className='block shadow-[0_64px_128px_rgba(0,0,0,0.8)]' />

                  {/* Composition Rule-of-Thirds Grid Overlay */}
                  {showGrid && (
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
                      <div className="border-r border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-b border-white/15" />
                      <div className="border-r border-white/15" />
                      <div className="border-r border-white/15" />
                      <div />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Help Bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#09182b]/80 px-4 py-1.5 backdrop-blur-xl text-[9px] font-bold uppercase tracking-wider text-white/40 shadow-xl">
                  <span>[Del] Delete mask</span>
                  <span>•</span>
                  <span>[Space+Drag] Pan</span>
                  <span>•</span>
                  <span>[Ctrl+Wheel] Zoom</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default EditTool;
