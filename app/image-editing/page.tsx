"use client"
import { ArrowLeftSquare, ArrowRightSquare, CheckCircleIcon, Copy, Download, Edit2, EyeIcon, EyeOff, ImageUpIcon, Layers, Loader2Icon, LockKeyhole, LockKeyholeOpen, Minus, Plus, ShapesIcon, Text, Trash2Icon, UploadCloud } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from "react-dom"
import { Canvas, Rect, FabricImage, SerializedRectProps, ObjectEvents, ImageProps, SerializedImageProps, Textbox, TextboxProps, SerializedTextboxProps, ITextEvents, Triangle, Circle, PencilBrush, StaticCanvas } from 'fabric'; // browser
import Image from 'next/image';
import { PromptComponencts } from '@/components/PromptComponencts';
import { ai, aspectRatioImage, slidingImage } from '@/constant';
import ToolBox from '@/components/ToolBox';
import EditTool from '@/components/EditTool';
import { useContextStore } from '@/components/CreateContext';



function ProImageEditor() {

  const [activeId, setActiveId] = useState<string | null>(null);
  const [canvasOrientation, setCanvasOrientation] = useState<string | null>("16/9");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasDivRef = useRef<HTMLDivElement | null>(null);
  const [somethingDrop, setSomethingDrop] = useState<boolean>(false);
  // const [state, setState] = useState<StateProps[]>([]);
  const { state, setState } = useContextStore();
  const [aiEdit, setAiEdit] = useState<boolean>(false);
  const [slidingLayer, setSlidingLayer] = useState<boolean>(true);
  const [slidingGenerateImage, setSlidingGenerateImage] = useState<boolean>(true);
  const [layerMenu, setLayerMenu] = useState<string>("Layer")

  console.log("state:- ", state);


  // ye function run hata hai first time jab aap ka components mounts hota hai
  const fabricJs = useRef<Canvas | null>(null);


  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const dropOverImage = (e: MouseEvent) => {
      e.preventDefault()
      setSomethingDrop(true)
    }

    const dropImage = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return
      droppingFile(e.dataTransfer.files)
      setSomethingDrop(false);
      console.log();
    }

    const deletingObj = (e: KeyboardEvent) => {
      // console.log("key:- ", e.key);
      if (e.key === "Delete") {

        if (!fabricJs.current) {
          return
        }

        const activeObjects = fabricJs.current?.getActiveObjects();
        console.log("allSelectedObj:- ", activeObjects);
        // Remove from canvas
        if (!activeObjects) return


        activeObjects.forEach((obj, i) => {
          console.log("deletingObj:- ", obj.get("id"), i);
          deleteLayer(obj.get("id"));
        });
      }


    }


    const newAspectration = aspectRatioImage.find((v, _) => v.orientation === canvasOrientation);

    fabricJs.current = new Canvas(canvasRef.current, { width: newAspectration?.width, height: newAspectration?.height, backgroundColor: "azure", allowTouchScrolling: true, selectionColor: "red" });


    fabricJs.current.on("selection:created", (e) => {
      const activeObject = e.selected[0].get("id");
      setActiveId(activeObject); // store in useRef
      console.log("Selected:", activeObject);
    });

    fabricJs.current.on("selection:updated", (e) => {
      const activeObject = e.selected[0].get("id");
      setActiveId(activeObject);;
      console.log("Selection updated:", activeObject);
    });

    fabricJs.current.on("selection:cleared", () => {
      setActiveId(null);
      console.log("Selection cleared");
    });


    window.addEventListener("dragover", dropOverImage);
    window.addEventListener("drop", dropImage);

    setActiveId(null);
    window.addEventListener("keydown", deletingObj);
    // i want to change color of outer box when selected item in fabric.js write methods for that

    fabricJs.current.renderAll()

    return () => {
      window.removeEventListener("dragover", dropOverImage)
      window.removeEventListener("drop", dropImage)
      window.removeEventListener("keydown", deletingObj);

      setState([])

      // ✅ Dispose the old canvas to prevent errors
      fabricJs.current?.dispose();
      fabricJs.current = null;
    }

  }, []);

  useEffect(() => {
  if (!canvasRef.current) return;

  const newAspect = aspectRatioImage.find(v => v.orientation === canvasOrientation);
  if (!newAspect) return;

  let { width, height } = newAspect;
  const offset = 140;

  // Available screen space (header/footer ke liye offset minus karke)
  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight - offset;

  // Scale ratio calculate karo (jo bhi chhota hoga usko use karna hoga taaki pura image fit ho jaye)
  const widthRatio = availableWidth / width;
  const heightRatio = availableHeight / height;
  const scale = Math.min(widthRatio, heightRatio);

  // Final scaled size
  width = width * scale;
  height = height * scale;

  console.log("Final width:", width, "Final height:", height);

  // Update fabric.js canvas dimensions
  fabricJs.current?.setDimensions({ width, height });
  fabricJs.current?.renderAll();
}, [canvasOrientation]);



  // random data
  const random = crypto.randomUUID()

  const maxFindingFn = () => {
    const stateMax = state.map((v, _) => v.order ? v.order : 0)
    const modified = stateMax.length > 0 ? stateMax : [0]
    const maxOrder = Math.max(...modified);
    return maxOrder
  }

  const zoomingInOut = (type: string) => {

    if (!fabricJs.current) return
    console.log(fabricJs.current.getZoom());
    if (type === "zoomedIn") {
      fabricJs.current.setZoom(fabricJs.current.getZoom() + 0.1);
    } else {
      fabricJs.current.setZoom(fabricJs.current.getZoom() - 0.1);

    }
  };


  const shapeEventAdding = (shape: Rect | Triangle<Record<string, number | string | undefined>, SerializedRectProps, ObjectEvents>) => {
    shape.on("modified", ({ target, action }) => {
      const id = target.get("id");
      console.log(target, action);

      const obj = {
        globalCompositeOperation: target.get("globalCompositeOperation"),
        top: target.get("top"),
        left: target.get("lect"),
        width: Number(Math.round(target.getScaledWidth()).toFixed(0)),
        fill: target.get("fill"),
        height: Number(Math.round(target.getScaledHeight()).toFixed(0)),
        angle: target.get("angle"),
      }


      setState((prev) => {
        return prev.map((l, _) => l.id === id ? ({ ...l, ...obj }) : l)
      })
    })
    shape.on("scaling", ({ transform, pointer }) => {
      console.log(pointer);

      const id = transform.target.get("id")
      const width = Number(Math.round(transform.target.getScaledWidth()).toFixed(0));
      const height = Number(Math.round(transform.target.getScaledHeight()).toFixed(0));

      setState((prev) => {
        return prev.map((l, _) => l.id === id ? ({ ...l, width, height }) : l)
      })
    })
  }

  const textEventAdding = (shape: Textbox<Partial<TextboxProps>, SerializedTextboxProps, ITextEvents>) => {
    shape.on("modified", ({ target }) => {
      const id = target.get("id");
      console.log(target);

      const obj = {
        globalCompositeOperation: target.get("globalCompositeOperation"),
        top: target.get("top"),
        left: target.get("lect"),
        width: target.getScaledWidth(),
        fill: target.get("fill"),
        height: target.getScaledHeight(),
        angle: target.get("angle"),
      }
      setState((prev) => {
        return prev.map((l, _) => l.id === id ? ({ ...l, ...obj }) : l)
      })
    })
    shape.on("scaling", ({ e, transform, pointer }) => {
      const id = transform.target.get("id")
      const width = transform.target.getScaledWidth();
      const height = transform.target.getScaledHeight();
      setState((prev) => {
        return prev.map((l, _) => l.id === id ? ({ ...l, width, height }) : l)
      })
    })
  }

  const imageEventAdding = (shape: FabricImage<Partial<ImageProps>, SerializedImageProps, ObjectEvents>) => {
    shape.on("modified", ({ target }) => {
      const id = target.get("id");
      console.log(target);

      const obj = {
        globalCompositeOperation: target.get("globalCompositeOperation"),
        top: target.get("top"),
        left: target.get("lect"),
        width: target.getScaledWidth(),
        fill: target.get("fill"),
        height: target.getScaledHeight(),
        angle: target.get("angle"),
      }
      setState((prev) => {
        return prev.map((l, _) => l.id === id ? ({ ...l, ...obj }) : l)
      })
    })
    shape.on("scaling", ({ e, transform, pointer }) => {
      const id = transform.target.get("id")
      const width = transform.target.getScaledWidth();
      const height = transform.target.getScaledHeight();
      setState((prev) => {
        return prev.map((l, i) => l.id === id ? ({ ...l, width, height }) : l)
      })
    })
  }

  const layerName = (shapeType: string) => {
    return state.length + 1
  }

  const fileInserting = async (file: FileList) => {
    console.log(file);

    const ImageUrl = URL.createObjectURL(file[0]);
    // const ImageUrl = "https://yt3.ggpht.com/ChQ-8N_TZHHRcb3bKOY4rVOPhKzv-OrRinEtVM5BdbbK3KJIgy36mSIE8bfGmVobimKa8Yacxpji_w=s840-c-fcrop64=1,55850000e584ffff-rw-nd-v1";

    const maxOrder = maxFindingFn()

    const img = await FabricImage.fromURL(ImageUrl, { crossOrigin: "anonymous" });

    const newImage: StateProps = {
      id: `image_${layerName("image")}`, left: 0, top: 0, fill: "#fff", scaleX: 1, width: img.width, height: img.height,
      scaleY: 1, scale: 1, globalCompositeOperation: "normal", order: maxOrder + 1, type: "image", angle: 0, layerlock: false
    };

    // Bake the scaling into width/height so scaleX/scaleY can stay at 1
    img.set({
      ...newImage
    });

    imageEventAdding(img)

    // shape.on("added",updateLayer)
    fabricJs.current?.add(img);

    console.log("newImage:- ", newImage);


    setState((prev) => [{ ...newImage, src: ImageUrl }, ...prev]);
  }

  const shapeInserting = (shape: Partial<StateProps>, type: string) => {
    const maxOrder = maxFindingFn();
    console.log("maxOrder:- ", maxOrder);
    console.log("state:- ", state);

    const obj1 = {
      width: shape.width ?? 200,
      height: shape.height ?? 200,
      top: shape.top ?? 100,
      left: shape.left ?? 100,
      rx: shape.rx ?? 0,
      ry: shape.ry ?? 0,
      id: `shape_${layerName("shape")}`,
      angle: shape.angle ?? 0,
      fill: shape.fill ?? "#c61010",
      layerlock: shape.layerlock ?? false
    }




    let newshape: Rect | PencilBrush | Triangle<Record<string, number | string | undefined>, SerializedRectProps, ObjectEvents> | null = null;

    switch (type) {
      case "rectangle":
        newshape = new Rect({
          ...obj1
        });
        break;
      case "triangle":
        newshape = new Triangle({
          ...obj1
        });
        break;
      case "circle":
        newshape = new Circle({
          ...obj1
        });
        break;
    }

    if (!newshape) return

    console.log(newshape);

    shapeEventAdding(newshape)

    // shape.on("added",updateLayer)
    fabricJs.current?.add(newshape);

    setState((prev) => [{ ...obj1, order: maxOrder + 1, type: "shape", }, ...prev]);

    return newshape

  }


  const deleteLayer = (divIndex: string) => {
    const deletingObj = fabricJs.current?.getObjects().find((o, i) => o.get("id") === divIndex);

    console.log("deletingObj:- ", deletingObj);

    // state will be empty when it will be called from event listener, so use the setState function to update the state
    setState((prev) => prev.filter((v, i) => v.id !== divIndex))

    if (deletingObj) {
      fabricJs.current?.remove(deletingObj);
      fabricJs.current?.renderAll()
    }

  }


  const copyLayer = async (selectedId: string) => {

    if (!fabricJs.current) return;

    // find active object
    const activeObject = fabricJs.current.getObjects().find((v, i) => v.get("id") === selectedId);
    if (!activeObject) return;

    const copyId = state.find((v, i) => v.id === selectedId);
    const maxOrder = maxFindingFn();
    const id = `${activeObject.type.toLocaleLowerCase()}_${layerName(activeObject.type.toLocaleLowerCase())}`;

    let obj1 = {
      top: activeObject?.get("top"),
      left: activeObject?.get("left"),
      width: activeObject?.get("width"),
      fill: activeObject?.get("fill"),
      rx: activeObject?.get("rx"),
      ry: activeObject?.get("ry"),
      id: id,
      height: activeObject?.get("height"),
      angle: activeObject?.get("angle"),
      src: copyId?.src ?? "" as string,
      scaleX: activeObject?.get("scaleX"),
      scaleY: activeObject?.get("scaleY"),
      scale: 1,
      type: activeObject?.get("type"),
      globalCompositeOperation: activeObject?.get("globalCompositeOperation"),
      order: maxOrder + 1
    }

    // v5 clone() returns a Promise
    const clonedObj = await activeObject.clone();

    clonedObj.set({
      id: id,
      left: (activeObject.left ?? 0) + 20,
      top: (activeObject.top ?? 0) + 20,
    });

    fabricJs.current.add(clonedObj);
    fabricJs.current.setActiveObject(clonedObj);
    fabricJs.current.requestRenderAll();

    setState((prev) => [{ ...obj1 }, ...prev]);

  }

  const lockLayer = async (selectedId: string) => {

    if (!fabricJs.current) return
    console.log("lock clicking");

    const selectedObject = fabricJs.current.getObjects().find((l, i) => l.get("id") === selectedId);
    if (!selectedObject) return
    console.log("selectedLayer:- ", selectedObject);

    setState((prev) => {
      return prev.map((l, i) => {
        if (l.id === selectedId) {
          const layerLock = !l.layerlock;
          if (layerLock) {
            selectedObject.set({
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingFlip: true,
              lockScalingX: true,
              lockScalingY: true,
              lockSkewingX: true,
              lockSkewingY: true,
            })
          } else {
            selectedObject.set({
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: false,
              lockScalingFlip: false,
              lockScalingX: false,
              lockScalingY: false,
              lockSkewingX: false,
              lockSkewingY: false,
            })
          }
          fabricJs.current?.renderAll()
          return { ...l, layerlock: layerLock }
        } else {
          fabricJs.current?.renderAll()
          return l
        }

      })
    })

  }

  const exporting = async () => {
    if (!fabricJs.current) return;
    const exportWidth = aspectRatioImage.find((v, i) => v.orientation === canvasOrientation)
    const data = fabricJs.current.toDataURL({ format: "png", quality: 1, multiplier: 1, enableRetinaScaling: true, height: exportWidth?.height, width: exportWidth?.width });
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas-export.png";
    a.click();
  }

  const selectingItem = (selectedId: string) => {
    const canvas = fabricJs.current;
    if (!canvas) return;

    const activeItem = canvas.getObjects().find(item => item.get("id") === selectedId);

    if (!activeItem) return;

    // Update UI state
    setActiveId(selectedId);

    if (activeId === selectedId) {
      canvas.discardActiveObject(); // clear any old selection

    } else {
      // Make sure the selected one is active
      canvas.setActiveObject(activeItem);

      // Update object properties
      activeItem.set({
        selectable: true,
        hasControls: true
      });
    }

    // Render changes
    canvas.renderAll();
  };

  const droppingFile = (file: FileList) => {
    const notAllowedImage = ["avif"]
    if (notAllowedImage.includes(file[0].type)) {
      console.log("this types of image is not allowed:- ", file[0].type);
      return
    }
    fileInserting(file)
  }

  const aiImageFn = async (blob: Blob) => {
    console.log("aiBlob:- ", blob);

    // aap file mai convert karo kisi bhi blob ko
    const file = new File([blob], `ai-image${random}.png`, { type: blob.type || "image/png" });
    // aap DataTransfer is the object 
    const fileTransfer = new DataTransfer;
    // fileTransfer ke pas item naam kar property hai jiske pass add naam ka methods hai jo ki uper file banaya gya  hai us ko leta hai
    fileTransfer.items.add(file)
    // fileTranfer.files same as File present in file of input file ke jaisa ho jata hai
    fileInserting(fileTransfer.files)

  }

  const [cloudUploadingStart, setCloudUploadingStart] = useState<boolean>(false);

  const uploadImageGemina = async (selectedId: string) => {
    try {
      const uploadingData = fabricJs.current?.getObjects().find(o => o.get("id") === selectedId);
      setCloudUploadingStart(true);

      const cloneUploadingData = await uploadingData?.clone();
      if (!cloneUploadingData) return;

      if (!uploadingData) {
        console.log("No object found with the given ID");
        return;
      }

      if (!fabricJs.current) return;
      const newUploadingCanvas = new StaticCanvas(undefined, {
        width: uploadingData?.getScaledWidth(),
        height: uploadingData?.getScaledHeight(),
      });

      if (!newUploadingCanvas) return
      // doing this to ensure that the cloned object is not affected by the original canvas
      cloneUploadingData.set({
        left: 0,
        top: 0
      });

      newUploadingCanvas.add(cloneUploadingData);
      // Render the canvas to ensure the object is drawn
      newUploadingCanvas.renderAll();

      const blobData = await newUploadingCanvas?.toBlob({ format: "png", multiplier: 1, enableRetinaScaling: true });
      if (!blobData) return;

      // const blobUrl = URL.createObjectURL(blobData);
      // const anchor = document.createElement("a");
      // anchor.href = blobUrl;
      // anchor.download = "image.png";
      // anchor.click();

      console.log("selectedObj:- ", blobData, uploadingData);

      // Convert blob to file
      const file = new File([blobData], "image.png", { type: blobData.type || "image/png" });
      console.log("file:- ", file);


      const myfile = await ai.files.upload({
        file: file,
        config: {
          mimeType: "image/png"
        }
      });

      if (!myfile) {
        return
      }

      console.log("myUploadedFile", myfile);

      setState((prev) => {
        return prev.map((l, i) => l.id === selectedId ? ({ ...l, geminaUploadData: myfile }) : l)
      });

    } catch (error) {
      console.log("Error in fileUploading", error);
    } finally {
      setCloudUploadingStart(false)
    }

  }

  const checkingBox = (selectedId: string, e: boolean) => {
    console.log(e);

    const updatedValue = state.map((l, i) => l.id === selectedId ? ({ ...l, refrenceAiCheckBox: e }) : l);
    console.log("updatedValue:- ", updatedValue);
    setState(updatedValue)
  }

  const showHideLayer = (selectedId: string) => {
    const obj = fabricJs.current?.getObjects().find(o => o.get("id") === selectedId);
    if (!obj) return;

    obj.set("visible", !obj.visible);
    fabricJs.current?.renderAll();
    const updatedValue = state.map((l, i) => l.id === selectedId ? ({ ...l, hideLayer: !obj.visible }) : l);
    console.log("updatedValue:- ", updatedValue);
    setState(updatedValue)
  }

  const addTextLayer = () => {
    if (!fabricJs.current) return;
    const maxOrder = maxFindingFn()
    const obj = {
      left: 100,       // X position
      top: 100,        // Y position
      fontSize: 24,
      fill: "#000000", // Text color
      fontFamily: "Arial",
      editable: true,
      width: 0,
      height: 0,
      angle: 0,
      id: "text_" + layerName("text"), // Unique ID for tracking
    }
    const textLayer = new Textbox("Hello");
    console.log(textLayer);

    textLayer.set({
      ...obj
    })

    setState((prev) => [{ ...obj, type: "text", order: maxOrder + 1, }, ...prev])

    textEventAdding(textLayer)
    fabricJs.current.add(textLayer);
    fabricJs.current.setActiveObject(textLayer);
    fabricJs.current.renderAll();
  };

  const [startShapeDrawing, setStartShapeDrawing] = useState<boolean>(false);
  const onShapeClick = ({ type }: { type: string }) => {
    console.log("onShapeClick:- ", type);
    if (!fabricJs.current) return

    let isDrawing: boolean, RectX: number, RectY: number, Shape: Rect | Triangle;
    switch (type) {
      case "rectangle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          console.log("type", type);
          const { scenePoint } = options;
          RectX = scenePoint.x;
          RectY = scenePoint.y;
          console.log("RectX:- ", RectX, "RectY:- ", RectY);
          const obj = {
            left: RectX,
            top: RectY,
            width: 0,
            height: 0,
            fill: "rgba(255, 0, 0, 0.5)", // semi-transparent red
          }

          const retrunShape = shapeInserting(obj, type)
          if (!retrunShape) return
          Shape = retrunShape

        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape) {
            return
          }
          const { scenePoint } = options;
          Shape.set({
            width: scenePoint.x - RectX,
            height: scenePoint.y - RectY,
          });

          fabricJs.current?.renderAll()
        });

        fabricJs.current.on("mouse:up", (options) => {
          isDrawing = false;
          fabricJs.current?.off("mouse:down")
          fabricJs.current?.off("mouse:up")
          fabricJs.current?.off("mouse:move")
        })
        break;
      case "triangle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          console.log("type", type);

          const { scenePoint } = options;
          RectX = scenePoint.x;
          RectY = scenePoint.y;
          const obj = {
            left: RectX,
            top: RectY,
            width: 0,
            height: 0,
            fill: "rgba(255, 0, 0, 0.5)", // semi-transparent red
          }
          const retrunShape = shapeInserting(obj, type)
          if (!retrunShape) return
          Shape = retrunShape
        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape) return
          const { scenePoint } = options;
          Shape.set({
            width: scenePoint.x - RectX,
            height: scenePoint.y - RectY,
          });

          fabricJs.current?.renderAll()
        });

        fabricJs.current.on("mouse:up", (options) => {
          isDrawing = false;
          fabricJs.current?.off("mouse:down")
          fabricJs.current?.off("mouse:up")
          fabricJs.current?.off("mouse:move")
        })
        break;
      case "circle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          console.log("type", type);

          const { scenePoint } = options;
          RectX = scenePoint.x;
          RectY = scenePoint.y;
          const obj = {
            left: RectX,
            top: RectY,
            radius: 0,
            originX: "center",
            originY: "center",
            fill: "rgba(255, 0, 0, 0.5)", // semi-transparent red
          }
          const retrunShape = shapeInserting(obj, type)
          if (!retrunShape) return
          Shape = retrunShape
        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape) return
          const { scenePoint } = options;
          const dx = scenePoint.x - RectX;
          const dy = scenePoint.y - RectY;
          const radius = Math.sqrt(dx * dx + dy * dy) / 2; // distance from center
          Shape.set({
            // how this center, let RectY is from where circle is drawn, dx is the distance from RectX to the current mouse position
            top: RectY + dy / 2, // center the circle
            originX: "center",
            originY: "center",
            left: RectX + dx / 2, // center the circle
            radius: radius,
          });

          fabricJs.current?.renderAll()
        });

        fabricJs.current.on("mouse:up", (options) => {
          isDrawing = false;
          fabricJs.current?.off("mouse:down")
          fabricJs.current?.off("mouse:up")
          fabricJs.current?.off("mouse:move")
        })
        break;
      case "freeDrawing":
        fabricJs.current.on("mouse:down", (options) => {
          if (!fabricJs.current) return;
          fabricJs.current.isDrawingMode = true; // Enable free drawing mode
          // 3. Set brush options
          fabricJs.current.freeDrawingBrush = new PencilBrush(fabricJs.current);

          if (!fabricJs.current.freeDrawingBrush) {
            return
          }
          fabricJs.current.freeDrawingBrush.color = "red"; // Set brush color
          fabricJs.current.freeDrawingBrush.width = 5; // Set brush width
        })

        // Listen for when a drawing (Path) is created
        fabricJs.current.on("path:created", (event) => {
          const path = event.path;
          if (!path) return;

          const newId = "path" + random; // generate id once

          path.set({
            id: newId,
            fill: path.fill ?? "transparent",
          });

          const obj = {
            left: path.left,
            top: path.top,
            width: path.width,
            height: path.height,
            angle: path.angle,
            id: newId,
            fill: path.fill ?? "transparent",
          };

          shapeEventAdding(path);

          const maxOrder = maxFindingFn();
          setState((prev) => [{ ...obj, order: maxOrder + 1, type }, ...prev]);

          fabricJs.current?.add(path);
          fabricJs.current?.renderAll();
          fabricJs.current?.setActiveObject(path);

          if (!fabricJs.current) return;
          // Turn off drawing mode
          fabricJs.current.isDrawingMode = false;
          fabricJs.current?.off("mouse:down");
          fabricJs.current?.off("mouse:up");
          fabricJs.current?.off("path:created");
        });
        break;
    }
  }



  return (
    <div id='imageEdittingContainer'  >
      {/* temporary */}
      {/* <ImageKitUploader/> */}

      <main className='flex gap-2'>
        <div className={`bg-amber-200 flex max-md:w-[85%] fixed left-0 w-[400px] basis-[400px]  p-1 slidingGenerate ${slidingGenerateImage ? "slidingGenerateUpon" : "slidingGenerateCLosed"}`} style={{ height: `calc(-62px + 100vh)`, zIndex: 9 }}>

          {slidingGenerateImage ?
            <>
              <ArrowLeftSquare onClick={() => setSlidingGenerateImage((prev) => !prev)} className='bg-gray-500 p-2 fixed top-12 left-1/1 text-white rounded-md tansform translate-x-1 cursor-pointer' size={35} style={{ zIndex: 99 }} />
            </>
            :
            <>
              <ArrowRightSquare onClick={() => setSlidingGenerateImage((prev) => !prev)} className='bg-gray-500 p-2 fixed top-12 left-1/1 text-white rounded-md tansform translate-x-1 cursor-pointer' size={35} style={{ zIndex: 99 }} />
            </>}

          <div className='flex-1 flex flex-col gap-4 overflow-auto historyScrollbar'>
            {/* aspect Ration */}
            <div className='flex gap-2 flex-wrap p-2 items-center'>
              {aspectRatioImage.map((v, i) => (
                <div key={v.orientation}>
                  <div onClick={() => setCanvasOrientation(v.orientation)} className={`outline-2 outline-dashed p-2 cursor-pointer ${v.orientation === canvasOrientation ? "outline-blue-400" : ""}`} style={{ aspectRatio: `${v.orientation}` }}>{v.orientation}</div>
                </div>
              ))}
            </div>
            {/* text */}
            <label htmlFor="shape_insert" className='flex gap-2 bg-white rounded-md w-fit p-2 cursor-pointer' onClick={addTextLayer}>
              <Text size={22} color='black' />
              <span>Text</span>
            </label>
            {/* shape */}
            <label htmlFor="shape_insert" className='flex gap-2 bg-white rounded-md w-fit p-2 cursor-pointer relative'
              onClick={setStartShapeDrawing.bind(null, !startShapeDrawing)}
            >
              <ShapesIcon size={22} color='black' />
              <span>Insert</span>

              {startShapeDrawing && <div className='absolute bg-white rounded-md p-2 flex gap-2 flex-col right-0 top-0 z-10' id='shape_insert' style={{ transform: "translate(100%, 0px)" }}>
                <span onClick={() => onShapeClick({ type: "rectangle" })}>Rectangle</span>
                <span onClick={() => onShapeClick({ type: "circle" })}>Circle</span>
                <span onClick={() => onShapeClick({ type: "triangle" })}>Triangle</span>
                <span onClick={() => onShapeClick({ type: "freeDrawing" })}>FreeDrawing</span>
              </div>

              }
            </label>
            {/* file  use same htmlFor and id in input for activating that*/}
            <label
              htmlFor='file' className='flex gap-2 bg-white rounded-md p-2 cursor-pointer w-full'>
              {somethingDrop ?
                <>
                  <span className='block w-full rounded-md text-center animate-pulse'>Drop Here</span>
                </>
                :
                <>
                  <ImageUpIcon size={22} color='black' />
                  <span>Insert</span>
                </>
              }

              <input id='file' type="file" accept='image/*' multiple className='hidden' onChange={(e) => {
                if (e.target.files) { fileInserting(e.target.files) }
              }} />

            </label>

            {/* export */}
            <label className='flex gap-2 bg-white rounded-md w-fit p-2 cursor-pointer' onClick={exporting}>
              <Download size={22} color='black' />
              <span>Export</span>

            </label>

            <PromptComponencts
              canvasOrientation={canvasOrientation} fabricJs={fabricJs} imageSetting={aiImageFn} state={state}
            />

          </div>

        </div>

        {/* CANVAS AREA */}
        <div ref={canvasDivRef} className='bg-black flex-1 flex justify-center items-center relative overflow-hidden flex-col' style={{ height: `calc(-62px + 100vh)`, overflow: "auto", scale: 1, }}>

          <div className='rounded-md bg-white p-2 flex fixed bottom-6 right-4'>
            <Plus onClick={() => zoomingInOut("zoomedIn")} size={22} className='font-bold text-black' />
            <Minus onClick={() => zoomingInOut("zoomedOut")} size={22} className='font-bold text-black' />
          </div>


          <canvas onClick={(e) => e.stopPropagation()} id='fabricJsCanvas' className='outline-2 outline-dashed outline-amber-200' style={{ scale: 1, }} ref={canvasRef}>

          </canvas>
        </div>

        {/* layer div */}
        <div className={`slidingLayer bg-gray-600/50 flex flex-col backdrop-blur-3xl max-md:w-[80%] w-[400px] fixed right-0 transform ${slidingLayer ? "slidingLayerUpon" : "slidingLayerCLosed"}`} style={{ height: `calc(-50px + 100vh)` }}>

          <Layers onClick={() => setSlidingLayer((prev) => !prev)} className='bg-gray-500 p-2 absolute top-2 -left-2 text-white rounded-md tansform -translate-x-1/1 cursor-pointer' size={35} />

          <div className='bg-white text-black font-bold flex p-0.5 justify-center items-center gap-2 rounded-md mt-1'>
            {["Layer", "Property"].map((v, i) => (
              <span key={v} onClick={() => setLayerMenu(v)} className={`font-bold hover:bg-gray-400/50 p-1 rounded-md cursor-pointer ${layerMenu===v?"underline underline-offset-2":""}`}>{v}</span>
            ))}
          </div>

          {/* layer item */}
          <div className='flex-1 flex min-h-0 gap-2 flex-col'>

            {layerMenu === "Layer" &&
              <>
                <div className='flex w-full flex-col gap-2 mt-2 p-2 overflow-auto historyScrollbar'>
                  {/* slice is being use for shallow copy other wise sort will mutate the state  */}
                  {state.length > 0 && state.slice().sort((s, b) => b.order - s.order).map((v, i) => (
                    <div key={v.id} onClick={() => selectingItem(v.id)} className={` p-2 rounded-md bg-white hover:bg-gray-300 ${v.id === activeId ? "outline-1 outline-blue-400":""}`}>
                      <div>
                        <div className='flex justify-between'>
                          <input className='cursor-pointer' value={String(v.refrenceAiCheckBox)} type="checkbox" id='checkBox' onClick={(e) => {
                            e.stopPropagation();
                            checkingBox(v.id, e.currentTarget.checked)
                          }} />

                          <span className='cursor-pointer'>
                            {cloudUploadingStart ?
                              <span>
                                {activeId === v.id ? <Loader2Icon size={22} color='black' className='animate-spin' /> :
                                  <>
                                    <span>
                                      {v.geminaUploadData?.state === "ACTIVE" ?
                                        <CheckCircleIcon onClick={(e) => e.stopPropagation()} size={22} color='green' />
                                        :
                                        <UploadCloud size={22} color='black' onClick={(e) => {
                                          e.stopPropagation();
                                          uploadImageGemina(v.id)
                                        }} />
                                      }
                                    </span>
                                  </>}
                              </span>
                              :
                              <span>
                                {v.geminaUploadData?.state === "ACTIVE" ?
                                  <CheckCircleIcon size={22} color='green' />
                                  :
                                  <UploadCloud size={22} color='black' onClick={() => uploadImageGemina(v.id)} />
                                }
                              </span>
                            }
                          </span>

                        </div>
                        <span className={`w-full flex gap-2 justify-between cursor-pointer p-2 rounded-md relative group/delete overflow-hidden`}>
                          <span className='line-clamp-2'>{v.id}</span>
                          {/* eyes on off */}
                          <span className=' absolute top-2 right-2 flex'>
                            {v.hideLayer ?
                              <EyeOff onClick={(e) => {
                                e.stopPropagation()
                                showHideLayer(v.id)
                              }} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer ' />
                              :
                              <EyeIcon onClick={(e) => {
                                e.stopPropagation();
                                showHideLayer(v.id)
                              }} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer ' />
                            }

                            <span >
                              {v.layerlock ?
                                <LockKeyhole onClick={(e) => {
                                  e.stopPropagation();
                                  lockLayer(v.id);
                                }} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer ' />
                                :
                                <LockKeyholeOpen onClick={(e) => {
                                  e.stopPropagation();
                                  lockLayer(v.id);
                                }} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer' />
                              }
                            </span>

                            <Edit2 onClick={() => {
                              setActiveId(v.id)
                              setAiEdit((prev) => !prev)
                            }}
                              size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer ' />
                            <Copy onClick={() => copyLayer(v.id)} size={25} className='hover:bg-green-700/30 p-1 rounded-md cursor-pointer ' />
                            <Trash2Icon onClick={() => deleteLayer(v.id)} size={25} className='hover:bg-amber-700/90 p-1 rounded-md cursor-pointer ' />
                          </span>
                        </span>
                      </div>

                      {v.src && v.type === "image" &&
                        <div className='flex '>
                          <Image src={v.src} alt='preview' width={100} height={100} className='w-[50px] h-auto'></Image>
                        </div>}

                    </div>
                  ))}
                </div>
              </>
            }
            {layerMenu === "Property" &&
              <>
                {/* toolbox */}
                <ToolBox
                  setState={setState}
                  state={state}
                  fabricJs={fabricJs}
                  selectedId={activeId}
                />
              </>
            }


          </div>
        </div>

      </main>

      {aiEdit && createPortal(<EditTool aiImageFn={aiImageFn} fabricjs={fabricJs} selectedId={activeId} aiEditShowFn={setAiEdit} />, document.getElementById("imageEdittingContainer") || document.body)}
    </div>
  )
}

export default ProImageEditor