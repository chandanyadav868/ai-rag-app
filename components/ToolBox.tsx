"use client";

import { BLEND_MODES, FontFamily, FontStyle, FontWeight, TextAlign } from '@/constant';
import {
  ChevronLeft,
  ChevronRight,
  BringToFront,
  FlipHorizontal2,
  FlipVertical2,
  Group as GroupIcon,
  ImageIcon,
  PenLine,
  SendToBack,
  SlidersHorizontal,
  StepBack,
  StepForward,
  Type,
  Ungroup as UngroupIcon,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  filters,
  Gradient,
  Group,
  Path,
  PencilBrush,
  Polyline,
  Rect,
  Shadow,
  SprayBrush,
  PatternBrush,
  Textbox,
  Triangle,
} from 'fabric';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { loadGoogleFont } from '@/lib/googleFonts';
import { v4 as uuidv4 } from 'uuid';

interface ToolBoxProp {
  fabricJs: React.MutableRefObject<Canvas | null>;
  setState: Dispatch<SetStateAction<StateProps[]>>;
  selectedId: string | null;
  state: StateProps[];
  activeTool?: string;
  brushType?: string;
  setBrushType?: (val: any) => void;
  eraserSize?: number;
  setEraserSize?: (val: number) => void;
  shapeDesignDiv?: (selectedId: string, { }: Record<string, string | number>) => void;
  shapePosition?: (selectedId: string, type: PositionProps) => void;
  customFonts?: { name: string, data: string }[];
  addCustomFont?: (file: File) => void;
  fontLoading?: boolean;
  attachTransformListeners?: (obj: FabricObject) => void;
}

type InspectorKind = "none" | "text" | "image" | "shape" | "polyline" | "freeDrawing";

interface InspectorState {
  id: string;
  type: string;
  kind: InspectorKind;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fontWeight: string;
  textAlign: TextAlignProps;
  charSpacing: number;
  lineHeight: number;
  rx: number;
  ry: number;
  skewX: number;
  skewY: number;
  flipX: boolean;
  flipY: boolean;
  originX: string;
  originY: string;
  cropX: number;
  cropY: number;
  globalCompositeOperation: BlendMode;
  Blur: number;
  Noise: number;
  Blocksize: number;
  Brightness: number;
  Contrast: number;
  Saturation: number;
  Vibrance: number;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowColor: string;
  gradientEnabled: boolean;
  gradientType: "linear" | "radial";
  gradientAngle: number;
  gradientColor1: string;
  gradientColor2: string;
  paintFirst: "fill" | "stroke";
  strokeDashArray: number;
  brushColor: string;
  brushWidth: number;
  sprayDensity: number;
  sprayDotWidth: number;
}

const EMPTY_INSPECTOR: InspectorState = {
  id: "",
  type: "",
  kind: "none",
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  angle: 0,
  opacity: 1,
  fill: "#22c55e",
  stroke: "#0f172a",
  strokeWidth: 0,
  backgroundColor: "#ffffff",
  fontFamily: "Arial",
  fontSize: 24,
  fontStyle: "normal",
  fontWeight: "400",
  textAlign: "left",
  charSpacing: 0,
  lineHeight: 1.16,
  rx: 0,
  ry: 0,
  skewX: 0,
  skewY: 0,
  flipX: false,
  flipY: false,
  originX: "left",
  originY: "top",
  cropX: 0,
  cropY: 0,
  globalCompositeOperation: "normal",
  Blur: 0,
  Noise: 0,
  Blocksize: 0,
  Brightness: 0,
  Contrast: 0,
  Saturation: 0,
  Vibrance: 0,
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowColor: "#000000",
  gradientEnabled: false,
  gradientType: "linear",
  gradientAngle: 0,
  gradientColor1: "#ffffff",
  gradientColor2: "#000000",
  paintFirst: "fill",
  strokeDashArray: 0,
  brushColor: "#22c55e",
  brushWidth: 10,
  sprayDensity: 20,
  sprayDotWidth: 2,
};

const COLOR_FALLBACKS = {
  fill: "#22c55e",
  stroke: "#0f172a",
  background: "#ffffff",
};

const normalizeColor = (value: unknown, fallback: string) => {
  if (typeof value === "string" && /^#([0-9a-f]{3,8})$/i.test(value)) {
    return value.length >= 7 ? value.slice(0, 7) : value;
  }
  return fallback;
};

const denormalizeBlendMode = (value: unknown): BlendMode => {
  if (!value || value === "source-over") return "normal";
  return value as BlendMode;
};

const normalizeBlendMode = (value: BlendMode): GlobalCompositeOperation | undefined => {
  if (value === "normal") return undefined;
  return value as GlobalCompositeOperation;
};

const getFilterValue = (image: FabricImage, type: string, key: string) => {
  const targetFilter = image.filters?.find((item) => item?.type === type) as Record<string, unknown> | undefined;
  const value = targetFilter?.[key];
  return typeof value === "number" ? value : 0;
};

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const snapToStep = (value: number, min: number, step: number) => {
  if (!Number.isFinite(value)) return min;
  if (step <= 0) return value;
  const snapped = Math.round((value - min) / step) * step + min;
  const precision = step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
  return Number(snapped.toFixed(precision));
};

