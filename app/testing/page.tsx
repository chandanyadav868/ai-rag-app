"use client";

import React, { useCallback, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import {
  Layers,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  Crop,
  Square,
  Sun,
  Droplet,
  Frame,
} from "lucide-react";

type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

interface Layer {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lockAspect: boolean;
  cropTop: number;
  cropLeft: number;
  cropRight: number;
  cropBottom: number;
  order: number;
  visible: boolean;
  brightness: number; // 0..2
  saturation: number; // 0..2
  overlayColor: string;
  overlayOpacity: number; // 0..1
  blendMode: BlendMode;
}

const BLEND_MODES: BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

const ASPECT_PRESETS = [
  { label: "16:9", w: 1600, h: 900 },
  { label: "9:16", w: 900, h: 1600 },
  { label: "1:1", w: 1000, h: 1000 },
  { label: "4:5", w: 800, h: 1000 },
];

const randomId = () => Math.random().toString(36).substring(2, 9);

export default function TestingEditor() {
  // canvas workspace aspect
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>(ASPECT_PRESETS[0]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeLock = useRef<Record<string, boolean>>({});

  // add images
  const addImages = useCallback((files: FileList) => {
    setLayers((prev) => {
      const maxOrder = prev.length ? Math.max(...prev.map((l) => l.order)) : 0;
      const newLayers: Layer[] = Array.from(files).map((file, i) => ({
        id: randomId(),
        src: URL.createObjectURL(file),
        x: 50 + i * 20,
        y: 50 + i * 20,
        width: 300,
        height: 200,
        lockAspect: false,
        cropTop: 0,
        cropLeft: 0,
        cropRight: 0,
        cropBottom: 0,
        order: maxOrder + i + 1,
        visible: true,
        brightness: 1,
        saturation: 1,
        overlayColor: "#000000",
        overlayOpacity: 0,
        blendMode: "normal",
      }));
      return [...prev, ...newLayers].sort((a, b) => a.order - b.order);
    });
  }, []);

  // utility to update layer immutably
  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, ...patch } : l))
        .sort((a, b) => a.order - b.order)
        .map((l, i) => ({ ...l, order: i + 1 }))
    );
  };

  const bringForward = (id: string) => {
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx === sorted.length - 1) return prev;
      [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
      return sorted.map((l, i) => ({ ...l, order: i + 1 }));
    });
  };

  const sendBackward = (id: string) => {
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
      return sorted.map((l, i) => ({ ...l, order: i + 1 }));
    });
  };

  const bringToFront = (id: string) => {
    setLayers((prev) => {
      const max = Math.max(...prev.map((l) => l.order));
      return prev
        .map((l) => (l.id === id ? { ...l, order: max + 1 } : l))
        .sort((a, b) => a.order - b.order)
        .map((l, i) => ({ ...l, order: i + 1 }));
    });
  };

  const sendToBack = (id: string) => {
    setLayers((prev) => {
      const min = Math.min(...prev.map((l) => l.order));
      return prev
        .map((l) => (l.id === id ? { ...l, order: min - 1 } : l))
        .sort((a, b) => a.order - b.order)
        .map((l, i) => ({ ...l, order: i + 1 }));
    });
  };

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id).sort((a, b) => a.order - b.order));
    if (activeId === id) setActiveId(null);
  };



  // handle canvas aspect change
  const selectAspect = (preset: { w: number; h: number }) => {
    setCanvasSize(preset);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black text-white p-4 gap-6">
      {/* Sidebar */}
      <aside className="w-full lg:w-96 flex flex-col gap-4 bg-[#1f1f1f] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Image Editor</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <label className="flex-1 flex items-center gap-2 bg-gray-800 px-3 py-2 rounded cursor-pointer text-sm">
            <ImageIcon className="w-4 h-4" />
            Upload Images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addImages(e.target.files);
              }}
            />
          </label>

        </div>

        {/* Canvas aspect controls */}
        <div className="mb-2">
          <div className="text-xs font-semibold uppercase mb-1">Canvas Aspect</div>
          <div className="flex gap-2 flex-wrap">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => selectAspect({ w: p.w, h: p.h })}
                className={`px-3 py-1 rounded text-[12px] border ${
                  canvasSize.w === p.w && canvasSize.h === p.h
                    ? "border-blue-400 bg-blue-900"
                    : "border-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] mt-1">
            Workspace: {canvasSize.w}×{canvasSize.h} (you can drag layers outside)
          </div>
        </div>

        {/* Layers list */}
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5" />
          <div className="font-semibold">Layers</div>
        </div>

        <div className="flex-1 overflow-auto space-y-3">
          {layers
            .slice()
            .sort((a, b) => b.order - a.order)
            .map((layer) => {
              const isActive = layer.id === activeId;
              return (
                <div
                  key={layer.id}
                  className={`p-3 rounded bg-[#0f0f0f] border ${
                    isActive ? "border-blue-500" : "border-gray-700"
                  }`}
                  onClick={() => setActiveId(layer.id)}
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex gap-2 items-center">
                      <div className="text-xs font-medium truncate">Layer {layer.id}</div>
                      {!layer.visible ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => sendToBack(layer.id)} className="p-1 rounded hover:bg-gray-800">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => sendBackward(layer.id)} className="p-1 rounded hover:bg-gray-800">
                        <ArrowDown className="w-4 h-4 rotate-90" />
                      </button>
                      <button onClick={() => bringForward(layer.id)} className="p-1 rounded hover:bg-gray-800">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => bringToFront(layer.id)} className="p-1 rounded hover:bg-gray-800">
                        <ArrowUp className="w-4 h-4 rotate-90" />
                      </button>
                      <button onClick={() => updateLayer(layer.id, { visible: !layer.visible })} className="p-1 rounded hover:bg-gray-800">
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => removeLayer(layer.id)} className="p-1 rounded hover:bg-red-800">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Filters / blend */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                    <div>
                      <div className="mb-1">Blend Mode</div>
                      <select
                        value={layer.blendMode}
                        onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                        className="w-full bg-[#1f1f1f] rounded px-2 py-1"
                      >
                        {BLEND_MODES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="mb-1">Brightness</div>
                      <div className="flex items-center gap-1">
                        <Sun className="w-4 h-4" />
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={layer.brightness}
                          onChange={(e) => updateLayer(layer.id, { brightness: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1">Saturation</div>
                      <div className="flex items-center gap-1">
                        <Droplet className="w-4 h-4" />
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={layer.saturation}
                          onChange={(e) => updateLayer(layer.id, { saturation: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1">Overlay</div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={layer.overlayColor}
                          onChange={(e) => updateLayer(layer.id, { overlayColor: e.target.value })}
                          className="w-8 h-8 p-0 border-0"
                        />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.02}
                          value={layer.overlayOpacity}
                          onChange={(e) => updateLayer(layer.id, { overlayOpacity: Number(e.target.value) })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Crop */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-1">
                    <div>
                      <div className="mb-1 flex items-center gap-1">
                        <Crop className="w-4 h-4" />
                        Top
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.floor(layer.height / 2)}
                        value={layer.cropTop}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            cropTop: Math.min(Math.max(0, Number(e.target.value)), layer.height - layer.cropBottom),
                          })
                        }
                        className="w-full bg-[#1f1f1f] rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1">
                        <Crop className="w-4 h-4" />
                        Left
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.floor(layer.width / 2)}
                        value={layer.cropLeft}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            cropLeft: Math.min(Math.max(0, Number(e.target.value)), layer.width - layer.cropRight),
                          })
                        }
                        className="w-full bg-[#1f1f1f] rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1">
                        <Crop className="w-4 h-4" />
                        Bottom
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.floor(layer.height / 2)}
                        value={layer.cropBottom}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            cropBottom: Math.min(Math.max(0, Number(e.target.value)), layer.height - layer.cropTop),
                          })
                        }
                        className="w-full bg-[#1f1f1f] rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1">
                        <Crop className="w-4 h-4" />
                        Right
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.floor(layer.width / 2)}
                        value={layer.cropRight}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            cropRight: Math.min(Math.max(0, Number(e.target.value)), layer.width - layer.cropLeft),
                          })
                        }
                        className="w-full bg-[#1f1f1f] rounded px-2 py-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2 text-[10px]">
                    <div className="flex-1">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={layer.lockAspect}
                          onChange={(e) => updateLayer(layer.id, { lockAspect: e.target.checked })}
                        />
                        Lock Aspect
                      </label>
                    </div>
                    <div className="text-[10px]">
                      Order: {layer.order} • Blend: {layer.blendMode}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

      </aside>

      {/* Canvas */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="flex gap-3 mb-2 flex-wrap">
          <div className="text-sm px-3 py-2 bg-[#1f1f1f] rounded flex items-center gap-2">
            <Frame className="w-4 h-4" />
            Workspace {canvasSize.w}×{canvasSize.h}
          </div>
        </div>

        <div
          className="relative flex-none shadow-lg rounded overflow-visible bg-amber-400 p-4"
          style={{
            width: canvasSize.w / 2,
            height: canvasSize.h / 2,
          }}
        >
          {/* actual workspace box with fixed aspect ratio */}
          <div
            className="relative mx-auto bg-amber-400 p-4"
            style={{
              width: canvasSize.w / 2,
              height: canvasSize.h / 2,
              background: "rgba(255,255,255,0.03)",
              overflow: "visible", // allow layers outside
            }}
            ref={containerRef}
          >
            {/* layers */}
            {layers
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((layer) => (
                <Rnd
                  key={layer.id}
                  size={{ width: layer.width / 2, height: layer.height / 2 }}
                  position={{ x: layer.x / 2, y: layer.y / 2 }}
                  bounds="parent"
                  lockAspectRatio={layer.lockAspect}
                  onDragStart={() => setActiveId(layer.id)}
                  onDragStop={(e, d) => {
                    updateLayer(layer.id, { x: d.x * 2, y: d.y * 2 });
                  }}
                  onResize={(e, direction, ref, delta, position) => {
                    if (resizeLock.current[layer.id]) return;
                    resizeLock.current[layer.id] = true;
                    requestAnimationFrame(() => {
                      const w = parseInt(ref.style.width, 10);
                      const h = parseInt(ref.style.height, 10);
                      updateLayer(layer.id, {
                        width: w * 2,
                        height: h * 2,
                        x: position.x * 2,
                        y: position.y * 2,
                      });
                      resizeLock.current[layer.id] = false;
                    });
                  }}
                  onResizeStop={(e, dir, ref, delta, position) => {
                    const w = parseInt(ref.style.width, 10);
                    const h = parseInt(ref.style.height, 10);
                    updateLayer(layer.id, {
                      width: w * 2,
                      height: h * 2,
                      x: position.x * 2,
                      y: position.y * 2,
                    });
                  }}
                  style={{
                    position: "absolute",
                    zIndex: layer.order,
                    visibility: layer.visible ? "visible" : "hidden",
                    mixBlendMode: layer.blendMode as any,
                    filter: `brightness(${layer.brightness}) saturate(${layer.saturation})`,
                    borderRadius: 6,
                    overflow: "visible",
                    boxShadow: layer.id === activeId ? "0 0 16px rgba(59,130,246,0.8)" : "0 0 8px rgba(0,0,0,0.5)",
                    cursor: "move",
                  }}
                  onClick={() => setActiveId(layer.id)}
                >
                  <div
                    style={{
                      width: layer.width / 2,
                      height: layer.height / 2,
                      overflow: "hidden",
                      position: "relative",
                      borderRadius: 6,
                      background: "transparent",
                    }}
                  >
                    <img
                      src={layer.src}
                      alt=""
                      draggable={false}
                      style={{
                        position: "absolute",
                        top: -layer.cropTop / 2,
                        left: -layer.cropLeft / 2,
                        width: (layer.width + layer.cropLeft + layer.cropRight) / 2,
                        height: (layer.height + layer.cropTop + layer.cropBottom) / 2,
                        objectFit: "cover",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                    {layer.overlayOpacity > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: layer.overlayColor,
                          opacity: layer.overlayOpacity,
                          pointerEvents: "none",
                          borderRadius: 6,
                        }}
                      />
                    )}
                  </div>
                </Rnd>
              ))}
            {/* border showing canvas area */}
            <div className="pointer-events-none absolute inset-0 border border-dashed border-gray-500 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
