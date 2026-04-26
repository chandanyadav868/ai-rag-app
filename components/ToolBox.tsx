"use client";

import { BLEND_MODES, FontFamily, FontStyle, FontWeight, TextAlign } from '@/constant';
import {
  ChevronLeft,
  ChevronRight,
  BringToFront,
  FlipHorizontal2,
  FlipVertical2,
  ImageIcon,
  PenLine,
  SendToBack,
  SlidersHorizontal,
  StepBack,
  StepForward,
  Type,
} from 'lucide-react';
import {
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  filters,
  Path,
  Polyline,
  Rect,
  Textbox,
  Triangle,
} from 'fabric';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { loadGoogleFont } from '@/lib/googleFonts';

interface ToolBoxProp {
  fabricJs: React.MutableRefObject<Canvas | null>;
  setState: Dispatch<SetStateAction<StateProps[]>>;
  selectedId: string | null;
  state: StateProps[];
  shapeDesignDiv?: (selectedId: string, {}: Record<string, string | number>) => void;
  shapePosition?: (selectedId: string, type: PositionProps) => void;
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

function ToolBox({ selectedId, fabricJs, state, setState }: ToolBoxProp) {
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
      setActiveItem(EMPTY_INSPECTOR);
      return;
    }

    const selectedObject = fabricJs.current?.getObjects().find((object) => object.get("id") === selectedId) ?? null;
    const selectedState = state.find((item) => item.id === selectedId) ?? null;

    if (!selectedObject || !selectedState) {
      setActiveItem(EMPTY_INSPECTOR);
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
    });
  }, [selectedId, state, fabricJs]);

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

  if (!selectedId || activeItem.kind === "none") {
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
      <div className='rounded-3xl border border-white/10 bg-[#081221] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70'>Selected</div>
            <div className='mt-2 text-lg font-bold text-white'>{activeItem.id}</div>
            <div className='mt-1 text-xs uppercase tracking-[0.22em] text-white/45'>{activeItem.kind}</div>
          </div>
          <div className='rounded-2xl bg-cyan-400/15 p-3 text-cyan-100'>
            {isText ? <Type size={18} /> : isImage ? <ImageIcon size={18} /> : isStrokeOnly ? <PenLine size={18} /> : <SlidersHorizontal size={18} />}
          </div>
        </div>
      </div>

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
        <RangeField label="Opacity" value={activeItem.opacity} min={0} max={1} step={0.01} onChange={(value) => applyChanges({ opacity: value })} />
        <RangeField label="Skew X" value={activeItem.skewX} min={-85} max={85} step={1} onChange={(value) => applyChanges({ skewX: value })} />
        <RangeField label="Skew Y" value={activeItem.skewY} min={-85} max={85} step={1} onChange={(value) => applyChanges({ skewY: value })} />

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
        <SelectField
          label="Blend Mode"
          value={activeItem.globalCompositeOperation}
          options={BLEND_MODES.map((item) => ({ label: item, value: item }))}
          onChange={(value) => applyChanges({ globalCompositeOperation: value as BlendMode })}
        />
      </PanelSection>

      {isText && (
        <PanelSection title="Text" subtitle="Typography options exposed by Fabric text objects.">
          <SelectField
            label="Font Family"
            value={activeItem.fontFamily}
            options={FontFamily.map((item) => ({ label: item, value: item }))}
            onChange={(value) => {
              // Attempt to load Google font families (no-op if not a Google font)
              loadGoogleFont(value).finally(() => {
                applyChanges({ fontFamily: value });
              });
            }}
          />
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

      <PanelSection title="Arrange" subtitle="Control stacking order without leaving the inspector.">
        <div className='grid grid-cols-2 gap-3'>
          <ActionButton icon={<SendToBack size={15} />} label="Send Back" onClick={() => moveLayer("sendBack")} />
          <ActionButton icon={<BringToFront size={15} />} label="Bring Front" onClick={() => moveLayer("bringFront")} />
          <ActionButton icon={<StepBack size={15} />} label="Step Back" onClick={() => moveLayer("sendBackward")} />
          <ActionButton icon={<StepForward size={15} />} label="Step Forward" onClick={() => moveLayer("bringForward")} />
        </div>
      </PanelSection>
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
        active
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