function ToolBox({ selectedId, fabricJs, state, setState, activeTool, brushType, setBrushType, eraserSize, setEraserSize, customFonts, addCustomFont, fontLoading, attachTransformListeners }: ToolBoxProp) {
  const [activeItem, setActiveItem] = useState<InspectorState>(EMPTY_INSPECTOR);

  const getSelectedObject = () => {
    if (!selectedId) return null;
    return fabricJs.current?.getObjects().find((object) => object.get("id") === selectedId) ?? null;
  };

  const getInspectorKind = (object: FabricObject | null, item: StateProps | null): InspectorKind => {
    if (!object && !item) return "none";
    if (object instanceof Textbox || item?.type === "text") return "text";
    if (object instanceof FabricImage || item?.type === "image") return "image";
    if (object instanceof Polyline || item?.type === "polyline") return "polyline";
    if (object instanceof Path || item?.type === "freeDrawing") return "freeDrawing";
    if (object instanceof Rect || object instanceof Circle || object instanceof Triangle || item?.type === "shape") return "shape";
    return "none";
  };

  const syncInspector = useCallback(() => {
    if (!selectedId) {
      setActiveItem(prev => ({
        ...EMPTY_INSPECTOR,
        brushColor: prev.brushColor,
        brushWidth: prev.brushWidth,
        sprayDensity: prev.sprayDensity,
        sprayDotWidth: prev.sprayDotWidth,
      }));
      return;
    }

    const selectedObject = fabricJs.current?.getObjects().find((object) => object.get("id") === selectedId) ?? null;
    const selectedState = state.find((item) => item.id === selectedId) ?? null;

    if (!selectedObject || !selectedState) {
      setActiveItem(prev => ({
        ...EMPTY_INSPECTOR,
        brushColor: prev.brushColor,
        brushWidth: prev.brushWidth,
        sprayDensity: prev.sprayDensity,
        sprayDotWidth: prev.sprayDotWidth,
      }));
      return;
    }

    const kind = getInspectorKind(selectedObject, selectedState);

    setActiveItem({
      id: selectedState.id,
      type: selectedState.type,
      kind,
      left: Math.round(selectedObject.left ?? selectedState.left ?? 0),
      top: Math.round(selectedObject.top ?? selectedState.top ?? 0),
      width: Math.round(selectedObject.getScaledWidth()),
      height: Math.round(selectedObject.getScaledHeight()),
      angle: Number((selectedObject.angle ?? selectedState.angle ?? 0).toFixed(1)),
      opacity: Number(((selectedObject.opacity ?? 1)).toFixed(2)),
      fill: normalizeColor(selectedObject.get("fill"), normalizeColor(selectedState.fill, COLOR_FALLBACKS.fill)),
      stroke: normalizeColor(selectedObject.get("stroke"), normalizeColor(selectedState.stroke, COLOR_FALLBACKS.stroke)),
      strokeWidth: Number(selectedObject.get("strokeWidth") ?? selectedState.strokeWidth ?? 0),
      backgroundColor: normalizeColor(selectedObject.get("backgroundColor"), normalizeColor(selectedState.backgroundColor, COLOR_FALLBACKS.background)),
      fontFamily: selectedObject.get("fontFamily") ?? selectedState.fontFamily ?? "Arial",
      fontSize: Number(selectedObject.get("fontSize") ?? selectedState.fontSize ?? 24),
      fontStyle: selectedObject.get("fontStyle") ?? selectedState.fontStyle ?? "normal",
      fontWeight: String(selectedObject.get("fontWeight") ?? selectedState.fontWeight ?? "400"),
      textAlign: (selectedObject.get("textAlign") ?? selectedState.textAlign ?? "left") as TextAlignProps,
      charSpacing: Number(selectedObject.get("charSpacing") ?? selectedState.charSpacing ?? 0),
      lineHeight: Number(selectedObject.get("lineHeight") ?? selectedState.lineHeight ?? 1.16),
      rx: Number(selectedObject.get("rx") ?? selectedState.rx ?? 0),
      ry: Number(selectedObject.get("ry") ?? selectedState.ry ?? 0),
      skewX: Number(selectedObject.get("skewX") ?? selectedState.skewX ?? 0),
      skewY: Number(selectedObject.get("skewY") ?? selectedState.skewY ?? 0),
      flipX: Boolean(selectedObject.get("flipX") ?? selectedState.flipX),
      flipY: Boolean(selectedObject.get("flipY") ?? selectedState.flipY),
      originX: selectedObject.get("originX") ?? "left",
      originY: selectedObject.get("originY") ?? "top",
      cropX: Number(selectedObject.get("cropX") ?? selectedState.cropX ?? 0),
      cropY: Number(selectedObject.get("cropY") ?? selectedState.cropY ?? 0),
      globalCompositeOperation: denormalizeBlendMode(selectedObject.get("globalCompositeOperation") ?? selectedState.globalCompositeOperation),
      Blur: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Blur", "blur") : Number(selectedState.Blur ?? 0),
      Noise: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Noise", "noise") : Number(selectedState.Noise ?? 0),
      Blocksize: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Pixelate", "blocksize") : Number(selectedState.Blocksize ?? 0),
      Brightness: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Brightness", "brightness") : Number(selectedState.Brightness ?? 0),
      Contrast: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Contrast", "contrast") : Number(selectedState.Contrast ?? 0),
      Saturation: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Saturation", "saturation") : Number(selectedState.Saturation ?? 0),
      Vibrance: selectedObject instanceof FabricImage ? getFilterValue(selectedObject, "Vibrance", "vibrance") : Number(selectedState.Vibrance ?? 0),
      shadowBlur: (selectedObject.shadow as any)?.blur ?? 0,
      shadowOffsetX: (selectedObject.shadow as any)?.offsetX ?? 0,
      shadowOffsetY: (selectedObject.shadow as any)?.offsetY ?? 0,
      shadowColor: (selectedObject.shadow as any)?.color ?? "#000000",
      gradientEnabled: selectedObject.fill instanceof Gradient,
      gradientType: (selectedObject.fill as any)?.type ?? "linear",
      gradientAngle: 0, // Simplified for now
      gradientColor1: (selectedObject.fill as any)?.colorStops?.[0]?.color ?? "#ffffff",
      gradientColor2: (selectedObject.fill as any)?.colorStops?.[1]?.color ?? "#000000",
      paintFirst: (selectedObject as any).paintFirst ?? "fill",
      strokeDashArray: (selectedObject as any).strokeDashArray?.[0] ?? 0,
      brushColor: (fabricJs.current?.freeDrawingBrush?.color) ?? "#22c55e",
      brushWidth: (fabricJs.current?.freeDrawingBrush?.width) ?? 10,
      sprayDensity: (fabricJs.current?.freeDrawingBrush as any)?.density ?? 20,
      sprayDotWidth: (fabricJs.current?.freeDrawingBrush as any)?.dotWidth ?? 2,
    });
  }, [selectedId, state, fabricJs, activeTool]);

  useEffect(() => {
    syncInspector();
  }, [syncInspector]);

  const updateStatePatch = (delta: Partial<StateProps>) => {
    if (!selectedId) return;
    setState((prev) => prev.map((item) => item.id === selectedId ? ({ ...item, ...delta }) : item));
  };

  const updateImageFilter = (image: FabricImage, key: keyof Pick<InspectorState, "Blur" | "Noise" | "Blocksize" | "Brightness" | "Contrast" | "Saturation" | "Vibrance">, value: number) => {
    const filterType = key === "Blocksize" ? "Pixelate" : key;
    const propKey = key === "Blocksize"
      ? "blocksize"
      : key === "Blur"
        ? "blur"
        : key.toLowerCase();

    const existingFilter = image.filters?.find((item) => item?.type === filterType) as Record<string, unknown> | undefined;
    if (!image.filters) {
      image.filters = [];
    }

    if (!existingFilter) {
      const nextFilter =
        key === "Blur" ? new filters.Blur({ blur: value }) :
          key === "Noise" ? new filters.Noise({ noise: value }) :
            key === "Blocksize" ? new filters.Pixelate({ blocksize: value }) :
              key === "Brightness" ? new filters.Brightness({ brightness: value }) :
                key === "Contrast" ? new filters.Contrast({ contrast: value }) :
                  key === "Saturation" ? new filters.Saturation({ saturation: value }) :
                    new filters.Vibrance({ vibrance: value });

      image.filters.push(nextFilter);
    } else {
      existingFilter[propKey] = value;
    }

    image.applyFilters();
  };

  const applyChanges = (
    delta: Partial<InspectorState>,
    options?: {
      width?: number;
      height?: number;
      imageFilter?: keyof Pick<InspectorState, "Blur" | "Noise" | "Blocksize" | "Brightness" | "Contrast" | "Saturation" | "Vibrance">;
    },
  ) => {
    const object = getSelectedObject();
    if (!object || !selectedId) return;

    const nextStatePatch: Partial<StateProps> = {};

    if (delta.left !== undefined) {
      object.set("left", delta.left);
      nextStatePatch.left = delta.left;
    }
    if (delta.top !== undefined) {
      object.set("top", delta.top);
      nextStatePatch.top = delta.top;
    }
    if (delta.angle !== undefined) {
      object.set("angle", delta.angle);
      nextStatePatch.angle = delta.angle;
    }
    if (delta.opacity !== undefined) {
      object.set("opacity", delta.opacity);
    }
    if (delta.fill !== undefined && activeItem.kind !== "image") {
      object.set("fill", delta.fill);
      nextStatePatch.fill = delta.fill;
    }
    if (delta.stroke !== undefined) {
      object.set("stroke", delta.stroke);
      nextStatePatch.stroke = delta.stroke;
    }
    if (delta.strokeWidth !== undefined) {
      object.set("strokeWidth", delta.strokeWidth);
      nextStatePatch.strokeWidth = delta.strokeWidth;
    }
    if (delta.skewX !== undefined) {
      object.set("skewX", delta.skewX);
      nextStatePatch.skewX = delta.skewX;
    }
    if (delta.skewY !== undefined) {
      object.set("skewY", delta.skewY);
      nextStatePatch.skewY = delta.skewY;
    }

    // Shadow handling
    if (delta.shadowBlur !== undefined || delta.shadowOffsetX !== undefined || delta.shadowOffsetY !== undefined || delta.shadowColor !== undefined) {
      const s = {
        blur: delta.shadowBlur ?? activeItem.shadowBlur,
        offsetX: delta.shadowOffsetX ?? activeItem.shadowOffsetX,
        offsetY: delta.shadowOffsetY ?? activeItem.shadowOffsetY,
        color: delta.shadowColor ?? activeItem.shadowColor,
      };
      object.set("shadow", new Shadow(s));
    }

    // Gradient handling
    if (delta.gradientEnabled !== undefined || delta.gradientColor1 !== undefined || delta.gradientColor2 !== undefined || delta.gradientType !== undefined) {
      const enabled = delta.gradientEnabled ?? activeItem.gradientEnabled;
      if (enabled) {
        const type = delta.gradientType ?? activeItem.gradientType;
        const c1 = delta.gradientColor1 ?? activeItem.gradientColor1;
        const c2 = delta.gradientColor2 ?? activeItem.gradientColor2;

        const w = object.width ?? 100;
        const h = object.height ?? 100;

        const grad = new Gradient({
          type,
          coords: type === "linear" ? { x1: 0, y1: 0, x2: w, y2: 0 } : { r1: 0, r2: w / 2, x1: w / 2, y1: h / 2, x2: w / 2, y2: h / 2 },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        object.set("fill", grad);
      } else {
        object.set("fill", activeItem.fill);
      }
    }

    if (delta.paintFirst !== undefined) {
      object.set("paintFirst", delta.paintFirst);
    }
    if (delta.strokeDashArray !== undefined) {
      object.set("strokeDashArray", delta.strokeDashArray > 0 ? [delta.strokeDashArray, delta.strokeDashArray] : null);
    }
    if (delta.backgroundColor !== undefined && activeItem.kind === "text") {
      object.set("backgroundColor", delta.backgroundColor);
      nextStatePatch.backgroundColor = delta.backgroundColor;
    }
    if (delta.fontFamily !== undefined && object instanceof Textbox) {
      object.set("fontFamily", delta.fontFamily);
      nextStatePatch.fontFamily = delta.fontFamily;
    }
    if (delta.fontSize !== undefined && object instanceof Textbox) {
      object.set("fontSize", delta.fontSize);
      nextStatePatch.fontSize = delta.fontSize;
    }
    if (delta.fontStyle !== undefined && object instanceof Textbox) {
      object.set("fontStyle", delta.fontStyle);
      nextStatePatch.fontStyle = delta.fontStyle;
    }
    if (delta.fontWeight !== undefined && object instanceof Textbox) {
      object.set("fontWeight", delta.fontWeight);
      nextStatePatch.fontWeight = delta.fontWeight;
    }
    if (delta.textAlign !== undefined && object instanceof Textbox) {
      object.set("textAlign", delta.textAlign);
      nextStatePatch.textAlign = delta.textAlign;
    }
    if (delta.charSpacing !== undefined && object instanceof Textbox) {
      object.set("charSpacing", delta.charSpacing);
      nextStatePatch.charSpacing = delta.charSpacing;
    }
    if (delta.lineHeight !== undefined && object instanceof Textbox) {
      object.set("lineHeight", delta.lineHeight);
      nextStatePatch.lineHeight = delta.lineHeight;
    }
    if (delta.rx !== undefined && object instanceof Rect) {
      object.set("rx", delta.rx);
      object.set("ry", delta.ry ?? delta.rx);
      nextStatePatch.rx = delta.rx;
      nextStatePatch.ry = delta.ry ?? delta.rx;
    }
    if (delta.ry !== undefined && object instanceof Rect) {
      object.set("ry", delta.ry);
      nextStatePatch.ry = delta.ry;
    }
    if (delta.skewX !== undefined) {
      object.set("skewX", delta.skewX);
      nextStatePatch.skewX = delta.skewX;
    }
    if (delta.skewY !== undefined) {
      object.set("skewY", delta.skewY);
      nextStatePatch.skewY = delta.skewY;
    }
    if (delta.flipX !== undefined) {
      object.set("flipX", delta.flipX);
      nextStatePatch.flipX = delta.flipX;
    }
    if (delta.flipY !== undefined) {
      object.set("flipY", delta.flipY);
      nextStatePatch.flipY = delta.flipY;
    }
    if (delta.globalCompositeOperation !== undefined) {
      object.set("globalCompositeOperation", normalizeBlendMode(delta.globalCompositeOperation));
      nextStatePatch.globalCompositeOperation = delta.globalCompositeOperation;
    }
    if (delta.cropX !== undefined && object instanceof FabricImage) {
      object.set("cropX", delta.cropX);
      nextStatePatch.cropX = delta.cropX;
    }
    if (delta.cropY !== undefined && object instanceof FabricImage) {
      object.set("cropY", delta.cropY);
      nextStatePatch.cropY = delta.cropY;
    }

    if (options?.width !== undefined) {
      if (object instanceof Textbox) {
        object.set("width", options.width);
      } else if (object.width) {
        object.set("scaleX", Math.max(options.width / object.width, 0.01));
      }
      nextStatePatch.width = options.width;
    }

    if (options?.height !== undefined) {
      if (!(object instanceof Textbox) && object.height) {
        object.set("scaleY", Math.max(options.height / object.height, 0.01));
        nextStatePatch.height = options.height;
      }
    }

    if (options?.imageFilter && object instanceof FabricImage) {
      const nextValue = delta[options.imageFilter] as number;
      updateImageFilter(object, options.imageFilter, nextValue);
      nextStatePatch[options.imageFilter === "Blocksize" ? "Blocksize" : options.imageFilter] = nextValue as never;
    }

    object.setCoords();
    fabricJs.current?.requestRenderAll();
    updateStatePatch(nextStatePatch);
    syncInspector();
  };

  const groupObjects = () => {
    if (!fabricJs.current) return;
    const activeObject = fabricJs.current.getActiveObject();
    
    if (!activeObject || (activeObject.type !== 'activeSelection' && activeObject.type !== 'activeselection')) {
      return;
    }

    const selection = activeObject as any;
    const objects = selection.getObjects();
    const ids = objects.map((obj: any) => obj.get("id")).filter(Boolean);
    
    // Convert selection to group
    const group = selection.toGroup();
    const newId = `group_${uuidv4().split('-')[0]}`;
    group.set({
      id: newId,
      type: "group",
      selectable: true,
      hasControls: true
    });
    
    // Re-attach listeners to the group
    if (attachTransformListeners) attachTransformListeners(group);

    // Update state
    setState(prev => {
      const filtered = prev.filter(item => !ids.includes(item.id));
      const groupState: StateProps = {
        id: newId,
        type: "group" as any,
        left: group.left ?? 0,
        top: group.top ?? 0,
        width: Math.round(group.getScaledWidth()),
        height: Math.round(group.getScaledHeight()),
        angle: group.angle ?? 0,
        fill: "transparent",
        order: Math.max(...prev.map(i => i.order), 0) + 1,
        layerlock: false,
      };
      return [groupState, ...filtered];
    });

    fabricJs.current.setActiveObject(group);
    fabricJs.current.requestRenderAll();
    syncInspector();
  };

  const ungroupObjects = () => {
    if (!fabricJs.current) return;
    const activeObject = fabricJs.current.getActiveObject();
    if (!activeObject || (activeObject as any).type !== 'group') return;

    const group = activeObject as any;
    const groupId = group.get("id");
    const objects = group.getObjects();
    
    const activeSelection = group.toActiveSelection();
    
    // Update state
    setState(prev => {
      const filtered = prev.filter(item => item.id !== groupId);
      const newStates = objects.map((obj: any) => {
        if (attachTransformListeners) attachTransformListeners(obj);
        return {
          id: obj.get("id") || `obj_${Math.random().toString(36).substr(2, 9)}`,
          type: obj.type === "textbox" ? "text" : (obj.type === "image" ? "image" : "shape"),
          left: obj.left ?? 0,
          top: obj.top ?? 0,
          width: Math.round(obj.getScaledWidth()),
          height: Math.round(obj.getScaledHeight()),
          angle: obj.angle ?? 0,
          fill: obj.fill,
          order: Math.max(...prev.map(i => i.order), 0) + 1,
        };
      });
      return [...newStates, ...filtered];
    });

    fabricJs.current.setActiveObject(activeSelection);
    fabricJs.current.requestRenderAll();
    syncInspector();
  };

  const changeOrigin = (originX: string, originY: string) => {
    const object = getSelectedObject();
    if (!object || !selectedId) return;

    // Get the current center point of the object in world coordinates
    const center = object.getCenterPoint();

    // Set new origins
    object.set({ originX: originX as any, originY: originY as any });

    // Adjust position so the object doesn't jump
    object.setPositionByOrigin(center, "center", "center");

    object.setCoords();
    fabricJs.current?.requestRenderAll();
    syncInspector();
  };

  const moveLayer = (direction: PositionProps) => {
    const object = getSelectedObject();
    if (!object) return;

    if (direction === "bringFront") fabricJs.current?.bringObjectToFront(object);
    if (direction === "sendBack") fabricJs.current?.sendObjectToBack(object);
    if (direction === "bringForward") fabricJs.current?.bringObjectForward(object);
    if (direction === "sendBackward") fabricJs.current?.sendObjectBackwards(object);

    fabricJs.current?.requestRenderAll();
  };

  const isText = activeItem.kind === "text";
  const isImage = activeItem.kind === "image";
  const isShape = activeItem.kind === "shape";
  const isPolyline = activeItem.kind === "polyline";
  const isFreeDrawing = activeItem.kind === "freeDrawing";
  const isStrokeOnly = isPolyline || isFreeDrawing;
  const isPath = isPolyline || isFreeDrawing;

  const applyBrushChanges = (delta: { color?: string; width?: number; density?: number; dotWidth?: number }) => {
    if (!fabricJs.current || !fabricJs.current.isDrawingMode) return;
    const brush = fabricJs.current.freeDrawingBrush;
    if (!brush) return;

    if (delta.color) brush.color = delta.color;
    if (delta.width) brush.width = delta.width;

    if (brush instanceof SprayBrush) {
      if (delta.density) (brush as any).density = delta.density;
      if (delta.dotWidth) (brush as any).dotWidth = delta.dotWidth;
    }

    setActiveItem(prev => ({
      ...prev,
      brushColor: delta.color ?? prev.brushColor,
      brushWidth: delta.width ?? prev.brushWidth,
      sprayDensity: delta.density ?? prev.sprayDensity,
      sprayDotWidth: delta.dotWidth ?? prev.sprayDotWidth,
    }));
  };

  if (!selectedId && activeTool !== "freeDrawing") {
    return (
      <div className='rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center'>
        <div className='text-sm font-semibold text-white'>No active selection</div>
        <div className='mt-2 text-sm leading-6 text-white/60'>
          Select a text layer, image, shape, polyline, or free-draw path to edit its properties here.
        </div>
      </div>
    );
  }

  return (
    <div className='historyScrollbar flex max-h-[calc(100vh-220px)] flex-col gap-4 overflow-y-auto pr-1'>
      <PanelSection title="Quick Actions" subtitle="Cluster management and stack control.">
        <div className='grid grid-cols-2 gap-3'>
          <ActionButton
            icon={<GroupIcon size={16} />}
            label="Group"
            onClick={groupObjects}
          />
          <ActionButton
            icon={<UngroupIcon size={16} />}
            label="Ungroup"
            onClick={ungroupObjects}
          />
          <ActionButton
            icon={<BringToFront size={16} />}
            label="Bring Front"
            onClick={() => moveLayer("bringFront")}
          />
          <ActionButton
            icon={<SendToBack size={16} />}
            label="Send Back"
            onClick={() => moveLayer("sendBack")}
          />
        </div>
      </PanelSection>

      <div className='rounded-3xl border border-white/10 bg-[#081221] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70'>{selectedId ? "Selected" : "Active Tool"}</div>
            <div className='mt-2 text-lg font-bold text-white'>{selectedId || activeTool?.toUpperCase()}</div>
            <div className='mt-1 text-xs uppercase tracking-[0.22em] text-white/45'>{selectedId ? activeItem.kind : (activeTool === "freeDrawing" ? brushType : "none")}</div>
          </div>
          <div className='rounded-2xl bg-cyan-400/15 p-3 text-cyan-100'>
            {isText ? <Type size={18} /> : isImage ? <ImageIcon size={18} /> : isStrokeOnly ? <PenLine size={18} /> : <SlidersHorizontal size={18} />}
          </div>
        </div>
      </div>

      {activeTool === "freeDrawing" && (
        <PanelSection title="Brush Settings" subtitle="Configure your active drawing tool.">
          <div className='space-y-4'>
            <div className='flex flex-col gap-4'>
              <SelectField
                label="Brush Type"
                value={brushType ?? "pencil"}
                options={[{ label: "Pencil", value: "pencil" }, { label: "Spray", value: "spray" }, { label: "Pattern", value: "pattern" }, { label: "Eraser", value: "eraser" }]}
                onChange={(val) => setBrushType?.(val)}
              />
              {brushType !== "eraser" && (
                <ColorField label="Brush Color" value={activeItem.brushColor} onChange={(val) => applyBrushChanges({ color: val })} />
              )}
            </div>

            {brushType !== "eraser" && (
              <RangeField label="Brush Width" value={activeItem.brushWidth} min={1} max={100} step={1} onChange={(val) => applyBrushChanges({ width: val })} />
            )}

            {brushType === "spray" && (
              <div className='space-y-4 rounded-2xl border border-white/10 bg-white/5 p-3'>
                <RangeField label="Spray Density" value={activeItem.sprayDensity} min={1} max={100} step={1} onChange={(val) => applyBrushChanges({ density: val })} />
                <RangeField label="Dot Width" value={activeItem.sprayDotWidth} min={1} max={20} step={1} onChange={(val) => applyBrushChanges({ dotWidth: val })} />
              </div>
            )}

            {brushType === "pattern" && (
              <div className='rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-200/80'>
                Pattern brush uses a procedural fill. Colors are currently preset for optimized canvas performance.
              </div>
            )}

            {brushType === "eraser" && (
              <div className='space-y-4'>
                <div className='rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3 text-[11px] text-fuchsia-200/80'>
                  Eraser removes content from the canvas. Use the size slider below to adjust precision.
                </div>
                <RangeField
                  label="Eraser Size"
                  value={eraserSize || 20}
                  min={1}
                  max={200}
                  step={1}
                  onChange={(val) => setEraserSize?.(val)}
                />
              </div>
            )}
          </div>
        </PanelSection>
      )}

      {selectedId && (
        <>
          <PanelSection title="Transform" subtitle="Placement, size, rotation, and visibility.">
            <RangeField label="Position X" value={activeItem.left} min={-1000} max={2000} step={1} onChange={(value) => applyChanges({ left: value })} />
            <RangeField label="Position Y" value={activeItem.top} min={-1000} max={2000} step={1} onChange={(value) => applyChanges({ top: value })} />
            {!isText && (
              <>
                <RangeField label="Width" value={activeItem.width} min={10} max={2000} step={1} onChange={(value) => applyChanges({}, { width: value })} />
                <RangeField label="Height" value={activeItem.height} min={10} max={2000} step={1} onChange={(value) => applyChanges({}, { height: value })} />
              </>
            )}
            <RangeField label="Rotation" value={activeItem.angle} min={-180} max={180} step={1} onChange={(value) => applyChanges({ angle: value })} />

            <div className='mt-2 space-y-2'>
              <label className='text-xs font-semibold uppercase tracking-wider text-white/40 ml-1'>Rotation Pivot</label>
              <div className='grid grid-cols-5 gap-2'>
                {[
                  { label: "TL", x: "left", y: "top" },
                  { label: "TR", x: "right", y: "top" },
                  { label: "CTR", x: "center", y: "center" },
                  { label: "BL", x: "left", y: "bottom" },
                  { label: "BR", x: "right", y: "bottom" },
                ].map((pivot) => (
                  <button
                    key={pivot.label}
                    onClick={() => changeOrigin(pivot.x, pivot.y)}
                    className={`flex h-10 items-center justify-center rounded-xl border text-[10px] font-bold transition ${activeItem.originX === pivot.x && activeItem.originY === pivot.y ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {pivot.label}
                  </button>
                ))}
              </div>
            </div>
            <RangeField label="Opacity" value={activeItem.opacity} min={0} max={1} step={0.01} onChange={(value) => applyChanges({ opacity: value })} />
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <RangeField label="Skew X (H)" value={activeItem.skewX} min={-80} max={80} step={1} onChange={(value) => applyChanges({ skewX: value })} />
              <RangeField label="Skew Y (V)" value={activeItem.skewY} min={-80} max={80} step={1} onChange={(value) => applyChanges({ skewY: value })} />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <ToggleField label="Flip X" active={activeItem.flipX} icon={<FlipHorizontal2 size={15} />} onClick={() => applyChanges({ flipX: !activeItem.flipX })} />
              <ToggleField label="Flip Y" active={activeItem.flipY} icon={<FlipVertical2 size={15} />} onClick={() => applyChanges({ flipY: !activeItem.flipY })} />
            </div>

          </PanelSection>

          <PanelSection title="Appearance" subtitle="Color, stroke, and blend behavior.">
            {!isImage && !isStrokeOnly && (
              <ColorField label="Fill" value={activeItem.fill} onChange={(value) => applyChanges({ fill: value })} />
            )}
            {!isImage && isStrokeOnly && (
              <div className='rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5 text-white/60'>
                Free-draw and polyline objects are stroke-first elements, so their visible color comes from the stroke controls below.
              </div>
            )}
            <ColorField label="Stroke" value={activeItem.stroke} onChange={(value) => applyChanges({ stroke: value })} />
            <RangeField label="Stroke Width" value={activeItem.strokeWidth} min={0} max={64} step={1} onChange={(value) => applyChanges({ strokeWidth: value })} />
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <SelectField
                label="Paint Order"
                value={activeItem.paintFirst}
                options={[{ label: "Fill First", value: "fill" }, { label: "Stroke First", value: "stroke" }]}
                onChange={(val) => applyChanges({ paintFirst: val as any })}
              />
              <RangeField label="Dash Pattern" value={activeItem.strokeDashArray} min={0} max={100} step={1} onChange={(val) => applyChanges({ strokeDashArray: val })} />
            </div>
            <SelectField
              label="Blend Mode"
              value={activeItem.globalCompositeOperation}
              options={BLEND_MODES.map((item) => ({ label: item, value: item }))}
              onChange={(value) => applyChanges({ globalCompositeOperation: value as BlendMode })}
            />
          </PanelSection>

          <PanelSection title="Effects" subtitle="Advanced styling like shadows and gradients.">
            <div className='space-y-4'>
              {!isImage && !isPath && (
                <div className='flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2'>
                  <label className='text-sm font-medium text-white/85'>Enable Gradient</label>
                  <input
                    type="checkbox"
                    checked={activeItem.gradientEnabled}
                    onChange={(e) => applyChanges({ gradientEnabled: e.target.checked })}
                    className="h-5 w-5 cursor-pointer rounded border-white/10 bg-white/5 text-cyan-500 accent-cyan-500"
                  />
                </div>
              )}

              {!isImage && !isPath && activeItem.gradientEnabled && (
                <div className='space-y-4 rounded-2xl border border-white/10 bg-white/5 p-3'>
                  <SelectField
                    label="Gradient Type"
                    value={activeItem.gradientType}
                    options={[{ label: "Linear", value: "linear" }, { label: "Radial", value: "radial" }]}
                    onChange={(val) => applyChanges({ gradientType: val as any })}
                  />
                  <div className='flex flex-col gap-3'>
                    <ColorField label="Start Color" value={activeItem.gradientColor1} onChange={(val) => applyChanges({ gradientColor1: val })} />
                    <ColorField label="End Color" value={activeItem.gradientColor2} onChange={(val) => applyChanges({ gradientColor2: val })} />
                  </div>
                </div>
              )}

              <div className='border-t border-white/10 pt-4'>
                <div className='mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/50'>Drop Shadow</div>
                <div className='space-y-4'>
                  <RangeField label="Blur" value={activeItem.shadowBlur} min={0} max={100} step={1} onChange={(val) => applyChanges({ shadowBlur: val })} />
                  <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                    <RangeField label="Offset X" value={activeItem.shadowOffsetX} min={-100} max={100} step={1} onChange={(val) => applyChanges({ shadowOffsetX: val })} />
                    <RangeField label="Offset Y" value={activeItem.shadowOffsetY} min={-100} max={100} step={1} onChange={(val) => applyChanges({ shadowOffsetY: val })} />
                  </div>
                  <ColorField label="Shadow Color" value={activeItem.shadowColor} onChange={(val) => applyChanges({ shadowColor: val })} />
                </div>
              </div>
            </div>
          </PanelSection>

          {isText && (
            <PanelSection title="Text" subtitle="Typography options exposed by Fabric text objects.">
              <div className='flex flex-col gap-3'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-white/85'>Font Family</label>
                  <select
                    value={activeItem.fontFamily}
                    onChange={(event) => {
                      const value = event.target.value;
                      const isCustom = customFonts?.some(f => f.name === value);
                      if (isCustom) {
                        applyChanges({ fontFamily: value });
                      } else {
                        loadGoogleFont(value).finally(() => {
                          applyChanges({ fontFamily: value });
                        });
                      }
                    }}
                    className='w-full rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60'
                  >
                    <optgroup label="Standard Fonts" className="bg-slate-900 text-cyan-400 font-bold">
                      {FontFamily.map((font) => (
                        <option key={font} value={font} className='bg-slate-900 text-white font-normal'>
                          {font}
                        </option>
                      ))}
                    </optgroup>
                    {customFonts && customFonts.length > 0 && (
                      <optgroup label="Your Custom Fonts" className="bg-slate-900 text-emerald-400 font-bold">
                        {customFonts.map((font) => (
                          <option key={font.name} value={font.name} className='bg-slate-900 text-white font-normal'>
                            ⭐ {font.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-xs font-bold text-cyan-100 transition ${fontLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400/10'}`}>
                  {fontLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-cyan-400" />
                      <span>Processing Font...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Upload Custom Font (.ttf/.otf)</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".ttf,.otf,.woff,.woff2"
                    disabled={fontLoading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && addCustomFont) addCustomFont(file);
                    }}
                  />
                </label>
              </div>
              <RangeField label="Font Size" value={activeItem.fontSize} min={8} max={240} step={1} onChange={(value) => applyChanges({ fontSize: value })} />
              <SelectField label="Font Style" value={activeItem.fontStyle} options={FontStyle.map((item) => ({ label: item, value: item }))} onChange={(value) => applyChanges({ fontStyle: value })} />
              <SelectField label="Font Weight" value={activeItem.fontWeight} options={FontWeight.map((item) => ({ label: item, value: item }))} onChange={(value) => applyChanges({ fontWeight: value })} />
              <SelectField label="Text Align" value={activeItem.textAlign} options={TextAlign.map((item) => ({ label: item, value: item.toLowerCase() }))} onChange={(value) => applyChanges({ textAlign: value as TextAlignProps })} />
              <RangeField label="Textbox Width" value={activeItem.width} min={40} max={1200} step={1} onChange={(value) => applyChanges({}, { width: value })} />
              <RangeField label="Character Spacing" value={activeItem.charSpacing} min={-200} max={800} step={1} onChange={(value) => applyChanges({ charSpacing: value })} />
              <RangeField label="Line Height" value={activeItem.lineHeight} min={0.6} max={3} step={0.01} onChange={(value) => applyChanges({ lineHeight: value })} />
              <ColorField label="Text Background" value={activeItem.backgroundColor} onChange={(value) => applyChanges({ backgroundColor: value })} />
            </PanelSection>
          )}

          {isShape && (
            <PanelSection title="Shape" subtitle="Shape-specific controls from Fabric shape props.">
              <RangeField label="Corner Radius" value={activeItem.rx} min={0} max={200} step={1} onChange={(value) => applyChanges({ rx: value, ry: value })} />
            </PanelSection>
          )}

          {isImage && (
            <PanelSection title="Image" subtitle="Crop offsets and filters supported by Fabric image objects.">
              <RangeField label="Crop X" value={activeItem.cropX} min={0} max={Math.max(activeItem.width, 1)} step={1} onChange={(value) => applyChanges({ cropX: value })} />
              <RangeField label="Crop Y" value={activeItem.cropY} min={0} max={Math.max(activeItem.height, 1)} step={1} onChange={(value) => applyChanges({ cropY: value })} />
              <RangeField label="Blur" value={activeItem.Blur} min={0} max={1} step={0.01} onChange={(value) => applyChanges({ Blur: value }, { imageFilter: "Blur" })} />
              <RangeField label="Noise" value={activeItem.Noise} min={0} max={1000} step={10} onChange={(value) => applyChanges({ Noise: value }, { imageFilter: "Noise" })} />
              <RangeField label="Pixelate" value={activeItem.Blocksize} min={0} max={64} step={1} onChange={(value) => applyChanges({ Blocksize: value }, { imageFilter: "Blocksize" })} />
              <RangeField label="Brightness" value={activeItem.Brightness} min={-1} max={1} step={0.01} onChange={(value) => applyChanges({ Brightness: value }, { imageFilter: "Brightness" })} />
              <RangeField label="Contrast" value={activeItem.Contrast} min={-1} max={1} step={0.01} onChange={(value) => applyChanges({ Contrast: value }, { imageFilter: "Contrast" })} />
              <RangeField label="Saturation" value={activeItem.Saturation} min={-1} max={1} step={0.01} onChange={(value) => applyChanges({ Saturation: value }, { imageFilter: "Saturation" })} />
              <RangeField label="Vibrance" value={activeItem.Vibrance} min={-1} max={1} step={0.01} onChange={(value) => applyChanges({ Vibrance: value }, { imageFilter: "Vibrance" })} />
            </PanelSection>
          )}

          <PanelSection title="Arrange" subtitle="Control stacking order and object grouping.">
            <div className='grid grid-cols-2 gap-3'>
              <ActionButton icon={<GroupIcon size={15} />} label="Group" onClick={groupObjects} />
              <ActionButton icon={<UngroupIcon size={15} />} label="Ungroup" onClick={ungroupObjects} />
              <ActionButton icon={<SendToBack size={15} />} label="Send Back" onClick={() => moveLayer("sendBack")} />
              <ActionButton icon={<BringToFront size={15} />} label="Bring Front" onClick={() => moveLayer("bringFront")} />
              <ActionButton icon={<StepBack size={15} />} label="Step Back" onClick={() => moveLayer("sendBackward")} />
              <ActionButton icon={<StepForward size={15} />} label="Step Forward" onClick={() => moveLayer("bringForward")} />
            </div>
          </PanelSection>
        </>
      )}
    </div>
  );
}

function PanelSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-3xl border border-white/10 bg-[#081221] p-4'>
      <div className='mb-4'>
        <div className='text-sm font-semibold text-white'>{title}</div>
        <div className='mt-1 text-xs leading-5 text-white/60'>{subtitle}</div>
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const percentage = max === min ? 0 : ((safeValue - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const ratio = clampValue((clientX - rect.left) / rect.width, 0, 1);
    const nextValue = snapToStep(min + ratio * (max - min), min, step);
    onChange(clampValue(nextValue, min, max));
  }, [max, min, onChange, step]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      updateFromClientX(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      updateFromClientX(event.touches[0].clientX);
    };

    const stopDragging = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, [dragging, updateFromClientX]);

  const handleTrackPress = (clientX: number) => {
    updateFromClientX(clientX);
    setDragging(true);
  };

  const nudgeValue = (direction: -1 | 1) => {
    const nextValue = snapToStep(safeValue + step * direction, min, step);
    onChange(clampValue(nextValue, min, max));
  };

  return (
    <div className='space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3'>
      <div className='flex items-center justify-between gap-3'>
        <label className='text-sm font-medium text-white/85'>{label}</label>
        <div className='rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-right text-xs font-semibold tracking-[0.18em] text-cyan-100'>
          {step < 1 ? safeValue.toFixed(2) : Math.round(safeValue)}
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => nudgeValue(-1)}
          className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0d213a] text-white/80 transition hover:border-cyan-300/40 hover:text-white'
          aria-label={`Decrease ${label}`}
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={trackRef}
          role='slider'
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={safeValue}
          onMouseDown={(event) => handleTrackPress(event.clientX)}
          onTouchStart={(event) => handleTrackPress(event.touches[0].clientX)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudgeValue(-1);
            }
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudgeValue(1);
            }
          }}
          className='relative h-12 flex-1 cursor-ew-resize rounded-2xl border border-cyan-300/10 bg-[#09182b] px-3 outline-none transition focus:border-cyan-300/50'
        >
          <div className='absolute left-3 right-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/8' />
          <div
            className='absolute left-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#22d3ee_0%,#14b8a6_100%)] shadow-[0_0_18px_rgba(34,211,238,0.25)]'
            style={{ width: `calc(${percentage}% - 24px * ${percentage / 100})` }}
          />
          <div
            className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-cyan-200 bg-[radial-gradient(circle_at_35%_35%,#ecfeff,#67e8f9_55%,#06b6d4)] shadow-[0_0_0_4px_rgba(34,211,238,0.12),0_10px_18px_rgba(6,182,212,0.25)] transition ${dragging ? 'scale-110' : ''}`}
            style={{ left: `calc(${percentage}% - 12px)` }}
          />
        </div>

        <button
          type='button'
          onClick={() => nudgeValue(1)}
          className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0d213a] text-white/80 transition hover:border-cyan-300/40 hover:text-white'
          aria-label={`Increase ${label}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-[11px] uppercase tracking-[0.18em] text-white/35'>Min {min}</span>
        <div className='rounded-xl border border-white/10 bg-[#09182b] px-3 py-2 text-center text-xs uppercase tracking-[0.2em] text-white/45'>
          Step {step}
        </div>
        <span className='text-[11px] uppercase tracking-[0.18em] text-white/35'>Max {max}</span>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2'>
      <label className='text-sm font-medium text-white/85'>{label}</label>
      <div className='flex items-center gap-3'>
        <div className='rounded-full border border-white/10 p-1'>
          <input
            type='color'
            value={normalizeColor(value, "#22c55e")}
            onChange={(event) => onChange(event.target.value)}
            className='h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0'
          />
        </div>
        <span className='w-20 text-right text-xs uppercase tracking-[0.18em] text-white/45'>{normalizeColor(value, "#22c55e")}</span>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-white/85'>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='w-full rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className='bg-slate-900 text-white'>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition ${active
          ? 'border-cyan-300/60 bg-cyan-400/15 text-white'
          : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]'
    >
      {icon}
      {label}
    </button>
  );
}

export default ToolBox;
