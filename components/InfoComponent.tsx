import React, { useEffect, useRef, useState } from 'react'
import { InfoProps, useContextStore } from './CreateContext'

export interface domRectProps extends DOMRect{
    translateX:number
}

type InfoComponentProps = Omit<InfoProps,"parentElement"> & domRectProps
function InfoComponent({infoDomRect}:{infoDomRect:InfoComponentProps}) {
   const infoCardRef = useRef<HTMLDivElement>(null);
   const {setInfo} = useContextStore()

   useEffect(()=>{
    console.log("infocardRef:--- --- ", infoCardRef);
    const infoCardHandler =  (e:MouseEvent)=>{
      console.log(e.target);
      console.log(infoCardRef.current);
      
      if(infoCardRef.current && !infoCardRef.current.contains(e.target as Node)){
        setInfo(null)
      }
    }

    if (infoCardRef) {
      document.addEventListener("mousedown",infoCardHandler)
    }

    return ()=>{
      // if passed same function reference as on the adding time then it remove on unmounting
      document.removeEventListener("mousedown",infoCardHandler)
    }
    
   },[infoCardRef])
    
  return (
    <div ref={infoCardRef} className='absolute text-white p-2 w-[200px] bg-black rounded-md' style={{zIndex:99, top:`${infoDomRect?.top}px` , left:`${infoDomRect?.left}px`, transform:`translate(-${infoDomRect?.translateX}%, -100%`}}>
        {infoDomRect.message}
    </div>
  )
}

export default InfoComponent