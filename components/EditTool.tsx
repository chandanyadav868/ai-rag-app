import { EditTooling } from '@/constant'
import { Canvas, FabricImage, FabricObject, FabricObjectProps, Line, ObjectEvents, Path, PencilBrush, Polyline, Rect, SerializedObjectProps, StaticCanvas } from 'fabric';
import { Cross, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CloseComponents from './CloseComponents';

interface EditToolProp {
    aiEditShowFn: React.Dispatch<React.SetStateAction<boolean>>;
    selectedId: string | null;
    fabricjs: React.MutableRefObject<Canvas | null>
    aiImageFn: (file:Blob) => void;
}

function EditTool({ aiEditShowFn, fabricjs, selectedId,aiImageFn }: EditToolProp) {
    // use are using two ref first is for canvas and second is for holding all methods of fabric.js canvas manupulate
    let canvasToolingRef = useRef<HTMLCanvasElement | null>(null);
    let secondFabricJs = useRef<Canvas | null>(null);

    const copyingItemFn = useCallback(async (selectedItem: FabricObject<Partial<FabricObjectProps>, SerializedObjectProps, ObjectEvents> | undefined) => {
        let copying = await selectedItem?.clone();
        copying?.set({
            id: selectedId,
            scaleX: 0.5,
            scaleY: 0.5
        })
        return copying
    }, []);


    useEffect(() => {
        const funrunning = async () => {
            if (!canvasToolingRef.current) {
                return
            };

            console.log(selectedId, fabricjs);

            const selectedItem = fabricjs.current?.getObjects().find((l, i) => l.get("id") === selectedId);

            console.log(selectedItem);

            const newItem = await copyingItemFn(selectedItem);

            secondFabricJs.current = new Canvas(canvasToolingRef.current, {
                width: newItem?.get("width")/2,
                height: newItem?.get("height")/2,
                backgroundColor: "azure",

            });

            if (!newItem) {
                return
            }

            secondFabricJs.current.add(newItem);
        }
        funrunning()
        return () => {
            secondFabricJs?.current?.dispose();
            canvasToolingRef.current = null
            secondFabricJs.current = null
        }
    }, []);


    const startRectDrawing = () => {
        let isDrawing = false
        // check that secondFabric.current have not value of null, it is initialised with methods of canvas
        if (!secondFabricJs.current) {
            return
        }
        // i have declare 3 variable which will be updated, for drawind rectangle, knowing width and height
        let RectX: number, RectY: number, Rectangle: Rect;

        // this will help in showing a cross line
        // secondFabricJs.current.isDrawingMode = true

        // as i will click on the secondFabricJs canvas it will trigger
        secondFabricJs.current?.on("mouse:down", (opt) => {
            // when i will click on the canvas then isDrawing will be true
            isDrawing = true
            console.log(opt);
            // opt hold a object with different property, in which i extract scenePoint with the object Spread, which include x and y value where i have clicked
            const { scenePoint } = opt
            console.log(scenePoint);

            // i have set x and y value where i fist clicked in canvas
            RectX = scenePoint.x
            RectY = scenePoint.y

            // maine a rectangle initialised kar diya hai
            Rectangle = new Rect({
                left: RectX,
                top: RectY,
                fill: "rgba(255,0,0,0.3)",
                width: 0,
                height: 0
            });

            // maine us rectangle ko canvas mai phit kar diya hai, jis ke pass 0 width aur 0 height hai
            secondFabricJs.current?.add(Rectangle)
        })

        // this event will run every time when mouse is moving over the canvas
        secondFabricJs.current.on("mouse:move", (opt) => {
            // if isDrawing value is falsy then return, because when i will click on the drawing the this event will be attached to the canvas, and will be listened every time, so i am checking
            if (!isDrawing) return
            // i have collected scenePoint object which hold the x and y point which are being updated when mouse is moving
            const { scenePoint } = opt;
            //  and previouse {x: 848.90625, y: 47.515625} present848.90625 48.515625
            console.log(scenePoint.x, scenePoint.y);

            Rectangle.set({
                width: scenePoint.x - RectX,
                height: scenePoint.y - RectY
            });

            secondFabricJs.current?.renderAll()
        })

        // when mouse will be lift off then isDrawing will be false
        secondFabricJs.current.on("mouse:up", () => {
            isDrawing = false
            if (!secondFabricJs.current) return
            // secondFabricJs.current.isDrawingMode = false
        })
    }

    const startLineDrawing = () => {
        let isDrawing = false;
        let line: Line;
        secondFabricJs.current?.on("mouse:down", (opt) => {
            isDrawing = true
            const { scenePoint } = opt;
            console.log(scenePoint);

            line = new Line([scenePoint.x, scenePoint.y, scenePoint.x, scenePoint.y], {
                strokeWidth: 2,
                fill: "red",
                stroke: "red",
                originX: "center",
                originY: "center",
            });

            secondFabricJs.current?.add(line)
        });

        secondFabricJs.current?.on("mouse:move", (opt) => {
            if (!isDrawing) return;
            const { scenePoint } = opt
            console.log(scenePoint);


            line.set({
                x2: scenePoint.x,
                y2: scenePoint.y
            });

            secondFabricJs.current?.renderAll();
        });

        // secondFabricJs.current?.on("mouse:up",()=>{
        //     isDrawing = false
        // })
    }

    const startConnectedFreeDrawing = () => {
        // mai secondFabricJs ko check kar rha hu ki kya ye falsy value to nhi hai
        if (!secondFabricJs.current) return;

        // 2. Enable free drawing, ye aap ki intialised ki property ko true set karta hai, jo ki btata hai ki canvas drawing ki use mai hai
        secondFabricJs.current.isDrawingMode = true;

        // 3. Set brush options
        secondFabricJs.current.freeDrawingBrush = new PencilBrush(secondFabricJs.current);
        secondFabricJs.current.freeDrawingBrush.width = 5;        // stroke width
        secondFabricJs.current.freeDrawingBrush.color = "red";    // stroke color
    }

    const clipImage = () => {
        const image = secondFabricJs.current?.getObjects().find((l, i) => l.get("type") === "image");

        if (!image || !secondFabricJs.current) {
            return
        }

        // Step 2: Create a path (example path: polygon-like shape)
        let path = new Path("M 100 100 L 200 100 L 200 200 L 100 200 z", {
            fill: "transparent",
            stroke: "red",
            strokeWidth: 2,
            selectable: true,
        });

        secondFabricJs.current.add(path);

        image.clipPath = new Path("M 100 100 L 200 100 L 200 200 L 100 200 z", {
            absolutePositioned: true, // 🔑 very important, uses global coords
        });

        fabricjs.current?.renderAll()
    }


    const stopDrawing = () => {
        if (!secondFabricJs.current) return
        const path = secondFabricJs.current.getObjects()
            .find((l, i) => l.get("type") === "path");
        const image = secondFabricJs.current.getObjects()
            .find((l, i) => l.get("type") === "image");

        console.log(path);
        if (!image || !path) {
            return
        }
        path.set({
            absolutePositioned: true, // 🔑 very important, uses global coords
        })
        image.clipPath = path
        secondFabricJs.current.renderAll();

        secondFabricJs.current.isDrawingMode = false;
        secondFabricJs.current?.off("mouse:down")
        secondFabricJs.current?.off("mouse:move")
        secondFabricJs.current?.off("mouse:up")
    }


    const exporting = async () => {
    if (!secondFabricJs.current) return;

    // find your image and path objects
    const img = secondFabricJs.current.getObjects("image")[0];
    const clipPath = secondFabricJs.current.getObjects("path")[0];

    console.log(img,selectedId);
    
    secondFabricJs.current.backgroundColor = "transparent"; // Set background to transparent
     
    const imageData = await secondFabricJs.current.toBlob({
         multiplier: 2, // or higher, depending on how sharp you want
        enableRetinaScaling: true,
        filter: (obj) => {
            // Filter to include only the image with the specified ID
            return obj.type === "image" && img.get("id") === selectedId;
        },
        left: clipPath.left,
        quality:1,
        top: clipPath.top,
        height:clipPath.height,
        width:clipPath.width,
        format: "png",
    })

    if (!imageData) return;

    aiImageFn(imageData)
   

    // fileInserting();
    console.log("Cropped image exported as cropped-image.png");

    console.log("imageData:- ", imageData);
};


    return (
        <div className='absolute h-screen w-screen bg-amber-500/10 top-0 z-50 backdrop-blur-3xl flex text-justify items-center'>
            <div className='w-[80%] h-[80%] mx-auto bg-amber-900/50 rounded-md relative p-2 flex flex-col'>
                {/* close button */}
                <CloseComponents onClick={() => aiEditShowFn(false)}/>

                {/* features */}
                <div className='bg-white rounded-md p-1 flex justify-center'>
                    {EditTooling.map((t, i) => (
                        <span key={i} className='font-bold bg-gray-300 cursor-pointer rounded-md p-1 zoomingOutIn'>{t}</span>
                    ))}
                </div>

                <div className='flex items-center flex-1'>
                    {/* canvas */}
                    <div className='flex gap-4'>
                        <canvas style={{ scale: 1 }} ref={canvasToolingRef}></canvas>

                        {/* tooling shape */}
                        <div className='flex flex-col gap-2'>
                            <span
                                onClick={startConnectedFreeDrawing}
                                className="font-bold bg-gray-300 cursor-pointer rounded-md p-1 zoomingOutIn"
                            >
                                Drawing
                            </span>
                            <span
                                onClick={stopDrawing}
                                className="font-bold bg-gray-300 cursor-pointer rounded-md p-1 zoomingOutIn"
                            >
                                Crop
                            </span>

                            <span
                                onClick={exporting}
                                className="font-bold bg-gray-300 cursor-pointer rounded-md p-1 zoomingOutIn"
                            >
                                Insert
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditTool