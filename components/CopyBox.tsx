import { Copy, CopyCheck } from 'lucide-react'
import React from 'react'

interface CopyBoxProps {
    copyRef: React.MutableRefObject<(HTMLParagraphElement | null)[]>;
    copying: { id: number, active: boolean } | undefined;
    copyToClipboard: (index: number) => void;
    text: string;
    index: number;
    width?:number | undefined
}

function CopyBox({ copyRef, copyToClipboard, copying, text, index,width }: CopyBoxProps) {    
    return (
        <div className={`shrink-0 outline-1 outline-white/10 backdrop-blur-2xl rounded-md mt-6 h-auto bg-white/10 mx-auto px-2 py-2 transform hover:-rotate-2 duration-300 ease-in-out`} style={{width:`${width}%`}}>
            {copying?.active && copying.id === index ?
                <CopyCheck color='green' className='relative left-[90%] cursor-pointer' style={{ zIndex: 55 }} />
                :
                <Copy onClick={() => copyToClipboard(index)} className='relative left-[90%] cursor-pointer' style={{ zIndex: 55 }} />
            }

            {/* // ref jo function hold kar rha hai wo turant call ho jata hai jab element render hota hai, current index ek array hai jisme humne har paragraph element ko store karna hai */}
            <p className='mt-2' ref={(el) => {(copyRef.current[index] = el)}}>{text}</p>
        </div>
    )
}

export default CopyBox