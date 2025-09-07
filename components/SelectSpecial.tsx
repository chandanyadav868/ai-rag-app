import { ChevronDown, Dot } from 'lucide-react';
import { Span } from 'next/dist/trace';
import React, { useState } from 'react'

interface SelectSpecialProps {
  setAspectRation: (e: string) => void,
  CustomeArray: ModelProps[],
  selectedText: string
  className?: string
}

function SelectSpecial({ setAspectRation, CustomeArray, selectedText, className }: SelectSpecialProps) {
  const [aspectRatioDiv, setAspectRationDiv] = useState<boolean>(false);
  console.log("CustomeArray:- ", CustomeArray,selectedText);


  return (
    <div className='relative cursor-pointer'>
      <div onClick={() => setAspectRationDiv((prev) => !prev)} className='flex justify-between p-2 rounded-md bg-gray-800 text-white'>
        <span>{selectedText?.trim().length > 0 ? selectedText : "Select"}</span>
        <span><ChevronDown className={`${aspectRatioDiv ? "rotate-180" : ""}`} /></span>
      </div>

      {/* this is the select ui */}
      {<div className={`select-none z-50 absolute w-full rounded-md text-white scale-100 max-h-[300px] overflow-y-auto historyScrollbar ${aspectRatioDiv ? "customeSelectDiv" : "customeSelectDivFalse"} ${className}`}>
        <ul className='flex gap-1 flex-col'>
          {CustomeArray.map((v, i) => (
            <span onClick={(e) => {
              setAspectRationDiv(false)
              setAspectRation(v.name)
            }} className='flex justify-between px-2 customeSelectUlli items-center' key={i}>
              <li
                className=''>{v.name}</li>
              {v.new &&
                <div className='flex gap-2 items-center py-0 px-2'>
                  <Dot size={33} className='text-green-500 text-2xl' />
                  <span className='px-1 bg-black-500/20 outline-1 outline-white text-white rounded-md'>New</span>
                </div>
              }
            </span>
          ))}
        </ul>
      </div>}

    </div>
  )
}

export default SelectSpecial