"use client";

import React, { createContext, RefObject, useContext, useEffect, useState } from 'react';

export interface StoreProps {
  portalElement: BoundingBoxProps | null | undefined;
  getBoundingBox: (e: React.MouseEvent<HTMLElement | SVGSVGElement, MouseEvent>, text: string, position: PortalPosition) => Promise<void>;
  setting: boolean,
  setSetting: (value: React.SetStateAction<boolean>) => void;
  systemInstructionDelete: (selected: string, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => void;
  systemInstructionAdding: (textAreaRef: RefObject<HTMLTextAreaElement>, inputRef: RefObject<HTMLInputElement>, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => void;
  setPortalElement: (value: React.SetStateAction<BoundingBoxProps | null | undefined>) => void
  systemInstruction: SystemInstructionProps[];
  setSystemInstruction: (data: React.SetStateAction<SystemInstructionProps[]>) => void;
  systemInstructionEdit: (selected: string, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => void;
  apiKey: SystemInstructionProps[]
  setApiKey: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>
  setState: React.Dispatch<React.SetStateAction<StateProps[]>>
  state: StateProps[]
  setError: React.Dispatch<React.SetStateAction<ErrorProps | undefined>>
  error: ErrorProps | undefined
  // setDemiState: React.Dispatch<React.SetStateAction<StateProps[]>>
  // demiState: StateProps[]
}

export interface SystemInstructionProps {
  id: string;
  text: string;
  tag: string;
  editable: boolean;
  date: Date;
  systemInstructionActive: boolean;
}

export interface ErrorProps {
  type: string;
  message: string;
}

type PortalPosition = "left" | "right" | "bottom" | "top"
type DataProps = Pick<SystemInstructionProps, 'text' | 'tag'>

// i have created a store, where all value will be stored and will be accessed in defferent components
export const Store = createContext<null | StoreProps>(null);



function ContextProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState<ErrorProps | undefined>();

  const [portalElement, setPortalElement] = useState<BoundingBoxProps | null>();
  const [systemInstruction, setSystemInstruction] = useState<SystemInstructionProps[]>(()=>{
     if (typeof window === "undefined") {
    return []; // server pe empty state
  }

  try {
    const saved = localStorage.getItem("systemInstructions");
    if (!saved) return [];
    
    const parsed: SystemInstructionProps[] = JSON.parse(saved);
    return parsed.map((v) => ({ ...v, date: new Date(v.date) }));
  } catch (err) {
    console.error("Error reading localStorage:", err);
    return [];
  }
  });

  const [apiKey, setApiKey] = useState<SystemInstructionProps[]>(()=>{
     if (typeof window === "undefined") {
    return []; // server pe empty state
  }

  try {
    const saved = localStorage.getItem("apiKeys");
    if (!saved) return [];
    
    const parsed: SystemInstructionProps[] = JSON.parse(saved);
    return parsed.map((v) => ({ ...v, date: new Date(v.date) }));
  } catch (err) {
    console.error("Error reading localStorage:", err);
    return [];
  }
  });

  useEffect(()=>{
    localStorage.setItem("apiKeys",JSON.stringify(apiKey)); 
  },[apiKey])

  useEffect(()=>{
    localStorage.setItem("systemInstructions",JSON.stringify(systemInstruction)); 
  },[systemInstruction])

  // setting function of imageEditing
  const [state, setState] = useState<StateProps[]>([]);
  // const [demiState, setDemiState] = useState<StateProps[]>([]);


  const id = crypto.randomUUID()

  // systemInstruction Methods like delete, edit etc...
  const systemInstructionAdding = (textAreaRef: RefObject<HTMLTextAreaElement>, inputRef: RefObject<HTMLInputElement>, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => {

    //check that ref attach correclty
    if (!textAreaRef.current || !inputRef.current) return

    // store text from input and textarea
    const data: DataProps = { text: textAreaRef.current?.value ?? "", tag: inputRef.current?.value ?? "" }
    // check tags and text have value if not then return value
    if (data.tag.trim().length === 0 || data.text.trim().length === 0) return;

    // this function is checking that any edit true value is done means its instruction is edited not made new instruction
    const editingInstruciton = array.find((v, i) => !!v.editable);
    console.log("editingInstruciton:- ", editingInstruciton);

    // if user edit its existing instruction then change will show in that only
    if (editingInstruciton) {
      setArray((prev) => prev.map((v, i) => !!v.editable ? ({ ...v, ...data, editable: false }) : v));
    } else {
      // if user made new then run this
      let values = { id, editable: false, text: data.text, tag: data.tag, systemInstructionActive: false, date: new Date() }
      // this will update the instruction 
      setArray((prev) => [values, ...prev]);
    }

    // this is for reset the input and textarea
    textAreaRef.current.value = ""
    inputRef.current.value = ""

  }

  // deleting instructions
  const systemInstructionDelete = (selected: string, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => {
    const restInstructions = array.filter((v, i) => v.id !== selected);
    setArray(restInstructions)
  }

  // editing instructions
  const systemInstructionEdit = (selected: string, array: SystemInstructionProps[], setArray: React.Dispatch<React.SetStateAction<SystemInstructionProps[]>>) => {
    setArray((prev) => prev.map((v, i) => v.id === selected ? { ...v, editable: true } : v));
  }

  // this methods is just for getting element ref and extraction neccessary data for rendering createPortal element and put it in the portalElement
  const getBoundingBox = async (e: React.MouseEvent<HTMLElement | SVGSVGElement, MouseEvent>, text: string, position: PortalPosition) => {
    const target = e.target as HTMLElement // just for getting all methods and poperty of HTML ELEMENT
    // this below methods tells where our element is positioned relative to the screen
    // bottom :- distance from top of element to the bottom of screen , left:- how much far element left part from left side of screen, right:- how much far distance of element right from left side of screen, top:- how much far top of element from top of screen, x: and y: is same left and top corresponding, height:- height of element not including margin, and width also same
    let { bottom, height, left, right, top, width, x, y } = target.getBoundingClientRect();

    const innerHeightDetails = window.innerHeight;
    const innerWidthDetails = window.innerWidth;

    console.log("b", bottom, "h", height, "l", left, "r", right, "t", top, "w", width, "x", x, "y", y, 'innerHeight', innerHeightDetails, 'innerWidthDetails', innerWidthDetails);

    let data = {} as BoundingBoxProps
    let translate = ''

    switch (position) {
      case "top":
        translate = `translate(calc(-50% - ${height / 2}px), -100%)`
        data = { bottom, height, left, right, top, width, x, y, text, translate }
        break;
      case "left":
        translate = `translate(calc(5%), -${height / 2}%)`
        data = { bottom, height, left, right, top, width, x, y, text, translate }
      default:
        break;
    }

    const portalVisible = setTimeout(() => {
      setPortalElement({ ...data })
    }, 1000)


    target.addEventListener("mouseleave", () => {
      setPortalElement(null);
      clearTimeout(portalVisible)
    })
  }





  // all methods which are going to be send to used in useContext
  const storeSendingData = {
    getBoundingBox, portalElement, setSetting, setting, systemInstructionDelete, systemInstructionAdding, systemInstruction, systemInstructionEdit, setSystemInstruction, setPortalElement, apiKey, setApiKey, state, setState, error, setError
    // demiState,setDemiState
  }


  return (
    <Store.Provider value={{ ...storeSendingData }}>{children}</Store.Provider>
  )
}

export default ContextProvider

// it is used for minimising bilore p
export const useContextStore = () => {
  const context = useContext(Store);
  if (!context) {
    console.log("Please configure the Store");
    throw new Error("Please configure the Store")
  };
  console.log(context);

  return context
}