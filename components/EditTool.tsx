import { EditTooling } from '@/constant'
import { Canvas, FabricImage, FabricObject, FabricObjectProps, Group, Line, ObjectEvents, Path, PencilBrush, Polyline, Rect, SerializedObjectProps, StaticCanvas } from 'fabric';
import { Cross, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CloseComponents from './CloseComponents';

interface EditToolProp {
    aiEditShowFn: React.Dispatch<React.SetStateAction<boolean>>;
    selectedId: string | null;
    fabricjs: React.MutableRefObject<Canvas | null>
    aiImageFn: (file: Blob) => void;
}

function EditTool({ aiEditShowFn, fabricjs, selectedId, aiImageFn }: EditToolProp) {
    // use are using two ref first is for canvas and second is for holding all methods of fabric.js canvas manupulate
    // console.log({ aiEditShowFn, fabricjs, selectedId,aiImageFn })

    let canvasToolingRef = useRef<HTMLCanvasElement | null>(null);
    let secondFabricJs = useRef<Canvas | null>(null);

    console.log({ aiEditShowFn, fabricjs, selectedId, aiImageFn });


    useEffect(() => {

        const funrunning = async () => {
            if (!canvasToolingRef.current || !selectedId) return

            const selectedItem = fabricjs.current?.getObjects().find((l, i) => l.get("id") === selectedId);

            if (!selectedItem) return

            /**
                * CRITICAL FIX: Dispose existing canvas BEFORE creating new one
                * dispose() returns a Promise, so we must await it
            */
            if (secondFabricJs.current) {
                console.log('Disposing existing canvas...');
                try {
                    await secondFabricJs.current.dispose();
                    secondFabricJs.current = null;
                    console.log('Canvas disposed successfully');
                } catch (error) {
                    console.error('Error disposing canvas:', error);
                    // Force null even if dispose fails
                    secondFabricJs.current = null;
                }
            }

            const newItem = await selectedItem.clone();

            newItem?.set({ id: selectedId, left: 0, top: 0 })

            if (!canvasToolingRef.current) return
            console.log("Data:- ", canvasToolingRef.current);

            let width = newItem.getScaledWidth();
            let height = newItem.getScaledHeight();
            console.log({ width, height });


            secondFabricJs.current = new Canvas(canvasToolingRef.current, {
                width: 720,
                height: 480,
                backgroundColor: "azure",
            });
            secondFabricJs.current.add(newItem);
        }
        funrunning()
        return () => {
            canvasToolingRef.current = null;
            secondFabricJs?.current?.dispose()
                .then((res) => {
                    console.log({ cleanUpUseEffect: res })
                })
                .catch((err) => {
                    console.log(`Error in deleting:- `, err)
                })
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
        console.log("Data:- ", secondFabricJs.current);
        if (!secondFabricJs.current) {
            return
        };

        // 2. Enable free drawing, ye aap ki intialised ki property ko true set karta hai, jo ki btata hai ki canvas drawing ki use mai hai
        secondFabricJs.current.isDrawingMode = true;

        // 3. Set brush options
        secondFabricJs.current.freeDrawingBrush = new PencilBrush(secondFabricJs.current);

        secondFabricJs.current.freeDrawingBrush.width = 5;     // stroke width
        secondFabricJs.current.freeDrawingBrush.color = "red";    // stroke color
        secondFabricJs.current.freeDrawingBrush.strokeDashArray = [10, 10]
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


    /**
 * Stop drawing and apply all paths as a FILLED clip mask
 * 
 * Key issue: Paths with only stroke don't work as clip masks
 * Solution: Convert stroked paths to filled regions
 */
    const stopDrawing = () => {
        if (!secondFabricJs.current) {
            console.error('Canvas not initialized');
            return;
        }

        console.log('All canvas objects:', secondFabricJs.current.getObjects());

        /**
         * Get ALL path objects (not just the first one)
         */
        const allPaths = secondFabricJs.current
            .getObjects()
            .filter((obj) => obj.type === 'path') as Path[];

        /**
         * Find the base image to clip
         */
        const image = secondFabricJs.current
            .getObjects()
            .find((obj) => obj.type === 'image');

        console.log({
            pathsFound: allPaths.length,
            imageFound: !!image,
        });

        /**
         * Validation
         */
        if (!image) {
            console.error('No image found to clip');
            return;
        }

        if (allPaths.length === 0) {
            console.warn('No paths drawn');
            return;
        }

        /**
         * CRITICAL FIX: Convert all paths to FILLED regions
         * 
         * Problem: Stroked paths only show the outline
         * Solution: Set fill and remove stroke for clip mask
         */
        allPaths.forEach((path) => {
            path.set({
                fill: 'black',           // Fill the path (color doesn't matter for clip)
                stroke: undefined,        // Remove stroke
                strokeWidth: 0,          // Ensure no stroke width
                absolutePositioned: true, // Use canvas coordinates
            });
        });

        /**
         * Apply clip based on number of paths
         */
        if (allPaths.length === 1) {
            console.log('Applying single path as clip');
            image.clipPath = allPaths[0];
        } else {
            console.log(`Grouping ${allPaths.length} paths for clip`);

            /**
             * Create a Group containing all filled paths
             * Group acts as a union - shows image where ANY path exists
             */
            const clipGroup = new Group(allPaths, {
                absolutePositioned: true,
            });

            image.clipPath = clipGroup;
        }

        /**
         * Remove the path objects from canvas
         * (they're now part of the clipPath, not needed as visible objects)
         */
        allPaths.forEach((path) => {
            secondFabricJs.current?.remove(path);
        });

        /**
         * Render the clipped result
         */
        secondFabricJs.current.renderAll();

        /**
         * Clean up drawing mode
         */
        secondFabricJs.current.isDrawingMode = false;
        secondFabricJs.current.off('mouse:down');
        secondFabricJs.current.off('mouse:move');
        secondFabricJs.current.off('mouse:up');
        secondFabricJs.current.off('path:created');

        console.log('✅ Clip applied - image visible inside filled paths');
    };


    const exporting = async () => {
        if (!secondFabricJs.current) return;

        // find your image and path objects
        const img = secondFabricJs.current.getObjects("image")[0];
        const clipPath = secondFabricJs.current.getObjects("path")[0];

        console.log(img, selectedId);

        secondFabricJs.current.backgroundColor = "transparent"; // Set background to transparent

        const imageData = await secondFabricJs.current.toBlob({
            multiplier: 2, // or higher, depending on how sharp you want
            enableRetinaScaling: true,
            filter: (obj) => {
                // Filter to include only the image with the specified ID
                return obj.type === "image" && img.get("id") === selectedId;
            },
            left: clipPath?.left ?? 0,
            quality: 1,
            top: clipPath?.top ?? 0,
            height: clipPath?.height ?? 0,
            width: clipPath?.width ?? 0,
            format: "png",
        })

        if (!imageData) return;

        aiImageFn(imageData)

        // fileInserting();
        console.log("Cropped image exported as cropped-image.png");

        console.log("imageData:- ", imageData);
    };

    const toolsTask = [
        {
            name: "Drawing",
            onclick: startConnectedFreeDrawing
        },
        {
            name: "Crop",
            onclick: stopDrawing
        },
        {
            name: "Insert",
            onclick: exporting
        },
    ]

    return (
        <div className='absolute h-screen w-screen bg-amber-500/10 top-0 z-50 backdrop-blur-3xl flex text-justify items-center'>
            <div className='w-[95%] h-[80%] mx-auto bg-amber-900/50 rounded-md relative p-2 flex flex-col'>
                {/* close button */}
                <CloseComponents onClick={() => aiEditShowFn(false)} />

                {/* features */}
                <div className='bg-white rounded-md p-1 flex justify-center'>
                    {EditTooling.map((t, i) => (
                        <span key={i} className='font-bold bg-gray-800 cursor-pointer rounded-md p-1 px-2 zoomingOutIn'>{t}</span>
                    ))}
                </div>

                <div className='flex items-center flex-1'>
                    <div className='flex gap-4 flex-col'>
                        {/* tooling shape */}
                        <div className='flex gap-2'>
                            {
                                toolsTask.map((v,i) => (
                                    <span key={i}
                                        onClick={() => v.onclick()}
                                        className="font-bold bg-gray-800 cursor-pointer rounded-md p-1 px-2 zoomingOutIn">
                                        {v.name}
                                    </span>
                                ))
                            }
                        </div>
                        {/* canvas */}
                        <canvas style={{ scale: 1 }} ref={canvasToolingRef}></canvas>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditTool