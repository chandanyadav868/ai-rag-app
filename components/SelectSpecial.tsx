import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react'

interface SelectSpecialProps {
  setAspectRation:(e:React.MouseEvent<HTMLLIElement>)=>void,
  CustomeArray:string[],
  selectedText:string
}

function SelectSpecial({setAspectRation,CustomeArray,selectedText}:SelectSpecialProps) {
    const [aspectRatioDiv,setAspectRationDiv] = useState<boolean>(false);

  return (
    <div>
        <div onClick={()=>setAspectRationDiv((prev)=> !prev)} className='flex justify-between p-2 relative rounded-md bg-black text-white'>
            <span>{selectedText?.trim().length>0? selectedText:"Select"}</span>
            <span><ChevronDown className={`${aspectRatioDiv? "rotate-180":""}`} /></span>
        </div>
        {<div className={`bg-black select-none rounded-md mb-2 p-2 mt-0.5 text-white scale-100 max-h-[300px] overflow-y-auto historyScrollbar ${aspectRatioDiv?"customeSelectDiv":"customeSelectDivFalse"}`}>
            <ul className='flex gap-2 flex-col'>
               {CustomeArray.map((v,i)=>(
               <li key={i} onClick={setAspectRation} className='customeSelectUlli'>{v}</li>
               ))} 
            </ul>
        </div> }
    </div>
  )
}

export default SelectSpecial