"use client"
import { Copy, Image, ImageUpIcon, InspectIcon, Layers, ShapesIcon, Trash2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { DraggableEvent } from 'react-draggable';
import { DraggableData, Position, ResizableDelta, Rnd } from "react-rnd";

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
  | "luminosity"


interface FilterProps {
  blur: number
  brightness: number
  contrast: number
  dropShadow: number
  grayscale: number
  hueRotate: number
  invert: number
  opacity: number
  saturate: number
  sepia: number
}

interface StateProps {
  x: number
  y: number
  width: number
  height: number
  id: string
  bgColor: string
  borderRadius?: number
  src?: string | null
  scale?: number
  filter?: Partial<FilterProps>
  blendMode: BlendMode
}

function ProImageEditor() {
  const [activeId, setActiveId] = useState<string>("");

  const [state, setState] = useState<StateProps[]>([
    { id: "image_1", x: 0, y: 0, width: 300, height: 250, bgColor: "#fff", src: null, blendMode: "normal", scale: 1 }
  ]);

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

  const shapeInserting = () => {
    const randomId = Math.round(Math.random() * 1000)
    const newShape: StateProps = {
      id: `image_${randomId}`,
      x: 0,
      y: 0,
      width: 300,
      height: 250,
      bgColor: "#fff",
      blendMode: "normal",
      scale: 1
    }

    setState((prev) => [newShape, ...prev])
  }

  const shapeDesignDiv = (selectedId: string, delta: Partial<StateProps>,) => {
    // console.log(delta);

    const selectDiv: StateProps | undefined = state.find((v, i) => v.id === selectedId);

    if (!selectDiv) {
      return
    }

    console.log("selectDiv:- ", selectDiv);
    console.log("delta:- ", { ...delta });

    const updatedDiv = {
      ...selectDiv,
      ...delta,
    };

    // console.log(updatedDiv);


    setState((prev) => {

      const newValu = prev.map((v, i) => {
        if (v.id === selectedId) {
          return { ...updatedDiv }
        } else {
          return v
        }
      });

      // console.log("newValu:- ", newValu);


      return newValu
    })
  }

  const deleteLayer = (divIndex: string) => {
    const restImage = state.filter((v, i) => v.id !== divIndex);
    console.log("restImage:- ", restImage);

    setState(restImage)
  }

  const fileInserting = (file: FileList) => {
    console.log(file);
    console.log("Array from:- ", Array.from(file));
    setActiveId("")
    const ImageUrl = URL.createObjectURL(file[0]);

    console.log("ImageUrl:- ", ImageUrl);
    const newShape: StateProps = {
      id: `image_${file[0].name}`, x: 0, y: 0, width: 300, height: 250, bgColor: "#fff", scale: 1, src: ImageUrl, blendMode: "normal"
    }

    setState((prev) => [newShape, ...prev])
  }

  const copyLayer = (selectedId: string) => {
    const selectDiv: StateProps | undefined = state.find((v, i) => v.id === selectedId);

    if (!selectDiv) {
      return
    }

    const newDiv = {
      ...selectDiv,
      id: selectDiv.id + "copy"
    };

    setState((prev) => [newDiv, ...prev])

  }

  return (
    <div>
      <h1>Image Editor</h1>
      <main className='flex gap-2'>
        <div className='bg-amber-200 w-[400px] basis-[400px] overflow-auto historyScrollbar p-4' style={{ height: `calc(-84px + 100vh)` }}>
          <div className='flex flex-col gap-4'>
            {/* shape */}
            <label htmlFor="shape_insert" className='flex gap-2 bg-white rounded-md w-fit p-2 cursor-pointer' onClick={shapeInserting}>
              <ShapesIcon size={22} color='black' />
              <span>Insert</span>
            </label>
            {/* file  use same htmlFor and id in input for activating that*/}
            <label htmlFor='file' className='flex gap-2 bg-white rounded-md w-fit p-2 cursor-pointer'>
              <ImageUpIcon size={22} color='black' />
              <span>Insert</span>
              <input id='file' type="file" accept='image/*' multiple className='hidden' onChange={(e) => {
                if (e.target.files) { fileInserting(e.target.files) }
              }} />
            </label>
            {/* layer */}
            <div>
              <span>
                <Layers size={22} color='black' />
              </span>
              <div className='flex flex-col gap-2 mt-2'>
                {state.length > 0 && state.map((v, i) => (
                  <div key={v.id}>
                    <span onClick={() => setActiveId(v.id)} className={`w-full flex gap-2 justify-between cursor-pointer p-2 rounded-md group/delete hover:bg-gray-400 ${activeId === v.id ? "bg-gray-400" : ""}`}>
                      <span>File {v.id}</span>
                      <span className='flex'>
                        <Copy onClick={() => copyLayer(v.id)} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer hidden group-hover/delete:block' />
                        <Trash2Icon onClick={() => deleteLayer(v.id)} size={25} className='hover:bg-amber-700/90 p-1 rounded-md cursor-pointer hidden group-hover/delete:block' />
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* CANVAS AREA */}
        <div className='bg-black flex-1 flex justify-center items-center relative' style={{ height: `calc(-84px + 100vh)` }}>
          {/* styling */}
          <div className='absolute top-0 w-full p-2'>
              {activeId.trim().length>0 &&
            <div className='bg-white rounded-md shadow-md p-2 flex justify-center items-center'>
                {[state.find((v, i) => v.id === activeId)].map((v, i) => (
                  <div className='flex gap-2 justify-center' key={i}>
                    <span>
                      <span className='font-bold'>File </span> {v?.id??""}</span>
                    <span>
                      <span className='font-bold'>Width </span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.width??0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { width: Number(e.target.value) }) }} />}
                    </span>
                    <span>
                      <span className='font-bold'>Height </span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.height??0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { height: Number(e.target.value) }) }} />}
                    </span>
                    <span>
                      <span className='font-bold'>Position-X </span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.x??0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { x: Number(e.target.value) }) }} />}
                    </span>
                    <span>
                      <span className='font-bold'>Position-Y </span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.y??0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { y: Number(e.target.value) }) }} />}
                    </span>
                    <span>
                      <span className='font-bold'>Blend </span>
                      {activeId && <select
                        className='font-bold inputNumStyle'
                        style={{ width: "100px" }}
                        onChange={(e) => {
                          shapeDesignDiv(v?.id ? v.id : "", { blendMode: e.target.value as BlendMode })
                        }}
                        value={v?.blendMode??"normal"} name="blendMode" id="blendMode">
                        {BLEND_MODES.map((v, i) => (
                          <option className='font-bold' key={i} id={"blendMode"} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>}
                    </span>
                    <span>
                      <span className='font-bold mr-2'>Scale</span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.scale??1} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { scale: Number(e.target.value) }) }} />}

                    </span>
                    <span className='spanStyle'>
                      <span className='font-bold mr-2'>Color</span>
                      {activeId && <input type="color" className='h-[30px]' min={1} value={v?.bgColor??"#fff"} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { bgColor: (e.target.value) }) }} />}

                    </span>
                    <span className='spanStyle'>
                      <span className='font-bold mr-2'>Border Radius</span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.borderRadius ?? 0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { borderRadius: Number(e.target.value) }) }} />}
                    </span>
                    <span className='spanStyle'>
                      <span className='font-bold mr-2'>Back</span>
                      {activeId && <input type="number" className='inputNumStyle' min={1} value={v?.borderRadius ?? 0} onChange={(e) => { shapeDesignDiv(v?.id ? v.id : "", { borderRadius: Number(e.target.value) }) }} />}
                    </span>
                  </div>
                ))}
            </div>
              }
          </div>

          <div onClick={(e) => {
            setActiveId("")
          }} className='w-1/2 h-1/2 bg-amber-700 overflow-hidden relative' style={{ aspectRatio: "16/9" }}>
            {state.length > 0 && state.map((v, i) => (
              <Rnd key={v.id}
                position={{ x: v.x, y: v.y }}
                size={{ height: v.height, width: v.width }}
                className={`absolute overflow-hidden ${v.id === activeId ? "border-2 border-black" : ""}`}
                default={{ height: v.height, width: v.width, x: v.x, y: v.y }}
                style={{ mixBlendMode: `${v.blendMode}`, borderRadius: `${v.borderRadius}%` }}
                onDragStart={(e) => {
                  setActiveId(v.id)
                }}
                onDragStop={(e, data) => {
                  shapeDesignDiv(v.id, { x: data.x, y: data.y })
                }}
                onResize={(e, dir, elementRef, delta, position) => {
                  setActiveId(v.id)
                  requestAnimationFrame(() => {
                    shapeDesignDiv(v.id, { width: parseInt(elementRef.style.width, 10), height: parseInt(elementRef.style.height, 10), ...position })
                  })
                }}
                onResizeStop={(e, dir, elementRef, delta, position) => {
                  shapeDesignDiv(v.id, { width: parseInt(elementRef.style.width, 10), height: parseInt(elementRef.style.height, 10), ...position })
                }}
              >
                <div className='relative'>
                  {v.src ?
                    <img onClick={(e) => e.stopPropagation()} draggable={false} src={v.src} style={{ width: `${v.width}px`, height: `${v.height}px `, transform: `scale(${v.scale ?? 1})` }} className={`fill relative`}
                    // style={{ width: `${v.width}px`, height: `${v.height}px` }}
                    ></img>
                    :
                    <div onClick={(e) => e.stopPropagation()} className='absolute' style={{ backgroundColor: `${v.bgColor}`, transform: `scale(${v.scale ?? 1})`, height: v.height, width: v.width }}></div>}
                </div>
              </Rnd>
            ))}
          </div>
        </div>
      </main>

    </div>
  )
}

export default ProImageEditor