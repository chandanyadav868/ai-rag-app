"use client"
import { ArrowLeftSquare, ArrowRightSquare, CheckCircleIcon, Copy, Download, Edit2, EyeIcon, EyeOff, ImageUpIcon, Layers, Loader2Icon, LockKeyhole, LockKeyholeOpen, Minus, Plus, ShapesIcon, Text, Trash2Icon, UploadCloud } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from "react-dom"
import { Canvas, Rect, FabricImage, SerializedRectProps, ObjectEvents, ImageProps, SerializedImageProps, Textbox, TextboxProps, SerializedTextboxProps, ITextEvents, Triangle, Circle, PencilBrush, StaticCanvas, SprayBrush, CircleBrush, Polyline, Polygon, Line, Point } from 'fabric'; // browser
import Image from 'next/image';
import { PromptComponencts } from '@/components/PromptComponencts';
import { ai, aspectRatioImage } from '@/constant';
import ToolBox from '@/components/ToolBox';
import EditTool from '@/components/EditTool';
import { useContextStore } from '@/components/CreateContext';
import { v4 as uuidv4 } from 'uuid';
import { ApiEndpoint } from '../(main)/classApi/apiClasses';



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
  const [layerMenu, setLayerMenu] = useState<string>("Layer");
  const [scale, setScale] = useState<number>(1);
  const { setError } = useContextStore();

  // console.log("state:- ", state);


  // ye function run hata hai first time jab aap ka components mounts hota hai
  const fabricJs = useRef<Canvas | null>(null);


  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // Drag over handler - prevent default to allow drop
    const dropOverImage = (e: MouseEvent) => {
      e.preventDefault();
      setSomethingDrop(true);
    };

    // Drop handler - handle dropped files
    const dropImage = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;
      droppingFile(e.dataTransfer.files);
      setSomethingDrop(false);
    };

    // Delete key handler - delete selected objects
    const deletingObj = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        if (!fabricJs.current) return;

        const activeObjects = fabricJs.current?.getActiveObjects();
        if (!activeObjects) return;

        // Delete each selected object
        activeObjects.forEach((obj) => {
          deleteLayer(obj.get("id"));
        });
      }
    };

    // Get aspect ratio based on orientation
    const newAspectRatio = aspectRatioImage.find(
      (v) => v.orientation === canvasOrientation
    );

    // Initialize Fabric.js canvas
    fabricJs.current = new Canvas(canvasRef.current, {
      width: newAspectRatio?.width,
      height: newAspectRatio?.height,
      backgroundColor: "azure",
    });

    // ==================== ZOOM FUNCTIONALITY ====================

    // Variables for pinch-to-zoom
    let isPinching = false;
    let lastDistance = 0;

    // Mouse wheel zoom (Desktop)
    fabricJs.current.on("mouse:wheel", (opt) => {
      const event = opt.e as WheelEvent;
      event.preventDefault();
      event.stopPropagation();

      if (!fabricJs.current) return;

      // Get current zoom level
      let zoom = fabricJs.current.getZoom();

      // Calculate new zoom (wheelDelta determines zoom in/out)
      // Positive deltaY = zoom out, Negative deltaY = zoom in
      zoom *= 0.999 ** event.deltaY;

      // Limit zoom level between 0.1x and 20x
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;

      // Create Fabric.js Point object
      const point = new Point(event.offsetX, event.offsetY);
      // Zoom to pointer position (zoom where mouse is pointing)
      fabricJs.current.zoomToPoint(
        point,
        zoom
      );

      fabricJs.current.requestRenderAll();
    });

    // Touch start - detect if it's a pinch gesture
    const handleTouchStart = (e: TouchEvent) => {
      if (!fabricJs.current) return;

      // If there are 2 fingers, it's a pinch gesture
      if (e.touches.length === 2) {
        isPinching = true;

        // Disable selection while pinching
        fabricJs.current.selection = false;
        fabricJs.current.forEachObject((obj) => {
          obj.selectable = false;
        });

        // Calculate distance between two fingers
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    // Touch move - handle pinch zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (!fabricJs.current || !isPinching) return;

      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default browser zoom

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate new distance between fingers
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // Calculate zoom scale based on distance change
        if (lastDistance > 0) {
          const scale = currentDistance / lastDistance;
          let zoom = fabricJs.current.getZoom();
          zoom *= scale;

          // Limit zoom level
          if (zoom > 20) zoom = 20;
          if (zoom < 0.1) zoom = 0.1;

          // Get center point between two fingers
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;

          // Get canvas offset
          const rect = canvasRef.current?.getBoundingClientRect();
          const offsetX = rect ? centerX - rect.left : centerX;
          const offsetY = rect ? centerY - rect.top : centerY;

          // Create Fabric.js Point object
          const point = new Point(offsetX, offsetY);

          // Zoom to center point between fingers
          fabricJs.current.zoomToPoint(
            point,
            zoom
          );

          fabricJs.current.requestRenderAll();
        }

        lastDistance = currentDistance;
      }
    };

    // Touch end - re-enable selection
    const handleTouchEnd = (e: TouchEvent) => {
      if (!fabricJs.current) return;

      // If pinch ended, re-enable selection
      if (e.touches.length < 2) {
        isPinching = false;
        lastDistance = 0;

        // Re-enable selection
        fabricJs.current.selection = true;
        fabricJs.current.forEachObject((obj) => {
          obj.selectable = true;
        });
      }
    };

    // Pan functionality (optional - drag canvas when zoomed in)
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    fabricJs.current.on("mouse:down", (opt) => {
      const event = opt.e as MouseEvent;

      // Enable panning with Alt key + drag (or middle mouse button)
      if (event.altKey === true || event.button === 1) {
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
      const vpt = fabricJs.current.viewportTransform;
      if (!vpt) return;

      // Calculate movement delta
      const deltaX = event.clientX - lastPosX;
      const deltaY = event.clientY - lastPosY;

      // Update viewport position
      vpt[4] += deltaX;
      vpt[5] += deltaY;

      fabricJs.current.requestRenderAll();

      lastPosX = event.clientX;
      lastPosY = event.clientY;
    });

    fabricJs.current.on("mouse:up", () => {
      if (!fabricJs.current) return;

      // Disable dragging
      isDragging = false;
      fabricJs.current.selection = true;
      fabricJs.current.setCursor('default');
    });

    // ==================== SELECTION EVENTS ====================

    // When object is selected
    fabricJs.current.on("selection:created", (e) => {
      const activeObject = e.selected[0].get("id");
      setActiveId(activeObject);
    });

    // When selection is updated (different object selected)
    fabricJs.current.on("selection:updated", (e) => {
      const activeObject = e.selected[0].get("id");
      setActiveId(activeObject);
    });

    // When selection is cleared
    fabricJs.current.on("selection:cleared", () => {
      setActiveId(null);
    });

    // ==================== EVENT LISTENERS ====================

    // Add window event listeners
    window.addEventListener("dragover", dropOverImage);
    window.addEventListener("drop", dropImage);
    window.addEventListener("keydown", deletingObj);

    // Add touch event listeners to canvas element
    const canvasElement = canvasRef.current;
    canvasElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvasElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasElement.addEventListener("touchend", handleTouchEnd);

    setActiveId(null);
    fabricJs.current.renderAll();

    // ==================== CLEANUP ====================

    return () => {
      // Remove all event listeners
      window.removeEventListener("dragover", dropOverImage);
      window.removeEventListener("drop", dropImage);
      window.removeEventListener("keydown", deletingObj);

      // Remove touch event listeners
      if (canvasElement) {
        canvasElement.removeEventListener("touchstart", handleTouchStart);
        canvasElement.removeEventListener("touchmove", handleTouchMove);
        canvasElement.removeEventListener("touchend", handleTouchEnd);
      }

      setState([]);

      // Dispose the canvas
      fabricJs.current?.dispose();
      fabricJs.current = null;
    };
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
    const scaling = Math.min(widthRatio, heightRatio);
    // console.log(scaling);


    // Final scalingd size
    if ((newAspect.width > availableWidth || newAspect.height > availableHeight) && canvasDivRef.current) {
      // console.log("Scaling methods");

      // console.log("Zooming", +scaling);
      resizeCanvas("intial", scaling)
      width = newAspect.width
      height = newAspect.height
      setScale(scaling)
    } else {
      width = newAspect.width
      height = newAspect.height
    }

    // console.log("Final width:", width, "Final height:", height);

    // Update fabric.js canvas dimensions
    if (!fabricJs.current) return;
    fabricJs.current?.setDimensions({ width, height });
    fabricJs.current?.renderAll();
  }, [canvasOrientation]);


  // write a methods which will return random number on client side
  const random = uuidv4();

  const maxFindingFn = () => {
    const stateMax = state.map((v, _) => v.order ? v.order : 0)
    const modified = stateMax.length > 0 ? stateMax : [0]
    const maxOrder = Math.max(...modified);
    return maxOrder
  }


  const shapeEventAdding = (shape: Rect | Triangle<Record<string, number | string | undefined>, SerializedRectProps, ObjectEvents>) => {
    shape.on("modified", ({ target, action }) => {
      const id = target.get("id");
      // console.log(target, action);

      const obj = {
        globalCompositeOperation: target.get("globalCompositeOperation"),
        top: target.get("top"),
        left: target.get("left"),
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
      // console.log(pointer);

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
      // console.log(target);

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
      // console.log(target);

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
    // console.log('LayerName:- ',state);

    return uuidv4().split("-")[0];
  }

  const fileInserting = async (file: FileList) => {
    // console.log(file);

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

    // console.log("newImage:- ", newImage);
    // console.log("state:- ", state);


    setState((prev) => [{ ...newImage, src: ImageUrl }, ...prev]);
  }

  const shapeInserting = (shape: Partial<StateProps>, type: string, points?: { x: number, y: number }[]) => {
    const maxOrder = maxFindingFn();
    // console.log("maxOrder:- ", maxOrder);
    // console.log("state:- ", state);

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




    let newshape: Rect | PencilBrush | Triangle<Record<string, number | string | undefined>, SerializedRectProps, ObjectEvents> | Polyline | null = null;

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
      case "polyline":
        newshape = new Polyline([...points ?? []], {
          ...obj1
        });
        break;
    }

    if (!newshape) return

    // console.log(newshape);

    shapeEventAdding(newshape)

    // shape.on("added",updateLayer)
    fabricJs.current?.add(newshape);

    setState((prev) => [{ ...obj1, order: maxOrder + 1, type: "shape", }, ...prev]);

    return newshape

  }


  const deleteLayer = (divIndex: string) => {
    const deletingObj = fabricJs.current?.getObjects().find((o, i) => o.get("id") === divIndex);

    // console.log("deletingObj:- ", deletingObj);

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
    // console.log("lock clicking");

    const selectedObject = fabricJs.current.getObjects().find((l, i) => l.get("id") === selectedId);
    if (!selectedObject) return
    // console.log("selectedLayer:- ", selectedObject);

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
    const exportWidth = aspectRatioImage.find((v, i) => v.orientation === canvasOrientation);
    if (!exportWidth) {
      return
    }

    // console.log("Scalling:- ", scale);
    const height = exportWidth?.height;
    const width = exportWidth?.width;

    const data = fabricJs.current.toDataURL({ format: "png", quality: 1, multiplier: 0.5, enableRetinaScaling: true, height, width });

    // console.log("data ", data, "height:- ", height, "width:- ", width);


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
    const notAllowedImage = ["avif", "gif", "svg+xml", "svg", "pdf"];
    if (notAllowedImage.includes(file[0].type)) {
      // console.log("this types of image is not allowed:- ", file[0].type);
      return
    }
    fileInserting(file)
  }

  const aiImageFn = async (blob: Blob) => {
    // console.log("aiBlob:- ", blob);

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
        // console.log("No object found with the given ID");
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

      // console.log("selectedObj:- ", blobData, uploadingData);

      // Convert blob to file
      const file = new File([blobData], "image.png", { type: blobData.type || "image/png" });
      // console.log("file:- ", file);


      // const ai = apiSetup()
      const formdata = new FormData();

      formdata.set("file", file);

      setState((prev) => {
        return prev.map((l, i) => l.id === selectedId ? ({ ...l, currentlyUploading: true }) : l)
      });

      const response = await ApiEndpoint.FileUpload('/google-api-setup', {}, formdata);

      const fileData = await response.data;

      // console.log("myfile:- ", fileData);


      setError({
        type: "success",
        message: "Uploaded Successfully"
      })

      if (!fileData) {
        return
      }

      // console.log("myUploadedFile", fileData);

      setState((prev) => {
        return prev.map((l, i) => l.id === selectedId ? ({ ...l, geminaUploadData: fileData, currentlyUploading: false }) : l)
      });

    } catch (error) {
      console.log("Error in fileUploading", error);
      setError({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong'
      })
    } finally {
      setCloudUploadingStart(false)
    }

  }

  const checkingBox = (selectedId: string, e: boolean) => {
    // console.log(e);

    const updatedValue = state.map((l, i) => l.id === selectedId ? ({ ...l, refrenceAiCheckBox: e }) : l);
    // console.log("updatedValue:- ", updatedValue);
    setState(updatedValue)
  }

  const showHideLayer = (selectedId: string) => {
    const obj = fabricJs.current?.getObjects().find(o => o.get("id") === selectedId);
    if (!obj) return;

    obj.set("visible", !obj.visible);
    fabricJs.current?.renderAll();
    const updatedValue = state.map((l, i) => l.id === selectedId ? ({ ...l, hideLayer: !obj.visible }) : l);
    // console.log("updatedValue:- ", updatedValue);
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
    // console.log(textLayer);

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
    // Check if fabricJs canvas is initialized
    if (!fabricJs.current) return;

    let isDrawing: boolean, RectX: number, RectY: number, Shape: Rect | Triangle;

    // Remove all previous event listeners to prevent conflicts
    fabricJs.current.off("mouse:down");
    fabricJs.current.off("mouse:move");
    fabricJs.current.off("mouse:up");
    fabricJs.current.off("mouse:dblclick");

    switch (type) {
      case "rectangle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          const { scenePoint } = options;

          // Store starting coordinates
          RectX = scenePoint.x;
          RectY = scenePoint.y;

          // Create rectangle with initial properties
          const obj = {
            left: RectX,
            top: RectY,
            width: 0,
            height: 0,
            fill: "rgba(255, 0, 0, 0.5)",
          };

          const returnShape = shapeInserting(obj, type);
          if (!returnShape) return;
          Shape = returnShape;
        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape || !isDrawing) return;

          const { scenePoint } = options;

          // Calculate width and height based on mouse movement
          Shape.set({
            width: scenePoint.x - RectX,
            height: scenePoint.y - RectY,
          });

          fabricJs.current?.renderAll();
        });

        fabricJs.current.on("mouse:up", () => {
          if (!fabricJs.current) return;
          isDrawing = false;

          // Clean up listeners after drawing is complete
          fabricJs.current.off("mouse:down");
          fabricJs.current.off("mouse:up");
          fabricJs.current.off("mouse:move");
        });
        break;

      case "triangle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          const { scenePoint } = options;

          RectX = scenePoint.x;
          RectY = scenePoint.y;

          const obj = {
            left: RectX,
            top: RectY,
            width: 0,
            height: 0,
            fill: "rgba(255, 0, 0, 0.5)",
          };

          const returnShape = shapeInserting(obj, type);
          if (!returnShape) return;
          Shape = returnShape;
        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape || !isDrawing) return;
          const { scenePoint } = options;

          Shape.set({
            width: scenePoint.x - RectX,
            height: scenePoint.y - RectY,
          });

          fabricJs.current?.renderAll();
        });

        fabricJs.current.on("mouse:up", () => {
          isDrawing = false;
          fabricJs.current?.off("mouse:down");
          fabricJs.current?.off("mouse:up");
          fabricJs.current?.off("mouse:move");
        });
        break;

      case "circle":
        fabricJs.current.on("mouse:down", (options) => {
          isDrawing = true;
          const { scenePoint } = options;

          RectX = scenePoint.x;
          RectY = scenePoint.y;

          const obj = {
            left: RectX,
            top: RectY,
            radius: 0,
            fill: "rgba(255, 0, 0, 0.5)",
          };

          const returnShape = shapeInserting(obj, type);
          if (!returnShape) return;
          Shape = returnShape;
        });

        fabricJs.current.on("mouse:move", (options) => {
          if (!Shape || !isDrawing) return;
          const { scenePoint } = options;

          // Calculate distance from starting point
          const dx = scenePoint.x - RectX;
          const dy = scenePoint.y - RectY;
          const radius = Math.sqrt(dx * dx + dy * dy) / 2;

          // Center the circle between start and current point
          Shape.set({
            left: RectX + dx / 2,
            top: RectY + dy / 2,
            originX: "center",
            originY: "center",
            radius: radius,
          });

          fabricJs.current?.renderAll();
        });

        fabricJs.current.on("mouse:up", () => {
          isDrawing = false;
          fabricJs.current?.off("mouse:down");
          fabricJs.current?.off("mouse:up");
          fabricJs.current?.off("mouse:move");
        });
        break;

      case "polyline":
        if (!fabricJs.current) return;

        const canvas = fabricJs.current;

        // Array to store points in canvas coordinates
        let points: { x: number; y: number }[] = [];
        let polyline: Polyline | null = null;
        let isPolylineDrawing = false;
        let tempLine: Line | null = null; // Temporary line for preview

        const newId = "path" + random;

        // SINGLE CLICK → Add a new point to the polyline
        canvas.on("mouse:down", (options) => {
          const { scenePoint } = options;

          // Add the clicked point to our points array
          const newPoint = {
            x: scenePoint.x,
            y: scenePoint.y,
          };

          points.push(newPoint);

          // If this is the first point, just mark that we started drawing
          if (points.length === 1) {
            isPolylineDrawing = true;
          }

          // If we have 2 or more points, create/update the polyline
          if (points.length >= 2) {
            if (polyline) {
              // Remove existing polyline to redraw with new point
              console.log({ polyline });
              canvas.remove(polyline);

            }

            // Create new polyline with all points
            // IMPORTANT: Don't set left/top, let points define everything
            polyline = new Polyline(points, {
              stroke: "red",
              strokeWidth: 3,
              fill: "transparent",
              selectable: false,
              objectCaching: false,
              id: newId,
              evented: false,
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
            });

            canvas.add(polyline);
          }

          // Remove temp preview line if it exists
          if (tempLine) {
            console.log({ tempLine });
            canvas.remove(tempLine);
            tempLine = null;
          }

          canvas.requestRenderAll();
        });

        // MOUSE MOVE → Show preview line from last point to cursor
        canvas.on("mouse:move", (options) => {
          if (!isPolylineDrawing || points.length === 0) return;

          const { scenePoint } = options;
          const lastPoint = points[points.length - 1];

          // Remove old preview line
          if (tempLine) {
            canvas.remove(tempLine);
          }

          // Create temporary line from last point to cursor
          tempLine = new Line(
            [lastPoint.x, lastPoint.y, scenePoint.x, scenePoint.y],
            {
              stroke: "red",
              strokeWidth: 3,
              selectable: false,
              evented: false,
              strokeDashArray: [5, 5], // Dashed line for preview
              strokeLineCap: 'round',
            }
          );

          canvas.add(tempLine);
          canvas.requestRenderAll();
        });

        // DOUBLE CLICK → Finish drawing the polyline
        canvas.on("mouse:dblclick", () => {
          if (!polyline || points.length < 2) {
            // Clean up if insufficient points
            if (polyline) canvas.remove(polyline);
            if (tempLine) canvas.remove(tempLine);

            canvas.off("mouse:down");
            canvas.off("mouse:move");
            canvas.off("mouse:dblclick");

            points = [];
            polyline = null;
            tempLine = null;
            isPolylineDrawing = false;
            return;
          }

          // Remove the last point (added by first click of double-click)
          points.pop();

          // Remove temp preview line
          if (tempLine) {
            canvas.remove(tempLine);
            tempLine = null;
          }

          // Remove current polyline
          canvas.remove(polyline);

          // Create final polyline with correct settings
          const finalPolyline = new Polyline(points, {
            stroke: "red",
            strokeWidth: 3,
            fill: "transparent",
            selectable: true,
            objectCaching: true,
            id: newId,
            evented: true,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            // CRITICAL: Prevent automatic position normalization
            absolutePositioned: false,
          });

          canvas.add(finalPolyline);

          // Update coordinates properly
          finalPolyline.setCoords();

          // Select the completed polyline
          canvas.setActiveObject(finalPolyline);

          // Add your custom event handlers if needed
          // shapeEventAdding(finalPolyline);

          // Clean up all event listeners
          canvas.off("mouse:down");
          canvas.off("mouse:move");
          canvas.off("mouse:dblclick");

          // Reset state for next polyline
          points = [];
          polyline = null;
          isPolylineDrawing = false;

          canvas.requestRenderAll();
        });

        break;

      case "freeDrawing":
        if (!fabricJs.current) return;

        // Enable free drawing mode
        fabricJs.current.isDrawingMode = true;
        fabricJs.current.freeDrawingBrush = new PencilBrush(fabricJs.current);

        if (!fabricJs.current.freeDrawingBrush) return;

        // Configure brush properties
        fabricJs.current.freeDrawingBrush.color = "green";
        fabricJs.current.freeDrawingBrush.width = 5;

        // Listen for when the path is created
        fabricJs.current.on("path:created", (event) => {
          const path = event.path;
          if (!path) return;

          // Update coordinates for proper positioning
          path.setCoords();

          const newId = "path" + random;

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

          // Add your custom event handlers
          shapeEventAdding(path);

          // Update state
          const maxOrder = maxFindingFn();
          setState((prev) => [{ ...obj, order: maxOrder + 1, type }, ...prev]);

          fabricJs.current?.renderAll();

          if (!fabricJs.current) return;

          // Disable drawing mode after completion
          fabricJs.current.isDrawingMode = false;
          fabricJs.current.off("path:created");

          // Select the newly created path
          selectingItem(newId);
        });
        break;
    }
  };


  const resizeCanvas = (str: string, num: number) => {

    if (!canvasDivRef.current) {
      return
    }

    if (str === "ZoomIn") {
      // console.log("ZoomingIN", +canvasDivRef.current?.style.scale, num);
      canvasDivRef.current.style.scale = String(+canvasDivRef.current?.style.scale + num)
    } else if (str === "ZoomOut") {
      // console.log("ZoomingOUT", +canvasDivRef.current?.style.scale, num);
      canvasDivRef.current.style.scale = String(+canvasDivRef.current?.style.scale - num)
    } else {
      canvasDivRef.current.style.scale = String(num)
    }

  }



  return (
    <div id='imageEdittingContainer'  >
      {/* temporary */}
      {/* <ImageKitUploader/> */}

      <main className='flex gap-2'>
        <div className={`bg-[#262627] textColor flex max-md:w-[85%] fixed left-0 w-[400px] basis-[400px]  p-1 slidingGenerate ${slidingGenerateImage ? "slidingGenerateUpon" : "slidingGenerateCLosed"}`} style={{ height: `100vh`, zIndex: 9 }}>

          {slidingGenerateImage ?
            <>
              <ArrowLeftSquare onClick={() => setSlidingGenerateImage((prev) => !prev)} className='bg-gray-500 p-2 fixed top-12 left-1/1 textColor rounded-md tansform translate-x-1 cursor-pointer' size={35} style={{ zIndex: 99 }} />
            </>
            :
            <>
              <ArrowRightSquare onClick={() => setSlidingGenerateImage((prev) => !prev)} className='bg-gray-500 p-2 fixed top-12 left-1/1 textColor rounded-md tansform translate-x-1 cursor-pointer' size={35} style={{ zIndex: 99 }} />
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
            <label htmlFor="shape_insert" className='flex gap-2 bg-gray-600 rounded-md w-fit p-2 cursor-pointer ' onClick={addTextLayer}>
              <Text size={22} color='black' />
              <span>Text</span>
            </label>
            {/* shape */}
            <label htmlFor="shape_insert" className='flex gap-2 bg-gray-600 rounded-md w-fit p-2 cursor-pointer relative textColor'
              onClick={setStartShapeDrawing.bind(null, !startShapeDrawing)}
            >
              <ShapesIcon size={22} color='black' />
              <span>Insert</span>

              {startShapeDrawing && <div className='absolute bg-gray-600 rounded-md p-2 flex gap-2 flex-col right-0 top-0 z-10' id='shape_insert' style={{ transform: "translate(100%, 0px)" }}>
                <span onClick={() => onShapeClick({ type: "rectangle" })}>Rectangle</span>
                <span onClick={() => onShapeClick({ type: "circle" })}>Circle</span>
                <span onClick={() => onShapeClick({ type: "triangle" })}>Triangle</span>
              </div>

              }
            </label>

            <label className='flex gap-2 bg-gray-600 rounded-md w-fit p-2 cursor-pointer relative textColor'>
              <span onClick={() => onShapeClick({ type: "freeDrawing" })}>FreeDrawing</span>
            </label>

            <label className='flex gap-2 bg-gray-600 rounded-md w-fit p-2 cursor-pointer relative textColor'>
              <span onClick={() => onShapeClick({ type: "polyline" })}>Polyline</span>
            </label>


            {/* file  use same htmlFor and id in input for activating that*/}
            <label
              htmlFor='file' className='flex gap-2 bg-gray-600 rounded-md p-2 cursor-pointer w-full textColor'>
              {somethingDrop ?
                <>
                  <span className='block w-full rounded-md textColorr animate-pulse'>Drop Here</span>
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
            <label className='flex gap-2 bg-gray-600 rounded-md w-fit p-2 cursor-pointer' onClick={exporting}>
              <Download size={22} color='black' />
              <span>Export</span>

            </label>

            <PromptComponencts
              canvasOrientation={canvasOrientation} fabricJs={fabricJs} imageSetting={aiImageFn} state={state}
            />

          </div>

        </div>

        {/* CANVAS AREA */}
        <div
          className='bg-black flex-1 relative overflow-auto' style={{ height: `100vh`, overflow: "auto", scale: 1, }}>

          <div className='rounded-md bg-white p-2 flex fixed bottom-6 right-4' style={{ zIndex: 999 }}>
            <Plus color='black' onClick={() => resizeCanvas("ZoomIn", 0.1)} size={22} className='font-bold textColor cursor-pointer' />
            <Minus color='black' onClick={() => resizeCanvas("ZoomOut", 0.1)} size={22} className='font-bold textColor cursor-pointer' />
          </div>

          <div ref={canvasDivRef} className=' w-full h-full relative flex justify-center items-center' style={{ scale: 1 }}>
            <canvas onClick={(e) => e.stopPropagation()} id='fabricJsCanvas' className='outline-2 outline-dashed outline-amber-200' style={{ scale: 1, }} ref={canvasRef}>
            </canvas>
          </div>

        </div>

        {/* layer div */}
        <div className={`slidingLayer bg-gray-600/50 flex flex-col backdrop-blur-3xl max-md:w-[80%] w-[400px] p-1 fixed right-0 transform ${slidingLayer ? "slidingLayerUpon" : "slidingLayerCLosed"}`} style={{ height: `100vh` }}>

          <Layers onClick={() => setSlidingLayer((prev) => !prev)} className='bg-gray-500 p-2 absolute top-2 -left-2 textColor rounded-md tansform -translate-x-1/1 cursor-pointer' size={35} />

          <div className='bg-white font-bold flex p-0.5 justify-center items-center  textColor gap-2 rounded-md mt-1'>
            {["Layer", "Property"].map((v, i) => (
              <span key={v} onClick={() => setLayerMenu(v)} className={`font-bold  hover:bg-gray-400/50 text-black p-1 rounded-md cursor-pointer ${layerMenu === v ? "underline underline-offset-2" : ""}`}>{v}</span>
            ))}
          </div>

          {/* layer item */}
          <div className='flex-1 flex min-h-0 gap-2 flex-col'>

            {layerMenu === "Layer" &&
              <>
                <div className='flex w-full flex-col gap-2 mt-2 p-2 overflow-auto historyScrollbar'>
                  {/* slice is being use for shallow copy other wise sort will mutate the state  */}
                  {state.length > 0 && state.slice().sort((s, b) => b.order - s.order).map((v, i) => (
                    <div key={v.id} onClick={() => selectingItem(v.id)} className={` p-2 rounded-md bg-gray-700 hover:bg-gray-700/20 ${v.id === activeId ? "outline-1 outline-blue-400" : ""}`}>
                      <div>
                        <div className='flex justify-between'>
                          <input className='cursor-pointer' value={String(v.refrenceAiCheckBox)} type="checkbox" id='checkBox' onClick={(e) => {
                            e.stopPropagation();
                            checkingBox(v.id, e.currentTarget.checked)
                          }} />

                          <span className='cursor-pointer'>
                            {
                              <span>
                                {v.currentlyUploading === true ?
                                  <Loader2Icon size={22} color='white' className='animate-spin' />
                                  :
                                  <>
                                    <span>
                                      {v.geminaUploadData?.state === "ACTIVE" ?
                                        <CheckCircleIcon onClick={(e) => e.stopPropagation()} size={22} color='white' />
                                        :
                                        <UploadCloud size={22} color='white' onClick={(e) => {
                                          e.stopPropagation();
                                          uploadImageGemina(v.id)
                                        }} />
                                      }
                                    </span>
                                  </>}
                              </span>

                            }
                          </span>

                        </div>
                        <span className={`w-full flex gap-2 justify-between cursor-pointer p-2 rounded-md relative group/delete overflow-hidden`}>
                          <span className='line-clamp-2'>{v.id.slice(0, 10)}</span>
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

      </main >

      {aiEdit && createPortal(<EditTool aiImageFn={aiImageFn} fabricjs={fabricJs} selectedId={activeId} aiEditShowFn={setAiEdit} />, document.getElementById("imageEdittingContainer") || document.body)
      }
    </div >
  )
}

export default ProImageEditor