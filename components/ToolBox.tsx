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
  Maximize2,
  Sparkles,
  X,
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
import { createPortal } from 'react-dom';
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
  activeCategory?: string | null;
  setActiveCategory?: (cat: string | null) => void;
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
  rxTL: number;
  rxTR: number;
  rxBL: number;
  rxBR: number;
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
  rxTL: 0,
  rxTR: 0,
  rxBL: 0,
  rxBR: 0,
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

function ToolBox({ selectedId, fabricJs, state, setState, activeTool, brushType, setBrushType, eraserSize, setEraserSize, customFonts, addCustomFont, fontLoading, attachTransformListeners, activeCategory: externalCategory, setActiveCategory: setExternalCategory }: ToolBoxProp) {
  const [internalCategory, setInternalCategory] = useState<string | null>(null);

  const activeCategory = externalCategory !== undefined ? externalCategory : internalCategory;
  const setActiveCategory = setExternalCategory !== undefined ? setExternalCategory : setInternalCategory;

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
      rxTL: (selectedObject as any).rxTL ?? 0,
      rxTR: (selectedObject as any).rxTR ?? 0,
      rxBL: (selectedObject as any).rxBL ?? 0,
      rxBR: (selectedObject as any).rxBR ?? 0,
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
    if (delta.rx !== undefined || delta.rxTL !== undefined || delta.rxTR !== undefined || delta.rxBL !== undefined || delta.rxBR !== undefined) {
      const rtl = delta.rxTL ?? activeItem.rxTL;
      const rtr = delta.rxTR ?? activeItem.rxTR;
      const rbl = delta.rxBL ?? activeItem.rxBL;
      const rbr = delta.rxBR ?? activeItem.rxBR;
      const rAll = delta.rx ?? activeItem.rx;

      // If rAll is changed, update all individual corners to match
      const tl = delta.rx !== undefined ? rAll : rtl;
      const tr = delta.rx !== undefined ? rAll : rtr;
      const bl = delta.rx !== undefined ? rAll : rbl;
      const br = delta.rx !== undefined ? rAll : rbr;

      const w = object.width;
      const h = object.height;

      // Use a custom Path as clipPath to support individual corner radii
      // M x+r,y L x+w-r,y Q x+w,y x+w,y+r L x+w,y+h-r Q x+w,y+h x+w-r,y+h L x+r,y+h Q x,y+h x,y+h-r L x,y+r Q x,y x+r,y Z
      const x = -w/2;
      const y = -h/2;
      
      const pathData = `
        M ${x + tl} ${y}
        L ${x + w - tr} ${y}
        Q ${x + w} ${y} ${x + w} ${y + tr}
        L ${x + w} ${y + h - br}
        Q ${x + w} ${y + h} ${x + w - br} ${y + h}
        L ${x + rbl} ${y + h}
        Q ${x} ${y + h} ${x} ${y + h - rbl}
        L ${x} ${y + tl}
        Q ${x} ${y} ${x + tl} ${y}
        Z
      `;

      object.set('clipPath', new Path(pathData, {
        originX: 'center',
        originY: 'center',
      }));

      (object as any).rxTL = tl;
      (object as any).rxTR = tr;
      (object as any).rxBL = bl;
      (object as any).rxBR = br;

      nextStatePatch.rxTL = tl;
      nextStatePatch.rxTR = tr;
      nextStatePatch.rxBL = bl;
      nextStatePatch.rxBR = br;
      
      // Only update the master 'rx' state if the 'All Corners' slider was moved
      if (delta.rx !== undefined) {
        nextStatePatch.rx = delta.rx;
        // For Rects, we can still set native rx if it's uniform
        if (object.isType('rect')) {
          object.set({ rx: delta.rx, ry: delta.rx });
        }
      }
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
    
    if (!activeObject || !activeObject.isType('ActiveSelection', 'activeselection')) {
      return;
    }

    const selection = activeObject as any;
    const objects = selection.getObjects();
    const ids = objects.map((obj: any) => obj.get("id")).filter(Boolean);
    
    // Robust way to create a group from selection in Fabric 6
    const group = selection.toGroup();
    if (!group) return;

    const newId = `group_${uuidv4().split('-')[0]}`;
    group.set({
      id: newId,
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
    if (!activeObject || !activeObject.isType('Group', 'group')) return;

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
          Select a layer to edit its properties.
        </div>
      </div>
    );
  }

  // --- RENDERING HELPERS ---

  const renderCategoryBox = (title: string, children: React.ReactNode) => {
    const content = (
      <div 
        className='z-[60] border border-white/10 bg-[#09182b]/95 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in duration-300
          md:relative md:w-full md:rounded-[32px] md:border-none md:bg-transparent md:p-0 md:shadow-none
          fixed bottom-0 left-0 right-0 w-full rounded-t-[40px] slide-in-from-bottom-4 h-[40vh] md:h-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-1 pb-4">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className='flex items-center justify-between border-b border-white/5 pb-4 mb-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-cyan-400/15 p-2 text-cyan-400'>
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h3 className='text-xs font-black uppercase tracking-[0.2em] text-cyan-400'>{title}</h3>
              <div className='text-[8px] font-bold uppercase tracking-widest text-white/30'>Adjust Properties</div>
            </div>
          </div>
          <button 
            onClick={() => setActiveCategory(null)}
            className='p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all'
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className='space-y-4 overflow-y-auto pr-2 historyScrollbar h-[calc(40vh-120px)] md:h-auto md:max-h-none'>
          {children}
        </div>
      </div>
    );

    if (typeof document === 'undefined') return content;
    
    // On mobile, use portal for bottom sheet. On desktop, render inline in sidebar.
    return (
      <>
        <div className="hidden md:block">
            {content}
        </div>
        {createPortal(
            <div className="md:hidden">
                {content}
            </div>,
            document.getElementById("imageEdittingContainer") || document.getElementById("gifMakerContainer") || document.body
        )}
      </>
    );
  };

  const CategoryButton = ({ id, icon, label, description }: { id: string, icon: React.ReactNode, label: string, description: string }) => (
    <button
      onClick={() => setActiveCategory(id)}
      className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.08] hover:border-cyan-400/30 group'
    >
      <div className='rounded-xl bg-white/5 p-3 text-white group-hover:scale-110 transition-transform group-hover:text-cyan-400 shrink-0'>
        {icon}
      </div>
      <div className='flex flex-col items-center'>
        <div className='text-[10px] font-bold uppercase tracking-wider text-white/80 whitespace-nowrap'>{label}</div>
        <div className='text-[8px] text-white/30 text-center leading-tight hidden md:block'>{description}</div>
      </div>
    </button>
  );

  // --- CATEGORY CONTENT ---

  if (activeCategory === "transform") {
    return renderCategoryBox("Transform", (
      <>
        <RangeField label="Position X" value={activeItem.left} min={-1000} max={2000} step={1} onChange={(value) => applyChanges({ left: value })} />
        <RangeField label="Position Y" value={activeItem.top} min={-1000} max={2000} step={1} onChange={(value) => applyChanges({ top: value })} />
        <RangeField label="Width" value={activeItem.width} min={1} max={2000} step={1} onChange={(value) => applyChanges({}, { width: value })} />
        <RangeField label="Height" value={activeItem.height} min={1} max={2000} step={1} onChange={(value) => applyChanges({}, { height: value })} />
        <RangeField label="Angle" value={activeItem.angle} min={0} max={360} step={1} onChange={(value) => applyChanges({ angle: value })} />
        
        <div className='mt-2 space-y-2'>
          <label className='text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1'>Pivot Point</label>
          <div className='grid grid-cols-3 gap-2'>
            {[
              { x: "left", y: "top", label: "TL" }, { x: "center", y: "top", label: "TC" }, { x: "right", y: "top", label: "TR" },
              { x: "left", y: "center", label: "ML" }, { x: "center", y: "center", label: "MC" }, { x: "right", y: "center", label: "MR" },
              { x: "left", y: "bottom", label: "BL" }, { x: "center", y: "bottom", label: "BC" }, { x: "right", y: "bottom", label: "BR" },
            ].map((origin) => (
              <button
                key={`${origin.x}-${origin.y}`}
                onClick={() => changeOrigin(origin.x, origin.y)}
                className={`rounded-lg py-1.5 text-[9px] font-bold uppercase transition ${activeItem.originX === origin.x && activeItem.originY === origin.y ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                {origin.label}
              </button>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <ActionButton icon={<FlipHorizontal2 size={16} />} label="Flip H" onClick={() => applyChanges({ flipX: !activeItem.flipX })} active={activeItem.flipX} />
          <ActionButton icon={<FlipVertical2 size={16} />} label="Flip V" onClick={() => applyChanges({ flipY: !activeItem.flipY })} active={activeItem.flipY} />
        </div>

        {(isShape || isImage) && (
          <div className='space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-[10px] font-bold uppercase tracking-widest text-white/40'>Corner Radius</h4>
              <div className='flex gap-1'>
                {["TL", "TR", "BL", "BR", "ALL"].map(c => (
                  <button 
                    key={c}
                    onClick={() => (window as any)._activeCorner = c}
                    className='px-2 py-1 rounded bg-white/5 text-[8px] font-bold text-white/40 hover:text-cyan-400'
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            
            <RangeField label="All Corners" value={activeItem.rx} min={0} max={200} step={1} onChange={(value) => applyChanges({ rx: value })} />
            
            <div className='grid grid-cols-2 gap-4 pt-2 border-t border-white/5'>
              <RangeField label="Top Left" value={activeItem.rxTL} min={0} max={200} step={1} onChange={(v) => applyChanges({ rxTL: v })} />
              <RangeField label="Top Right" value={activeItem.rxTR} min={0} max={200} step={1} onChange={(v) => applyChanges({ rxTR: v })} />
              <RangeField label="Bottom Left" value={activeItem.rxBL} min={0} max={200} step={1} onChange={(v) => applyChanges({ rxBL: v })} />
              <RangeField label="Bottom Right" value={activeItem.rxBR} min={0} max={200} step={1} onChange={(v) => applyChanges({ rxBR: v })} />
            </div>
          </div>
        )}
      </>
    ));
  }

  if (activeCategory === "styling") {
    return renderCategoryBox("Styling", (
      <>
        <RangeField label="Opacity" value={activeItem.opacity} min={0} max={1} step={0.01} onChange={(value) => applyChanges({ opacity: value })} />
        {!isImage && (
          <ColorField label="Fill Color" value={activeItem.fill} onChange={(value) => applyChanges({ fill: value })} />
        )}
        <div className='space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
          <h4 className='text-[10px] font-bold uppercase tracking-widest text-white/40'>Stroke Settings</h4>
          <ColorField label="Stroke Color" value={activeItem.stroke} onChange={(value) => applyChanges({ stroke: value })} />
          <RangeField label="Stroke Width" value={activeItem.strokeWidth} min={0} max={50} step={1} onChange={(value) => applyChanges({ strokeWidth: value })} />
          <RangeField label="Dash Array" value={activeItem.strokeDashArray} min={0} max={50} step={1} onChange={(value) => applyChanges({ strokeDashArray: value })} />
        </div>
        <div className='space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='text-[10px] font-bold uppercase tracking-widest text-white/40'>Gradient</h4>
            <input 
              type="checkbox" 
              checked={activeItem.gradientEnabled} 
              onChange={(e) => applyChanges({ gradientEnabled: e.target.checked })}
              className="accent-cyan-500"
            />
          </div>
          {activeItem.gradientEnabled && (
            <div className='space-y-3 animate-in fade-in slide-in-from-top-2 duration-300'>
              <SelectField 
                label="Type" 
                value={activeItem.gradientType} 
                options={[{label: "Linear", value: "linear"}, {label: "Radial", value: "radial"}]} 
                onChange={(v) => applyChanges({ gradientType: v as any })} 
              />
              <ColorField label="Color 1" value={activeItem.gradientColor1} onChange={(v) => applyChanges({ gradientColor1: v })} />
              <ColorField label="Color 2" value={activeItem.gradientColor2} onChange={(v) => applyChanges({ gradientColor2: v })} />
            </div>
          )}
        </div>

        <SelectField
          label="Blend Mode"
          value={activeItem.globalCompositeOperation}
          options={BLEND_MODES.map(m => ({ label: m, value: m }))}
          onChange={(value) => applyChanges({ globalCompositeOperation: value as BlendMode })}
        />
      </>
    ));
  }

  if (activeCategory === "text" && isText) {
    return renderCategoryBox("Typography", (
      <>
        <SelectField label="Font Family" value={activeItem.fontFamily} options={FontFamily.map(f => ({ label: f, value: f }))} onChange={(value) => applyChanges({ fontFamily: value })} />
        <div className='grid grid-cols-2 gap-3'>
          <SelectField label="Weight" value={activeItem.fontWeight} options={FontWeight.map(w => ({ label: w, value: w }))} onChange={(value) => applyChanges({ fontWeight: value })} />
          <SelectField label="Style" value={activeItem.fontStyle} options={FontStyle.map(s => ({ label: s, value: s }))} onChange={(value) => applyChanges({ fontStyle: value })} />
        </div>
        <RangeField label="Font Size" value={activeItem.fontSize} min={1} max={200} step={1} onChange={(value) => applyChanges({ fontSize: value })} />
        <RangeField label="Letter Spacing" value={activeItem.charSpacing} min={-100} max={500} step={1} onChange={(value) => applyChanges({ charSpacing: value })} />
        <RangeField label="Line Height" value={activeItem.lineHeight} min={0.1} max={3} step={0.05} onChange={(value) => applyChanges({ lineHeight: value })} />
        <SelectField label="Alignment" value={activeItem.textAlign} options={TextAlign.map(a => ({ label: a, value: a.toLowerCase() }))} onChange={(value) => applyChanges({ textAlign: value as TextAlignProps })} />
        <ColorField label="Background" value={activeItem.backgroundColor} onChange={(value) => applyChanges({ backgroundColor: value })} />
        
        <div className='pt-2'>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.ttf,.otf,.woff,.woff2';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && addCustomFont) addCustomFont(file);
              };
              input.click();
            }}
            disabled={fontLoading}
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:bg-white/10 hover:border-cyan-400/30'
          >
            {fontLoading ? <Loader2 size={14} className="animate-spin text-cyan-400" /> : <Plus size={14} />}
            {fontLoading ? 'Loading Font...' : 'Load Local Font'}
          </button>
          
          {customFonts && customFonts.length > 0 && (
            <div className='mt-3 space-y-2'>
              <label className='text-[9px] font-black uppercase tracking-widest text-white/30 ml-1'>Custom Fonts</label>
              <div className='grid grid-cols-2 gap-2'>
                {customFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => applyChanges({ fontFamily: font.name })}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] truncate transition-all ${activeItem.fontFamily === font.name ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                    style={{ fontFamily: font.name }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    ));
  }

  if (activeCategory === "effects") {
    return renderCategoryBox("Effects", (
      <div className='space-y-6'>
        <div className='space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
          <h4 className='text-[10px] font-bold uppercase tracking-widest text-white/40'>Shadow</h4>
          <ColorField label="Color" value={activeItem.shadowColor} onChange={(v) => applyChanges({ shadowColor: v })} />
          <RangeField label="Blur" value={activeItem.shadowBlur} min={0} max={50} step={1} onChange={(v) => applyChanges({ shadowBlur: v })} />
          <RangeField label="Offset X" value={activeItem.shadowOffsetX} min={-50} max={50} step={1} onChange={(v) => applyChanges({ shadowOffsetX: v })} />
          <RangeField label="Offset Y" value={activeItem.shadowOffsetY} min={-50} max={50} step={1} onChange={(v) => applyChanges({ shadowOffsetY: v })} />
        </div>
        {isImage && (
          <div className='space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3'>
            <h4 className='text-[10px] font-bold uppercase tracking-widest text-white/40'>Image Filters</h4>
            <RangeField label="Brightness" value={activeItem.Brightness} min={-1} max={1} step={0.05} onChange={(v) => applyChanges({ Brightness: v }, { imageFilter: "Brightness" })} />
            <RangeField label="Contrast" value={activeItem.Contrast} min={-1} max={1} step={0.05} onChange={(v) => applyChanges({ Contrast: v }, { imageFilter: "Contrast" })} />
            <RangeField label="Saturation" value={activeItem.Saturation} min={-1} max={1} step={0.05} onChange={(v) => applyChanges({ Saturation: v }, { imageFilter: "Saturation" })} />
            <RangeField label="Blur" value={activeItem.Blur} min={0} max={1} step={0.05} onChange={(v) => applyChanges({ Blur: v }, { imageFilter: "Blur" })} />
            <RangeField label="Pixelate" value={activeItem.Blocksize} min={0} max={20} step={1} onChange={(v) => applyChanges({ Blocksize: v }, { imageFilter: "Blocksize" })} />
          </div>
        )}
      </div>
    ));
  }

  if (activeCategory === "brush" && activeTool === "freeDrawing") {
    return renderCategoryBox("Brush Studio", (
      <div className='space-y-4'>
        <SelectField
          label="Brush Type"
          value={brushType ?? "pencil"}
          options={[{ label: "Pencil", value: "pencil" }, { label: "Spray", value: "spray" }, { label: "Pattern", value: "pattern" }, { label: "Eraser", value: "eraser" }]}
          onChange={(val) => setBrushType?.(val)}
        />
        {brushType !== "eraser" && (
          <>
            <ColorField label="Color" value={activeItem.brushColor} onChange={(val) => applyBrushChanges({ color: val })} />
            <RangeField label="Width" value={activeItem.brushWidth} min={1} max={100} step={1} onChange={(val) => applyBrushChanges({ width: val })} />
          </>
        )}
        {brushType === "spray" && (
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/5 p-3'>
            <RangeField label="Density" value={activeItem.sprayDensity} min={1} max={100} step={1} onChange={(val) => applyBrushChanges({ density: val })} />
            <RangeField label="Dot Width" value={activeItem.sprayDotWidth} min={1} max={20} step={1} onChange={(val) => applyBrushChanges({ dotWidth: val })} />
          </div>
        )}
        {brushType === "eraser" && (
          <RangeField label="Eraser Size" value={eraserSize || 20} min={1} max={200} step={1} onChange={(val) => setEraserSize?.(val)} />
        )}
      </div>
    ));
  }

  // --- MAIN GRID VIEW ---

  return (
    <div className='space-y-6'>
      {/* Header Info */}
      <div className='rounded-3xl border border-white/10 bg-[#081221] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50'>{selectedId ? "Selected" : "Active Tool"}</div>
            <div className='mt-1 text-base font-bold text-white'>{selectedId ? (activeItem.id.slice(0, 12) + "...") : activeTool?.toUpperCase()}</div>
            <div className='text-[10px] uppercase tracking-wider text-white/30'>{selectedId ? activeItem.kind : (activeTool === "freeDrawing" ? brushType : "none")}</div>
          </div>
          <div className='rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-100'>
            {isText ? <Type size={16} /> : isImage ? <ImageIcon size={16} /> : <SlidersHorizontal size={16} />}
          </div>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className='flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none snap-x'>
        {activeTool === "freeDrawing" && (
          <div className="snap-start min-w-[100px] md:min-w-0 flex-1">
            <CategoryButton id="brush" icon={<PenLine size={20} />} label="Brush" description="Color, size & type" />
          </div>
        )}
        
        {selectedId && (
          <>
            <div className="snap-start min-w-[100px] md:min-w-0 flex-1">
                <CategoryButton id="transform" icon={<Maximize2 size={20} />} label="Transform" description="Move, scale, rotate" />
            </div>
            <div className="snap-start min-w-[100px] md:min-w-0 flex-1">
                <CategoryButton id="styling" icon={<SlidersHorizontal size={20} />} label="Style" description="Color, opacity, blend" />
            </div>
            {isText && (
              <div className="snap-start min-w-[100px] md:min-w-0 flex-1">
                <CategoryButton id="text" icon={<Type size={20} />} label="Typography" description="Font, size, align" />
              </div>
            )}
            <div className="snap-start min-w-[100px] md:min-w-0 flex-1">
                <CategoryButton id="effects" icon={<Sparkles size={20} />} label="Effects" description="Shadows & filters" />
            </div>
          </>
        )}
      </div>

      {/* Quick Actions (Always available if something selected) */}
      {selectedId && (
        <div className='pt-2'>
          <h4 className='mb-3 text-[10px] font-black uppercase tracking-widest text-white/30 ml-1'>Arrangement</h4>
          <div className='grid grid-cols-2 gap-2'>
            <ActionButton icon={<BringToFront size={14} />} label="To Front" onClick={() => moveLayer("bringFront")} />
            <ActionButton icon={<StepForward size={14} />} label="Forward" onClick={() => moveLayer("bringForward")} />
            <ActionButton icon={<StepBack size={14} />} label="Backward" onClick={() => moveLayer("sendBackward")} />
            <ActionButton icon={<SendToBack size={14} />} label="To Back" onClick={() => moveLayer("sendBack")} />
            <ActionButton icon={<GroupIcon size={14} />} label="Group" onClick={groupObjects} />
            <ActionButton icon={<UngroupIcon size={14} />} label="Ungroup" onClick={ungroupObjects} />
          </div>
        </div>
      )}
    </div>
  );
;
}

function PanelSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className='space-y-3'>
      <div>
        <h3 className='text-[11px] font-black uppercase tracking-widest text-white'>{title}</h3>
        <p className='mt-0.5 text-[9px] font-bold text-white/30 uppercase tracking-[0.1em]'>{subtitle}</p>
      </div>
      <div className='space-y-4 rounded-[24px] border border-white/5 bg-white/[0.03] p-4 shadow-xl'>
        {children}
      </div>
    </section>
  );
}

function ActionButton({ icon, label, onClick, active, className = "" }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${active ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/5'} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RangeField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (val: number) => void }) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <label className='text-[9px] font-black uppercase tracking-widest text-white/40'>{label}</label>
        <span className='text-[10px] font-bold text-cyan-400'>{value % 1 === 0 ? value : value.toFixed(2)}</span>
      </div>
      <div className='flex items-center gap-3'>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className='editorRange flex-1'
          style={{ "--range-percent": `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div className='flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2'>
      <label className='text-[9px] font-black uppercase tracking-widest text-white/40 ml-1'>{label}</label>
      <div className='flex items-center gap-2'>
        <span className='text-[10px] font-mono text-white/50'>{value === "transparent" || !value ? "NONE" : value.toUpperCase()}</span>
        <div className='flex items-center gap-1.5'>
          <div className='relative h-7 w-12 overflow-hidden rounded-lg border border-white/10'>
            <input
              type="color"
              value={value === "transparent" || !value ? "#ffffff" : value}
              onChange={(e) => onChange(e.target.value)}
              className='absolute -inset-2 h-12 w-16 cursor-pointer bg-transparent'
            />
          </div>
          <button 
            onClick={() => onChange("transparent")}
            className='p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all'
            title="Remove Color"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (val: string) => void }) {
  return (
    <div className='space-y-1.5'>
      <label className='text-[9px] font-black uppercase tracking-widest text-white/40 ml-1'>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400/30'
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className='bg-[#081221] text-white'>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default ToolBox;
