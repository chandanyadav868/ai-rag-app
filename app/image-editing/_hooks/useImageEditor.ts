"use client";

import { ApiEndpoint } from '@/app/(main)/classApi/apiClasses';
import { useContextStore } from '@/components/CreateContext';
import { aspectRatioImage } from '@/constant';
import { v4 as uuidv4 } from 'uuid';
import {
  Canvas,
  CanvasEvents,
  Circle,
  FabricImage,
  FabricObject,
  Line,
  PencilBrush,
  Point,
  Polyline,
  Rect,
  StaticCanvas,
  Textbox,
  Triangle,
} from 'fabric';
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

type PanelTab = "Layer" | "Property";
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

  const [activeId, setActiveId] = useState<string | null>(null);
  const [canvasOrientation, setCanvasOrientation] = useState<string | null>("16/9");
  const [somethingDrop, setSomethingDrop] = useState(false);
  const [aiEdit, setAiEdit] = useState(false);
  const [layerMenu, setLayerMenu] = useState<PanelTab>("Layer");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [viewportScale, setViewportScale] = useState(1);
  const [activeTool, setActiveTool] = useState<EditorTool>("select");

  const orientationConfig = useMemo(
    () => aspectRatioImage.find((item) => item.orientation === canvasOrientation),
    [canvasOrientation]
  );

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

  // This effect intentionally runs once to create and wire the Fabric canvas instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (canvasDivRef.current) {
      canvasDivRef.current.style.scale = String(viewportScale);
    }
  }, [viewportScale]);

  const syncObjectToState = (object: FabricObject) => {
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

  const fitCanvasToViewport = (nextOrientation: string | null) => {
    const config = aspectRatioImage.find((item) => item.orientation === nextOrientation);
    if (!config || !fabricJs.current) return;

    // Fit the Fabric canvas to the real available viewport instead of keeping the
    // source aspect dimensions like 1280x720 on first render.
    const desktop = window.innerWidth >= 1024;
    const availableWidth = desktop
      ? Math.max(320, Math.floor(window.innerWidth * 0.5) - 80)
      : Math.max(280, window.innerWidth - 32);
    const availableHeight = desktop
      ? Math.max(260, window.innerHeight - 190)
      : Math.max(240, window.innerHeight - 220);

    const widthRatio = availableWidth / config.width;
    const heightRatio = availableHeight / config.height;
    const fittedScale = Math.min(widthRatio, heightRatio);
    const fittedWidth = Math.max(240, Math.floor(config.width * fittedScale));
    const fittedHeight = Math.max(180, Math.floor(config.height * fittedScale));

    fabricJs.current.setDimensions({ width: fittedWidth, height: fittedHeight });
    fabricJs.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setViewportScale(1);
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

    fabricJs.current = new Canvas(canvasRef.current, {
      width: orientationConfig?.width,
      height: orientationConfig?.height,
      backgroundColor: "#ffffff",
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
      if (event.key !== "Delete" || !fabricJs.current) return;
      fabricJs.current.getActiveObjects().forEach((object) => {
        const id = object.get("id");
        if (id) {
          deleteLayer(id);
        }
      });
    };

    fabricJs.current.on("mouse:wheel", (opt) => {
      const event = opt.e as WheelEvent;
      event.preventDefault();
      event.stopPropagation();

      if (!fabricJs.current) return;

      let zoom = fabricJs.current.getZoom();
      zoom *= 0.999 ** event.deltaY;
      zoom = Math.min(Math.max(zoom, 0.1), 20);
      fabricJs.current.zoomToPoint(new Point(event.offsetX, event.offsetY), zoom);
      renderCanvas();
    });

    fabricJs.current.on("mouse:down", (opt) => {
      const event = opt.e as MouseEvent;
      if (event.altKey || event.button === 1) {
        isDragging = true;
        fabricJs.current!.selection = false;
        lastPosX = event.clientX;
        lastPosY = event.clientY;
        fabricJs.current!.setCursor('grab');
      }
    });

    fabricJs.current.on("mouse:move", (opt) => {
      if (!isDragging || !fabricJs.current) return;
      const event = opt.e as MouseEvent;
      const viewportTransform = fabricJs.current.viewportTransform;
      if (!viewportTransform) return;

      viewportTransform[4] += event.clientX - lastPosX;
      viewportTransform[5] += event.clientY - lastPosY;
      lastPosX = event.clientX;
      lastPosY = event.clientY;
      renderCanvas();
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

      const rect = canvasRef.current?.getBoundingClientRect();
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

      let zoom = fabricJs.current.getZoom();
      zoom *= currentDistance / lastDistance;
      zoom = Math.min(Math.max(zoom, 0.1), 20);

      fabricJs.current.zoomToPoint(
        new Point(rect ? centerX - rect.left : centerX, rect ? centerY - rect.top : centerY),
        zoom
      );

      lastDistance = currentDistance;
      renderCanvas();
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

    fitCanvasToViewport(canvasOrientation);

    return () => {
      window.removeEventListener("dragover", dropOverImage);
      window.removeEventListener("drop", dropImage);
      window.removeEventListener("keydown", deletingObj);
      canvasElement.removeEventListener("touchstart", handleTouchStart);
      canvasElement.removeEventListener("touchmove", handleTouchMove);
      canvasElement.removeEventListener("touchend", handleTouchEnd);
      setState([]);
      fabricJs.current?.dispose();
      fabricJs.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fitCanvasToViewport(canvasOrientation);
  }, [canvasOrientation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => {
      fitCanvasToViewport(canvasOrientation);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasOrientation]); // eslint-disable-line react-hooks/exhaustive-deps

  const fileInserting = async (files: FileList) => {
    if (!fabricJs.current || !files.length) return;
    setActiveTool("image");
    updateCanvasCursor("image");

    const canvas = fabricJs.current;
    const imageUrl = URL.createObjectURL(files[0]);
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
    };

    image.set({
      id: nextLayer.id,
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

  const exportCanvas = (options?: Partial<ExportCanvasOptions>) => {
    if (!fabricJs.current || !orientationConfig) return;

    const canvas = fabricJs.current;
    const canvasWidth = Math.max(canvas.getWidth(), 1);
    const canvasHeight = Math.max(canvas.getHeight(), 1);
    const widthMultiplier = orientationConfig.width / canvasWidth;
    const heightMultiplier = orientationConfig.height / canvasHeight;
    const baseMultiplier = Math.max(1, Math.min(widthMultiplier, heightMultiplier));
    const resolvedFormat = options?.format ?? "png";
    const resolvedQuality = Math.min(Math.max(options?.quality ?? 1, 0.1), 1);
    const resolvedMultiplier = Math.max(options?.multiplier ?? baseMultiplier, 0.1);
    const resolvedRetinaScaling = options?.enableRetinaScaling ?? true;
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
    canvas.discardActiveObject();
    canvas.setActiveObject(object);
    object.set({ selectable: true, hasControls: true });
    object.setCoords();
    renderCanvas();
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
        console.log("mouse down",{type});
        
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
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      if (!canvas.freeDrawingBrush) return;

      canvas.freeDrawingBrush.color = "#22c55e";
      canvas.freeDrawingBrush.width = 5;

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

        resetToSelectMode();
        selectingItem(newId);
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
    canvasOrientation,
    canvasRef,
    exportCanvas,
    fabricJs,
    fileInserting,
    leftPanelOpen,
    layerMenu,
    onShapeClick,
    resizeCanvas,
    rightPanelOpen,
    selectingItem,
    setActiveId,
    setAiEdit,
    setCanvasOrientation,
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
  };
}
