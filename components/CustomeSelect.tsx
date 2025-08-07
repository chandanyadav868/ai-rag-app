import { aspectRatioImage } from '@/constant';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { ChangeEvent, useState } from 'react'

function CustomeSelect({setAspectRation}:{setAspectRation?: (e:React.MouseEvent<HTMLLIElement>)=>void}) {
    const [aspectRatioDiv,setAspectRationDiv] = useState<boolean>(false);

  return (
    <div>
        <div onClick={()=>setAspectRationDiv((prev)=> !prev)} className='flex justify-between p-2 relative rounded-md bg-black text-white'>
            <span>Select Aspect</span>
            <span><ChevronDown className={`${aspectRatioDiv? "rotate-180":""}`} /></span>
        </div>
        {<div className={`bg-black select-none rounded-md mb-2 p-2 mt-0.5 text-white scale-100 ${aspectRatioDiv?"customeSelectDiv":"customeSelectDivFalse"}`}>
            <ul className='flex gap-2 flex-col'>
               {aspectRatioImage.map((v,i)=>(
               <li key={i} onClick={setAspectRation} className='customeSelectUlli'>{v.orientation}</li>
               ))} 
            </ul>
        </div> }
    </div>
  )
}

export default CustomeSelect