"use client"


import { BLEND_MODES } from '@/constant';
import { Canvas, FabricImage, filters } from 'fabric';
import { BringToFront, SendToBack, StepBack, StepForward } from 'lucide-react'
import React, { Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from 'react'
import TextTool from './TextTool';

interface ToolBoxProp {
  fabricJs: React.MutableRefObject<Canvas | null>,
  setState: Dispatch<SetStateAction<StateProps[]>>,
  selectedId: string | null;
  state: StateProps[]
  shapeDesignDiv?: (selectedId: string, { }: Record<string, string | number>) => void
  shapePosition?: (selectedId: string, type: PositionProps) => void
}

type FilterProps = "Blur" | "Noise" | "Pixelate"

function ToolBox({ selectedId, fabricJs, state, setState }: ToolBoxProp) {

  const [activeItem, setActiveItem] = useState<StateProps>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    id: "",
    fill: "#c61010",
    type: "shape",
    rx: 0,
    ry: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    scale: 1,
    order: 0,
    globalCompositeOperation: "normal" as BlendMode, // Add this
  });
  const [toolboxSliding,setToolBoxSliding] = useState<boolean>(false)

  useEffect(() => {
    const activeItem = fabricJs.current?.getActiveObject();
    const selelectedItemProperties = state.find((v, i) => activeItem?.get("id") === v.id);

    if (!selelectedItemProperties) {
      return
    }

    console.log("selelectedItemProperties:- ", selelectedItemProperties);
    setActiveItem(selelectedItemProperties)
  }, [selectedId])

  const shapeDesignDiv = (selectedId: string, delta: Partial<StateProps & { rotatingPointOffset: number }>) => {
    // ye function sabhi element jo ki canvas par hai unko array ke roop main deta hai , find ki madat se selected ki sahayata se us element ko find kar lete hai 
    const shape = fabricJs.current?.getObjects().find(o => o.get("id") === selectedId);

    console.log("shapeDisignDiv:- ", shape);
    console.log("shapeDisignDiv:- ", );
    
    if (!shape) return;

    setState((prev) => prev.map((v, i) => v.id === selectedId ? ({ ...v, ...delta }) : v))

    // // ye aap ki state mai change kar ta hai
    setActiveItem((prev) => ({ ...prev, ...delta }))

    if (delta !== undefined) {
      // ye methods aap ke width ko change karne mai madat karta hai, new scaleX setting with width which are updated, other wise it will think previous width as scaleX = 1
      shape.set({
        ...delta
      });
      shape.setCoords(); // important: refresh bounding box
    }

    fabricJs.current?.renderAll();

  }

  const filterSetting = (selected:string,delta:Record<string,any>)=>{
    //ye function mere dawara apply kiye gaye item ko select karta hai
    const selectedItem = fabricJs.current?.getObjects().find((v,i)=> v.get("id") === selected);

    // agar selected item nahi hai to yhi se chale jao
    if (!selectedItem) return
    
    // i am checking because only image par hi filter lagta hai
    if (selectedItem instanceof FabricImage) {
      console.log("filterSetting",selectedItem?.get("filters"));

      // ye us selected item ke filters ko nikalta hai jis mai filter mai laga rha hu
      const firstBlurFilter = selectedItem?.get("filters").find((f:Record<"type",string>) => f.type === (Object.keys(delta)[0]=== "Blocksize" ? "Pixelate" : Object.keys(delta)[0]));
      
      console.log("firstBlurFilter",firstBlurFilter,Object.keys(delta)[0]);
      if (!firstBlurFilter) {

        let newFilter ;

        

        switch (Object.keys(delta)[0]) {
          case "Blur":
            newFilter = new filters.Blur({
              blur: delta.Blur 
            });
            break;
          case "Noise":
            newFilter = new filters.Noise({
              noise: delta.Noise 
            });
            break;
          case "Blocksize":
            newFilter = new filters.Pixelate({
              blocksize: delta.Blocksize 
            });
            break;
          case "Brightness":
            newFilter = new filters.Brightness({
              brightness: delta.Brightness 
            });
            break;
          case "Contrast":
            newFilter = new filters.Contrast({
              contrast: delta.Contrast 
            });
            break;
          case "Saturation":
            newFilter = new filters.Saturation({
              saturation: delta.Saturation 
            });
            break;
          case "Vibrance":
            newFilter = new filters.Vibrance({
              vibrance: delta.Vibrance 
            });
            break;
          default:
            break;
        }

        if (!newFilter) return;
        selectedItem.filters?.push(newFilter);
        selectedItem.applyFilters();
        fabricJs.current?.renderAll();
       
      }else{
        console.log(firstBlurFilter);
        const keys = Object.keys(delta)[0] as keyof typeof delta
        firstBlurFilter[keys.toLocaleLowerCase()] = delta[keys]
        selectedItem.applyFilters();
        fabricJs.current?.renderAll();    
      }
  
    }
    
    // // ye aap ki state mai change kar ta hai
    setActiveItem((prev) => ({ ...prev, ...delta }))
  }


  // this function is just for sendBack, sendFront, sendBackward, sendForward
  const shapePosition = (selectedId: string, type: PositionProps) => {
    console.log("shapePosition:- ", selectedId);

    const shape = fabricJs.current?.getObjects().find(o => o.get("id") === selectedId);
    console.log("shape:- ", shape);


    if (!shape) {
      return
    }

    if (type === "bringFront") {
      // Bring to front
      fabricJs.current?.bringObjectToFront(shape)
    } else if (type === "sendBack") {
      // Or send to back
      fabricJs.current?.sendObjectToBack(shape);
    } else if (type === "bringForward") {
      // Or one step forward
      fabricJs.current?.bringObjectForward(shape);
    } else if (type === "sendBackward") {
      // Or one step backward
      fabricJs.current?.sendObjectBackwards(shape)
    }

    fabricJs.current?.renderAll();
  }

  return (
    <div className='flex w-full flex-col gap-2 mt-2 p-2 overflow-auto historyScrollbar'> {selectedId ?
      <>
        <div className='text-black bg-white p-2 rounded-md'>
          {/* styling item */}
          <div className=' rounded-md shadow-md p-2 flex mt-2 flex-col '>
            <TextTool activeItem={activeItem} selectedId={selectedId} shapeDesignDiv={shapeDesignDiv} filterSetting={filterSetting} />

            <div className='flex flex-col gap-2 flex-wrap'>
              <span className='spanStyle zoomingOutIn'>
                <span className='font-bold mr-2'>Back</span>
                {<SendToBack className='' size={22} onClick={() => shapePosition(selectedId ?? "", "sendBack")} />}
              </span>
              <span className='spanStyle zoomingOutIn'>
                <span className='font-bold mr-2'>Front</span>
                {<BringToFront size={22} onClick={() => shapePosition(selectedId ?? "", "bringFront")} />}
              </span>
              <span className='spanStyle zoomingOutIn'>
                <span className='font-bold mr-2'>StepBack</span>
                {<StepBack size={22} onClick={() => shapePosition(selectedId ?? "", "sendBackward")} />}
              </span>
              <span className='spanStyle zoomingOutIn'>
                <span className='font-bold mr-2'>StepForward</span>
                {<StepForward size={22} onClick={() => shapePosition(selectedId ?? "", "bringForward")} />}
              </span>
            </div>
          </div>
        </div>
      </>
      :
      <></>
    }
    </div>
  )
}

export default ToolBox